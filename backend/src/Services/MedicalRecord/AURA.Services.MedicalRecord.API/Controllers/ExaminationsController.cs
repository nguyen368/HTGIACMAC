using AURA.Services.MedicalRecord.Application.DTOs;
using AURA.Services.MedicalRecord.Domain.Entities;
using AURA.Services.MedicalRecord.Infrastructure.Data;
using AURA.Shared.Messaging.Events; 
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MassTransit; 
using System.Security.Claims;

namespace AURA.Services.MedicalRecord.API.Controllers
{
    // DTO để nhận dữ liệu từ AI (Fix dứt điểm lỗi ConfidenceScore = 0 do sai kiểu dữ liệu dynamic)
    public class AiResultRequest {
        public string PredictionResult { get; set; } = string.Empty;
        public double ConfidenceScore { get; set; }
        public string RiskLevel { get; set; } = string.Empty;
        public string HeatmapUrl { get; set; } = string.Empty;
    }

    // Record này dùng để gửi tin nhắn sang dịch vụ Notification để cập nhật Dashboard real-time
    public record AnalysisCompletedEvent(Guid ExaminationId, Guid ClinicId, Guid PatientId, string RiskLevel, double RiskScore);

    [ApiController]
    [Route("api/medical-records/examinations")]
    public class ExaminationsController : ControllerBase
    {
        private readonly MedicalDbContext _context;
        private readonly IPublishEndpoint _publishEndpoint;

        public ExaminationsController(MedicalDbContext context, IPublishEndpoint publishEndpoint)
        {
            _context = context;
            _publishEndpoint = publishEndpoint;
        }

        // --- 1. THỐNG KÊ DASHBOARD (Lấy dữ liệu cho trang Clinic Dashboard) ---
        [HttpGet("stats")]
        public async Task<IActionResult> GetStats([FromQuery] Guid? clinicId)
        {
            var finalClinicId = clinicId;
            // Ưu tiên lấy ClinicId từ Token nếu query không có
            if (!finalClinicId.HasValue || finalClinicId == Guid.Empty)
            {
                var clinicClaim = User.FindFirst("ClinicId")?.Value ?? User.FindFirst("clinic_id")?.Value;
                if (Guid.TryParse(clinicClaim, out var parsedId)) finalClinicId = parsedId;
            }

            if (!finalClinicId.HasValue) return BadRequest("Không xác định được phòng khám.");

            var query = _context.Examinations.Where(e => e.ClinicId == finalClinicId.Value);

            return Ok(new { 
                Summary = new { 
                    TotalPatients = await _context.Patients.CountAsync(p => p.ClinicId == finalClinicId.Value), 
                    TotalScans = await query.CountAsync(),
                    PendingExams = await query.CountAsync(e => e.Status == "Pending" || e.Status == "Analyzed"),
                    HighRiskCases = await query.CountAsync(e => e.AiRiskLevel == "High") 
                },
                RecentActivity = await query
                    .Include(e => e.Patient)
                    .OrderByDescending(e => e.ExamDate)
                    .Take(5) // Lấy 5 hoạt động mới nhất
                    .Select(e => new {
                        Id = e.Id,
                        PatientName = e.Patient != null ? e.Patient.FullName : "Unknown",
                        Status = e.Status,
                        ExamDate = e.ExamDate
                    }).ToListAsync()
            });
        }

        // --- 2. TẠO CA KHÁM (Hỗ trợ Smart Search Bệnh nhân) ---
        [HttpPost]
        public async Task<IActionResult> CreateExamination([FromBody] CreateExaminationRequest request)
        {
            if (request.PatientId == Guid.Empty) return BadRequest("PatientId is required");

            // TÌM KIẾM THÔNG MINH: Tìm theo cả PK (Id) và UserId của bệnh nhân để tránh lỗi lệch ID
            var patient = await _context.Patients
                .FirstOrDefaultAsync(p => p.Id == request.PatientId || p.UserId == request.PatientId);

            if (patient == null) {
                return BadRequest($"Không tìm thấy hồ sơ bệnh nhân cho ID: {request.PatientId}");
            }

            var examination = new Examination(
                patient.Id, 
                request.ImageId, 
                request.Diagnosis ?? "Chờ AI phân tích", 
                request.DoctorNotes ?? "Hệ thống khởi tạo tự động", 
                request.DoctorId
            );
            
            examination.ClinicId = patient.ClinicId;
            examination.ImageUrl = request.ImageUrl ?? ""; // Lưu URL ảnh để hiển thị ngay trên Dashboard

            _context.Examinations.Add(examination);
            await _context.SaveChangesAsync();

            return Ok(new { Message = "Tạo ca khám thành công", Id = examination.Id });
        }

