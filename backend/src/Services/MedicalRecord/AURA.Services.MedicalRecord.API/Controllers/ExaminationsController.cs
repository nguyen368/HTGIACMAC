using AURA.Services.MedicalRecord.Application.DTOs;
using AURA.Services.MedicalRecord.Domain.Entities;
using AURA.Services.MedicalRecord.Infrastructure.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace AURA.Services.MedicalRecord.API.Controllers
{
    [ApiController]
    [Route("api/medical-records/examinations")]
    public class ExaminationsController : ControllerBase
    {
        private readonly MedicalDbContext _context;

        public ExaminationsController(MedicalDbContext context)
        {
            _context = context;
        }

        // =========================================================================
        // PHẦN 1: API CHO CLINIC WEB (SỬA LỖI PROPERTY)
        // =========================================================================

        // [POST] Tạo mới/Lưu kết quả khám
        [HttpPost]
        public async Task<IActionResult> CreateExamination([FromBody] CreateExaminationRequest request)
        {
            if (request.PatientId == Guid.Empty) return BadRequest("PatientId is required");

            var examination = new Examination(
                request.PatientId,
                request.ImageId,
                request.Diagnosis,
                request.DoctorNotes,
                request.DoctorId
            );

            _context.Examinations.Add(examination);
            await _context.SaveChangesAsync();

            return Ok(new { Message = "Đã lưu kết quả khám thành công", Id = examination.Id });
        }

        // [GET] Lấy chi tiết ca khám - FIX LỖI AiDiagnosis
        [HttpGet("{id}")]
        public async Task<IActionResult> GetExaminationById(Guid id)
        {
            var exam = await _context.Examinations
                .Include(e => e.Patient)
                .FirstOrDefaultAsync(e => e.Id == id);

            if (exam == null) return NotFound(new { Message = "Không tìm thấy hồ sơ khám" });

            var age = exam.Patient != null ? (DateTime.UtcNow.Year - exam.Patient.DateOfBirth.Year) : 0;

            return Ok(new 
            {
                exam.Id,
                exam.PatientId,
                PatientName = exam.Patient?.FullName ?? "Unknown",
                Age = age,
                Gender = exam.Patient?.Gender ?? "Unknown",
                ImageUrl = exam.ImageUrl, 
                exam.Status,
                exam.ExamDate,
                exam.DoctorNotes,
                DiagnosisResult = exam.Diagnosis // Sử dụng trường Diagnosis chính
                // Nếu Entity của bạn có trường AI riêng, hãy đổi thành exam.TenTruongDo
            });
        }

        // [GET] Danh sách chờ khám
        [HttpGet("queue")]
        public async Task<IActionResult> GetExaminationQueue([FromQuery] string? searchTerm)
        {
            var query = _context.Examinations
                .Include(e => e.Patient)
                .Where(e => e.Status == "Pending" || e.Status == "Analyzed" || e.Status == "Verified")
                .AsNoTracking();

            if (!string.IsNullOrEmpty(searchTerm))
            {
                query = query.Where(e => e.Patient.FullName.Contains(searchTerm) || e.Id.ToString().Contains(searchTerm));
            }

            var results = await query
                .OrderByDescending(e => e.ExamDate)
                .Select(e => new ExaminationQueueDto
                {
                    Id = e.Id,
                    PatientId = e.PatientId,
                    PatientName = e.Patient != null ? e.Patient.FullName : "Unknown",
                    ImageUrl = e.ImageUrl,
                    ExamDate = e.ExamDate,
                    Status = e.Status
                })
                .ToListAsync();

            return Ok(results);
        }

        // [GET] Thống kê Dashboard
        [HttpGet("stats")]
        public async Task<IActionResult> GetStats()
        {
            var today = DateTime.UtcNow.Date;
            var totalPatients = await _context.Patients.CountAsync();
            var pendingExams = await _context.Examinations.CountAsync(e => e.Status == "Pending");
            var completedToday = await _context.Examinations.CountAsync(e => e.Status == "Verified" && e.ExamDate >= today);
            var highRisk = await _context.Examinations.CountAsync(e => e.Diagnosis != "Bình thường" && !string.IsNullOrEmpty(e.Diagnosis));

            return Ok(new { TotalPatients = totalPatients, PendingExams = pendingExams, CompletedToday = completedToday, HighRiskCases = highRisk });
        }

        // [PUT] Xác thực hồ sơ (Dùng method ConfirmDiagnosis có sẵn của bạn)
        [HttpPut("{id}/verify")]
        public async Task<IActionResult> VerifyExamination(Guid id, [FromBody] ConfirmDiagnosisRequest request)
        {
            var exam = await _context.Examinations.FindAsync(id);
            if (exam == null) return NotFound("Không tìm thấy ca khám.");

            try
            {
                // Gọi method nghiệp vụ đã có trong Entity Examination
                exam.ConfirmDiagnosis(request.DoctorNotes, request.FinalDiagnosis);
                await _context.SaveChangesAsync();
                return Ok(new { Message = "Bác sĩ đã duyệt thành công" });
            }
            catch (Exception ex)
            {
                return BadRequest(new { Error = "Lỗi trạng thái", Detail = ex.Message });
            }
        }

        // =========================================================================
        // PHẦN 2: API CŨ (GIỮ NGUYÊN)
        // =========================================================================

        [HttpPost("fake")]
        public async Task<IActionResult> CreateFakeData(Guid patientId)
        {
            var fakeExam = new Examination(patientId, "https://via.placeholder.com/150");
            _context.Examinations.Add(fakeExam);
            await _context.SaveChangesAsync();
            return Ok(new { Message = "Đã tạo ca khám giả thành công!", ExamId = fakeExam.Id });
        }

        [HttpPut("{id}/ai-result")]
        public async Task<IActionResult> UpdateAiResult(Guid id, [FromBody] string aiResult)
        {
            var exam = await _context.Examinations.FindAsync(id);
            if (exam == null) return NotFound("Không tìm thấy ca khám.");
            try {
                exam.UpdateAiResult(aiResult);
                await _context.SaveChangesAsync();
                return Ok(new { Message = "Đã cập nhật AI thành công" });
            } catch (Exception ex) {
                return BadRequest(ex.Message);
            }
        }
    }
}