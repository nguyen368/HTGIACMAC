using MassTransit;
using AURA.Services.MedicalRecord.Domain.Entities;
using AURA.Services.MedicalRecord.Infrastructure.Data;
using System.Net.Http.Json;
using System.Text.Json.Serialization;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using System;
using System.Threading.Tasks;

namespace AURA.Services.MedicalRecord.API.Consumers
{
    // [KHÔNG XÓA] Định nghĩa Event nội bộ để tránh lỗi thiếu Reference từ Shared Kernel
    public record ImageUploadedIntegrationEvent(Guid ImageId, string ImageUrl, Guid PatientId, Guid ClinicId, DateTime Timestamp);
    
    public record AnalysisCompletedEvent(Guid ExaminationId, Guid ClinicId, Guid PatientId, string RiskLevel, double RiskScore, string Diagnosis, string HeatmapUrl);

    public class AiResponse
    {
        [JsonPropertyName("status")] public string Status { get; set; } = string.Empty;
        [JsonPropertyName("diagnosis")] public string Diagnosis { get; set; } = string.Empty;
        [JsonPropertyName("risk_score")] public double RiskScore { get; set; }
        [JsonPropertyName("risk_level")] public string RiskLevel { get; set; } = string.Empty;
        [JsonPropertyName("heatmap_url")] public string HeatmapUrl { get; set; } = string.Empty;
    }

    public class ImageUploadedConsumer : IConsumer<ImageUploadedIntegrationEvent>
    {
        private readonly MedicalDbContext _context;
        private readonly IHttpClientFactory _httpClientFactory;
        private readonly ILogger<ImageUploadedConsumer> _logger;
        private readonly IPublishEndpoint _publishEndpoint;

        public ImageUploadedConsumer(MedicalDbContext context, IHttpClientFactory httpClientFactory, ILogger<ImageUploadedConsumer> logger, IPublishEndpoint publishEndpoint)
        {
            _context = context;
            _httpClientFactory = httpClientFactory;
            _logger = logger;
            _publishEndpoint = publishEndpoint;
        }

        public async Task Consume(ConsumeContext<ImageUploadedIntegrationEvent> context)
        {
            var msg = context.Message;
            _logger.LogInformation($"[WORKFLOW] Bắt đầu xử lý ảnh {msg.ImageId} cho BN {msg.PatientId}");

            try
            {
                // 1. Kiểm tra trùng lặp bản ghi (Idempotency Check)
                var existingExam = await _context.Examinations.FirstOrDefaultAsync(e => e.ImageId == msg.ImageId);
                if (existingExam != null) return;

                // =========================================================================================
                // [PHẦN MỚI - LOGIC TỰ SỬA LỖI]: Xử lý Missing Patient & Missing ClinicId
                // =========================================================================================
                
                var patient = await _context.Patients.FirstOrDefaultAsync(p => p.Id == msg.PatientId || p.UserId == msg.PatientId);

                // Ưu tiên lấy ClinicId từ DB, nếu không có lấy từ Message, đường cùng thì lấy ID cứng
                var fixedClinicId = Guid.Parse("7538ae31-a8e1-48e9-9c6d-340da15cf1e2");
                var finalClinicId = (patient != null && patient.ClinicId != Guid.Empty) ? patient.ClinicId : 
                                    (msg.ClinicId != Guid.Empty ? msg.ClinicId : fixedClinicId);

                // [AUTO-FIX 1]: Nếu chưa có bệnh nhân, tự tạo mới ngay lập tức
                if (patient == null)
                {
                    _logger.LogWarning($"[AUTO-HEAL] Bệnh nhân {msg.PatientId} chưa tồn tại. Đang tự động tạo mới...");
                    
                    // [FIX QUAN TRỌNG]: Dùng Constructor thay vì Object Initializer { ... }
                    // Vì các thuộc tính trong Entity Patient là 'private set', không thể gán trực tiếp.
                    patient = new Patient(
                        userId: msg.PatientId,
                        clinicId: finalClinicId,
                        fullName: "Bệnh nhân mới (Đang cập nhật)",
                        dateOfBirth: DateTime.UtcNow.AddYears(-25),
                        gender: "Unknown",
                        phoneNumber: "0000000000",
                        address: "Chưa cập nhật địa chỉ",
                        email: "system_generated@aura.local"
                    );

                    _context.Patients.Add(patient);
                    await _context.SaveChangesAsync(); // Lưu Patient trước để làm gốc cho Examination
                }
                else
                {
                    // Nếu bệnh nhân đã có nhưng ClinicId bị sai/rỗng, code này để logic xử lý sau (vì private set không sửa trực tiếp được ở đây nếu ko có method Update)
                    // Nếu cần update, hãy gọi patient.UpdateInfo(...)
                }

                // =========================================================================================
                // [KẾT THÚC PHẦN TỰ SỬA LỖI]
                // =========================================================================================

                // Tạo ca khám mới
                // Sử dụng Constructor 5 tham số đã khai báo trong Examination.cs
                var examination = new Examination(
                    msg.ImageId,     // Id (dùng luôn ImageId làm Id của Examination)
                    patient.Id,      // PatientId
                    finalClinicId,   // ClinicId
                    msg.ImageUrl,    // ImageUrl
                    msg.Timestamp    // ExamDate
                );
                
                // Gán các giá trị bổ sung (đã được public set hoặc có method hỗ trợ)
                examination.DoctorNotes = string.Empty; 
                examination.Diagnosis = "Đang phân tích...";
                examination.Status = "Pending";

                _context.Examinations.Add(examination);
                await _context.SaveChangesAsync();

                // 2. GỌI AI SERVICE ĐỂ PHÂN TÍCH
                var client = _httpClientFactory.CreateClient();
                var aiUrl = "http://ai-core-service:8000/api/ai/auto-diagnosis";
                var payload = new { 
                    file_name = $"{msg.ImageId}.jpg", 
                    image_url = msg.ImageUrl, 
                    patient_id = msg.PatientId.ToString() 
                };
                
                var response = await client.PostAsJsonAsync(aiUrl, payload);
                if (response.IsSuccessStatusCode)
                {
                    var result = await response.Content.ReadFromJsonAsync<AiResponse>();
                    if (result != null)
                    {
                        // [FIX LỖI 4500%]: Chuẩn hóa điểm số rủi ro về hệ thập phân (0.0 -> 1.0)
                        double normalizedScore = result.RiskScore > 1 ? result.RiskScore / 100 : result.RiskScore;

                        // Cập nhật kết quả AI vào bản ghi ca khám
                        examination.UpdateAiResult(result.RiskLevel, result.Diagnosis, normalizedScore, result.HeatmapUrl);
                        // Trạng thái sẽ tự chuyển sang Analyzed bên trong hàm UpdateAiResult
                        
                        _context.Examinations.Update(examination);
                        await _context.SaveChangesAsync();

                        _logger.LogInformation($"[AI SUCCESS] Examination {examination.Id} updated. Score: {normalizedScore}");

                        // 3. PHÁT TÁN SỰ KIỆN: Gửi sang Notification Service
                        await _publishEndpoint.Publish(new AnalysisCompletedEvent(
                            examination.Id, 
                            finalClinicId, 
                            msg.PatientId, 
                            result.RiskLevel, 
                            normalizedScore,
                            result.Diagnosis,
                            result.HeatmapUrl));
                    }
                }
                else
                {
                    _logger.LogError($"[AI ERROR] AI Service trả về mã lỗi: {response.StatusCode}");
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Lỗi nghiêm trọng trong quá trình xử lý ImageUploadedConsumer");
            }
        }
    }
}