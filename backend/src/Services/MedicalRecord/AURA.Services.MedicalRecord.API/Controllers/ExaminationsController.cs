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

        // --- 1. LẤY HÀNG CHỜ KHÁM ---
        [HttpGet("queue")]
        public async Task<IActionResult> GetQueue()
        {
            var queue = await _context.Examinations
                .Include(e => e.Patient)
                .Where(e => e.Status == "Pending" || e.Status == "ImageUploaded")
                .OrderBy(e => e.ExamDate)
                .Select(e => new 
                {
                    e.Id,
                    PatientName = e.Patient.FullName,
                    Gender = e.Patient.Gender,
                    e.ExamDate,
                    e.Status,
                    e.ImageUrl
                })
                .ToListAsync();

            return Ok(queue);
        }

        // --- 2. TẠO MỚI HOẶC LƯU KẾT QUẢ KHÁM (Full Info) ---
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

        // --- 3. LẤY CHI TIẾT CA KHÁM ---
        [HttpGet("{id}")]
        public async Task<IActionResult> GetExaminationById(Guid id)
        {
            var exam = await _context.Examinations
                .Include(e => e.Patient)
                .FirstOrDefaultAsync(e => e.Id == id);

            if (exam == null) return NotFound(new { Message = "Không tìm thấy hồ sơ khám" });

            var age = DateTime.UtcNow.Year - exam.Patient.DateOfBirth.Year;

            return Ok(new 
            {
                exam.Id,
                PatientName = exam.Patient.FullName,
                Age = age,
                Gender = exam.Patient.Gender,
                ImageUrl = exam.ImageUrl, 
                exam.Status,
                exam.ExamDate,
                exam.DoctorNotes,
                DiagnosisResult = exam.Diagnosis 
            });
        }

        // --- 4. CẬP NHẬT CHẨN ĐOÁN ---
        [HttpPut("{id}/diagnosis")]
        public async Task<IActionResult> UpdateDiagnosis(Guid id, [FromBody] UpdateDiagnosisRequest request)
        {
            var exam = await _context.Examinations.FindAsync(id);
            if (exam == null) return NotFound(new { Message = "Không tìm thấy ca khám" });

            // Sử dụng method của Entity để đảm bảo logic State Pattern
            exam.ConfirmDiagnosis(request.DoctorNotes, request.Diagnosis);

            await _context.SaveChangesAsync();
            return Ok(new { Message = "Cập nhật kết quả thành công" });
        }

        // --- 5. DASHBOARD STATS ---
        [HttpGet("stats")]
        public async Task<IActionResult> GetStats()
        {
            var today = DateTime.UtcNow.Date;

            var totalPatients = await _context.Patients.CountAsync();
            var pendingExams = await _context.Examinations.CountAsync(e => e.Status == "Pending");
            
            var completedToday = await _context.Examinations
                .CountAsync(e => (e.Status == "Completed" || e.Status == "Verified") && e.ExamDate >= today);

            var highRisk = await _context.Examinations
                .CountAsync(e => (e.Status == "Completed" || e.Status == "Verified") 
                                 && e.Diagnosis != "Bình thường" 
                                 && !string.IsNullOrEmpty(e.Diagnosis));

            return Ok(new 
            {
                TotalPatients = totalPatients,
                PendingExams = pendingExams,
                CompletedToday = completedToday,
                HighRiskCases = highRisk
            });
        }
    }

    // --- DTOs ĐƯỢC ĐẶT TRONG CÙNG NAMESPACE ĐỂ KHÔNG BỊ LỖI ---
    public class UpdateDiagnosisRequest 
    { 
        public string Diagnosis { get; set; } = string.Empty;
        public string DoctorNotes { get; set; } = string.Empty;
    }
}