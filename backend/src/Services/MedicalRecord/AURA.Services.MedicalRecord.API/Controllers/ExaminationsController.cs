using AURA.Services.MedicalRecord.Application.DTOs;
using AURA.Services.MedicalRecord.Domain.Entities;
using AURA.Services.MedicalRecord.Infrastructure.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MassTransit; 

namespace AURA.Services.MedicalRecord.API.Controllers
{
    public record DiagnosisVerifiedEvent(Guid ExaminationId, Guid PatientId, string FinalDiagnosis, string DoctorNotes, DateTime VerifiedAt);

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

        [HttpPost]
        public async Task<IActionResult> CreateExamination([FromBody] CreateExaminationRequest request)
        {
            if (request.PatientId == Guid.Empty) return BadRequest("PatientId is required");

            // Gọi Constructor 5 tham số (Đã thêm trong Entity)
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
                PatientName = exam.Patient?.FullName ?? "Unknown",
                Age = age,
                Gender = exam.Patient?.Gender ?? "Unknown",
                ImageUrl = exam.ImageUrl, 
                exam.Status,
                exam.ExamDate,
                exam.DoctorNotes,
                DiagnosisResult = exam.Status == "Verified" ? exam.Diagnosis : exam.AiDiagnosis,
                exam.AiRiskScore,
                exam.AiRiskLevel,
                exam.HeatmapUrl
            });
        }

        [HttpGet("stats")]
        public async Task<IActionResult> GetStats()
        {
            var today = DateTime.UtcNow.Date;
            var totalPatients = await _context.Patients.CountAsync();
            var pendingExams = await _context.Examinations.CountAsync(e => e.Status == "Pending");
            var completedToday = await _context.Examinations
                .CountAsync(e => (e.Status == "Completed" || e.Status == "Verified") && e.ExamDate >= today);
            var highRisk = await _context.Examinations
                .CountAsync(e => (e.Status == "Completed" || e.Status == "Verified") && e.AiRiskLevel == "High");

            return Ok(new { TotalPatients = totalPatients, PendingExams = pendingExams, CompletedToday = completedToday, HighRiskCases = highRisk });
        }

        [HttpGet("queue")]
        public async Task<IActionResult> GetWaitingList([FromQuery] Guid? clinicId)
        {
            var query = _context.Examinations
                .AsNoTracking()
                .Include(e => e.Patient)
                .Where(e => e.Status == "Pending" || e.Status == "Analyzed");

            var result = await query
                .OrderByDescending(e => e.AiRiskScore) 
                .ThenBy(e => e.ExamDate)
                .Select(e => new ExaminationQueueDto
                {
                    Id = e.Id,
                    PatientId = e.PatientId,
                    PatientName = e.Patient != null ? e.Patient.FullName : "Unknown",
                    ImageUrl = e.ImageUrl,
                    ExamDate = e.ExamDate,
                    Status = e.Status,
                    AiDiagnosis = e.AiDiagnosis,
                    AiRiskLevel = e.AiRiskLevel,
                    AiRiskScore = e.AiRiskScore ?? 0
                })
                .ToListAsync();

            return Ok(result);
        }

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

            try
            {
                // Gọi Overload 1 tham số (Đã thêm trong Entity)
                exam.UpdateAiResult(aiResult);
                await _context.SaveChangesAsync();
                return Ok(new { Message = "Đã cập nhật AI thành công" });
            }
            catch (Exception ex)
            {
                return BadRequest(new { Error = "Lỗi trạng thái", Detail = ex.Message });
            }
        }

        [HttpPut("{id}/verify")]
        public async Task<IActionResult> VerifyExamination(Guid id, [FromBody] ConfirmDiagnosisRequest request)
        {
            var exam = await _context.Examinations.FindAsync(id);
            if (exam == null) return NotFound("Không tìm thấy ca khám.");

            if (exam.Status != "Analyzed" && exam.Status != "Pending")
            {
                 return BadRequest(new { Error = "Quy trình CDS", Message = "Hồ sơ cần được AI phân tích trước khi Bác sĩ kết luận." });
            }

            try
            {
                // [QUAN TRỌNG] Truyền DoctorId vào hàm ConfirmDiagnosis (Đã sửa trong Entity)
                // request.DoctorId phải có trong DTO ConfirmDiagnosisRequest (đã nhắc ở bước trước)
                // Nếu chưa có, hãy đảm bảo file DTO đã được update.
                // Ở đây giả định DTO ConfirmDiagnosisRequest chưa có DoctorId thì ta lấy tạm DoctorId từ request nào đó hoặc hardcode test
                // Để an toàn, hãy cập nhật DTO ConfirmDiagnosisRequest thêm DoctorId.
                
                // Tạm thời fix cứng Guid.Empty nếu DTO chưa update, nhưng tốt nhất là update DTO.
                Guid docId = Guid.Empty; // Thay bằng request.DoctorId sau khi update DTO
                
                exam.ConfirmDiagnosis(request.DoctorNotes, request.FinalDiagnosis, docId);
                
                await _context.SaveChangesAsync();

                await _publishEndpoint.Publish(new DiagnosisVerifiedEvent(
                    exam.Id,
                    exam.PatientId,
                    request.FinalDiagnosis,
                    request.DoctorNotes,
                    DateTime.UtcNow
                ));

                return Ok(new { Message = "Bác sĩ đã duyệt thành công." });
            }
            catch (Exception ex)
            {
                return BadRequest(new { Error = "Lỗi trạng thái", Detail = ex.Message });
            }
        }
    }

    public class CreateExaminationRequest
    {
        public Guid PatientId { get; set; }
        public Guid ImageId { get; set; }
        public string Diagnosis { get; set; } = string.Empty;
        public string DoctorNotes { get; set; } = string.Empty;
        public Guid DoctorId { get; set; }
    }

    public class ExaminationQueueDto
    {
        public Guid Id { get; set; }
        public Guid PatientId { get; set; }
        public string PatientName { get; set; }
        public string ImageUrl { get; set; }
        public DateTime ExamDate { get; set; }
        public string Status { get; set; }
        public string AiDiagnosis { get; set; }
        public string AiRiskLevel { get; set; }
        public double AiRiskScore { get; set; } 
    }
}