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
    // [CẬP NHẬT]: Bổ sung thêm Diagnosis và HeatmapUrl vào sự kiện để Notification Hub có đủ dữ liệu hiển thị ngay
    public record AnalysisCompletedEvent(Guid ExaminationId, Guid ClinicId, Guid PatientId, string RiskLevel, double RiskScore, string Diagnosis, string HeatmapUrl);

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

            // Lọc trực tiếp trên bảng Examinations để đảm bảo tính chính xác
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
                    .Take(5) 
                    .Select(e => new {
                        Id = e.Id,
                        PatientName = e.Patient != null ? e.Patient.FullName : "Khách vãng lai",
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

            // [KIỂM TRA TRÙNG LẶP]: Tránh hiện 2 kết quả khác nhau do tạo 2 bản ghi cho cùng 1 ảnh
            var existingExam = await _context.Examinations.FirstOrDefaultAsync(e => e.ImageId == request.ImageId);
            if (existingExam != null) return Ok(new { Message = "Ca khám đã tồn tại", Id = existingExam.Id });

            // TÌM KIẾM THÔNG MINH: Tìm theo cả PK (Id) và UserId của bệnh nhân
            var patient = await _context.Patients
                .FirstOrDefaultAsync(p => p.Id == request.PatientId || p.UserId == request.PatientId);

            if (patient == null) {
                return BadRequest($"Không tìm thấy hồ sơ bệnh nhân cho ID: {request.PatientId}");
            }

            // [QUAN TRỌNG]: Lấy ClinicId trực tiếp từ hồ sơ bệnh nhân trong DB để tránh bị ClinicId rỗng
            var examination = new Examination(
                request.ImageId, 
                patient.Id, 
                patient.ClinicId, // ClinicId chính xác từ DB
                request.ImageUrl ?? "", 
                DateTime.UtcNow
            );
            
            // Gán các giá trị mặc định cho ca khám mới
            examination.Diagnosis = request.Diagnosis ?? "Chờ AI phân tích";
            examination.DoctorNotes = request.DoctorNotes ?? "Hệ thống khởi tạo tự động";
            examination.DoctorId = request.DoctorId;

            _context.Examinations.Add(examination);
            await _context.SaveChangesAsync();

            return Ok(new { Message = "Tạo ca khám thành công", Id = examination.Id });
        }

        // --- 3. CẬP NHẬT KẾT QUẢ TỪ AI (Fix đồng bộ & Trạng thái Rejected) ---
        [HttpPut("ai-update/{imageId}")]
        public async Task<IActionResult> UpdateAiResult(Guid imageId, [FromBody] AiResultRequest request)
        {
            // Tìm theo cả ImageId hoặc Id để chắc chắn khớp bản ghi
            var exam = await _context.Examinations.FirstOrDefaultAsync(e => e.ImageId == imageId || e.Id == imageId);
            if (exam == null) return NotFound();

            // [FIX LỖI 4500%]: Chuẩn hóa điểm tin cậy/rủi ro về khoảng 0.0 - 1.0
            double normalizedScore = request.ConfidenceScore > 1 ? request.ConfidenceScore / 100 : request.ConfidenceScore;

            // [FIX LỖI MẤT KẾT QUẢ]: Gán kết quả chẩn đoán AI vào trường AiDiagnosis
            exam.AiDiagnosis = string.IsNullOrEmpty(request.PredictionResult) ? "Không phát hiện bất thường" : request.PredictionResult;
            exam.AiRiskScore = normalizedScore;
            exam.AiRiskLevel = request.RiskLevel;
            exam.HeatmapUrl = request.HeatmapUrl;

            // Logic trạng thái: Nếu AI từ chối (do không phải võng mạc), đặt trạng thái Rejected
            if (request.RiskLevel == "Rejected") {
                exam.Status = "Rejected";
            } else {
                exam.Status = "Analyzed";
            }

            await _context.SaveChangesAsync();

            // PHÁT TÁN SỰ KIỆN: Gửi đầy đủ kết quả để Dashboard bác sĩ cập nhật ngay mà không cần nhấn F5
            await _publishEndpoint.Publish(new AnalysisCompletedEvent(
                exam.Id, 
                exam.ClinicId, 
                exam.PatientId, 
                exam.AiRiskLevel ?? "Low", 
                normalizedScore,
                exam.AiDiagnosis,
                exam.HeatmapUrl ?? ""
            ));

            return Ok();
        }

        // --- 4. LẤY CHI TIẾT CA KHÁM (Cung cấp dữ liệu cho Xem chi tiết & PDF) ---
        [HttpGet("{id}")]
        public async Task<IActionResult> GetExaminationById(Guid id)
        {
            var exam = await _context.Examinations
                .Include(e => e.Patient)
                .FirstOrDefaultAsync(e => e.Id == id || e.ImageId == id);

            if (exam == null) return NotFound();
            
            var age = exam.Patient != null ? (DateTime.UtcNow.Year - exam.Patient.DateOfBirth.Year) : 0;
            
            return Ok(new {
                exam.Id, 
                exam.PatientId,
                exam.ImageId, 
                PatientName = exam.Patient?.FullName ?? "Unknown",
                Age = age, 
                Gender = exam.Patient?.Gender ?? "Unknown", 
                exam.ImageUrl, 
                exam.Status, 
                exam.ExamDate, 
                exam.DoctorNotes,
                // [THỐNG NHẤT KẾT QUẢ]: Ưu tiên kết quả bác sĩ (nếu có), nếu không lấy kết quả AI
                DiagnosisResult = exam.Status == "Verified" ? exam.Diagnosis : (exam.AiDiagnosis ?? "Đang phân tích..."),
                AiRiskScore = exam.AiRiskScore ?? 0,
                exam.AiRiskLevel, 
                exam.HeatmapUrl
            });
        }

        // --- 5. HÀNG CHỜ KHÁM (Lọc danh sách ca khám theo phòng khám) ---
        [HttpGet("queue")]
        public async Task<IActionResult> GetExaminationQueue([FromQuery] Guid? clinicId, [FromQuery] string? searchTerm)
        {
            // Tự động xác định ClinicId của bác sĩ đang đăng nhập nếu không truyền vào query
            var searchClinicId = clinicId;
            if (!searchClinicId.HasValue || searchClinicId == Guid.Empty)
            {
                var clinicClaim = User.FindFirst("ClinicId")?.Value ?? User.FindFirst("clinic_id")?.Value;
                if (Guid.TryParse(clinicClaim, out var parsedId)) searchClinicId = parsedId;
            }

            var query = _context.Examinations.Include(e => e.Patient).AsQueryable();

            // [QUAN TRỌNG]: Lọc trực tiếp bằng ClinicId lưu trong ca khám để đảm bảo dữ liệu hiện ra trang Clinic
            if (searchClinicId.HasValue && searchClinicId != Guid.Empty)
            {
                query = query.Where(e => e.ClinicId == searchClinicId.Value);
            }

            // Chỉ lấy các ca đang chờ hoặc đã phân tích xong
            query = query.Where(e => e.Status == "Pending" || e.Status == "Analyzed");

            if (!string.IsNullOrEmpty(searchTerm)) 
                query = query.Where(e => e.Patient != null && e.Patient.FullName.Contains(searchTerm));

            var results = await query.OrderByDescending(e => e.ExamDate)
                .Select(e => new ExaminationQueueDto {
                    Id = e.Id, 
                    PatientId = e.PatientId, 
                    // Nếu thông tin bệnh nhân bị lỗi, hiện "Khách vãng lai" để vẫn xem được hồ sơ
                    PatientName = e.Patient != null ? e.Patient.FullName : "Khách vãng lai",
                    ImageUrl = e.ImageUrl, 
                    ExamDate = e.ExamDate, 
                    Status = e.Status,
                    // Đồng bộ chẩn đoán hiển thị trong danh sách (Sử dụng kết quả AI)
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