        // --- 3. CẬP NHẬT KẾT QUẢ TỪ AI (Fix đồng bộ & Trạng thái Rejected) ---
        [HttpPut("ai-update/{imageId}")]
        public async Task<IActionResult> UpdateAiResult(Guid imageId, [FromBody] AiResultRequest request)
        {
            var exam = await _context.Examinations.FirstOrDefaultAsync(e => e.ImageId == imageId);
            if (exam == null) return NotFound();

            // Cập nhật kết quả AI vào Database (Sử dụng DTO giúp gán chính xác các trường dữ liệu)
            exam.AiDiagnosis = request.PredictionResult;
            exam.AiRiskScore = request.ConfidenceScore;
            exam.AiRiskLevel = request.RiskLevel;
            exam.HeatmapUrl = request.HeatmapUrl;

            // Logic trạng thái sinh học: Nếu AI từ chối (do không phải võng mạc), đặt trạng thái Rejected
            if (request.RiskLevel == "Rejected") {
                exam.Status = "Rejected";
            } else {
                exam.Status = "Analyzed";
            }

            await _context.SaveChangesAsync();

            // PHÁT TÁN SỰ KIỆN: Để Notification Service gửi SignalR cập nhật Dashboard bác sĩ ngay lập tức
            await _publishEndpoint.Publish(new AnalysisCompletedEvent(
                exam.Id, 
                exam.ClinicId, 
                exam.PatientId, 
                exam.AiRiskLevel ?? "Low", 
                exam.AiRiskScore ?? 0
            ));

            return Ok();
        }

        // --- 4. LẤY CHI TIẾT CA KHÁM (Cung cấp dữ liệu cho Xem chi tiết & PDF) ---
        // ĐÃ SỬA: Hỗ trợ tìm kiếm bằng cả ID Ca khám hoặc ID Hình ảnh (Fix lỗi Gallery)
        [HttpGet("{id}")]
        public async Task<IActionResult> GetExaminationById(Guid id)
        {
            // SỬA Ở ĐÂY: Thêm điều kiện || e.ImageId == id
            var exam = await _context.Examinations
                .Include(e => e.Patient)
                .FirstOrDefaultAsync(e => e.Id == id || e.ImageId == id);

            if (exam == null) return NotFound();
            
            var age = exam.Patient != null ? (DateTime.UtcNow.Year - exam.Patient.DateOfBirth.Year) : 0;
            
            return Ok(new {
                exam.Id, 
                exam.PatientId,
                // Trả về ImageId để Frontend có thể đối chiếu nếu cần
                exam.ImageId, 
                PatientName = exam.Patient?.FullName ?? "Unknown",
                Age = age, 
                Gender = exam.Patient?.Gender ?? "Unknown", 
                exam.ImageUrl, 
                exam.Status, 
                exam.ExamDate, 
                exam.DoctorNotes,
                // Ưu tiên hiển thị chẩn đoán cuối của bác sĩ nếu ca khám đã hoàn tất (Verified)
                DiagnosisResult = exam.Status == "Verified" ? exam.Diagnosis : (exam.AiDiagnosis ?? exam.Diagnosis),
                AiRiskScore = exam.AiRiskScore ?? 0,
                exam.AiRiskLevel, 
                exam.HeatmapUrl
            });
        }

        // --- 5. HÀNG CHỜ KHÁM (Lọc danh sách ca khám theo phòng khám) ---
        [HttpGet("queue")]
        public async Task<IActionResult> GetExaminationQueue([FromQuery] Guid? clinicId, [FromQuery] string? searchTerm)
        {
            var query = _context.Examinations.Include(e => e.Patient)
                .Where(e => e.Status == "Pending" || e.Status == "Analyzed")
                .AsNoTracking();

            if (clinicId.HasValue) 
                query = query.Where(e => e.Patient != null && e.Patient.ClinicId == clinicId.Value);
            
            if (!string.IsNullOrEmpty(searchTerm)) 
                query = query.Where(e => e.Patient.FullName.Contains(searchTerm));

            var results = await query.OrderByDescending(e => e.AiRiskScore).ThenBy(e => e.ExamDate)
                .Select(e => new ExaminationQueueDto {
                    Id = e.Id, 
                    PatientId = e.PatientId, 
                    PatientName = e.Patient != null ? e.Patient.FullName : "Unknown",
                    ImageUrl = e.ImageUrl, 
                    ExamDate = e.ExamDate, 
                    Status = e.Status,
                    AiDiagnosis = e.AiDiagnosis ?? "Đang chờ AI...", 
                    AiRiskLevel = e.AiRiskLevel ?? "Low", 
                    AiRiskScore = e.AiRiskScore ?? 0
                }).ToListAsync();

            return Ok(results);
        }

        // --- 6. BÁC SĨ DUYỆT (Quy trình Human-in-the-loop - Hoàn tất ca khám) ---
        [HttpPut("{id}/verify")]
        public async Task<IActionResult> VerifyExamination(Guid id, [FromBody] ConfirmDiagnosisRequest request)
        {
            var exam = await _context.Examinations.FindAsync(id);
            if (exam == null) return NotFound();

            // Cập nhật chẩn đoán xác minh bởi bác sĩ và gán ID bác sĩ thực hiện
            exam.ConfirmDiagnosis(request.DoctorNotes, request.FinalDiagnosis, request.DoctorId);
            
            await _context.SaveChangesAsync();

            // Gửi sự kiện để thông báo cho bệnh nhân qua Notification Service
            await _publishEndpoint.Publish(new DiagnosisVerifiedEvent(
                exam.Id, 
                exam.PatientId, 
                request.FinalDiagnosis, 
                request.DoctorNotes, 
                DateTime.UtcNow
            ));

            return Ok(new { Message = "Duyệt kết quả thành công" });
        }
    }
}