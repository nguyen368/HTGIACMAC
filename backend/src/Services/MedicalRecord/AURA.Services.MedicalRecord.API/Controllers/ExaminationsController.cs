using AURA.Services.MedicalRecord.Application.DTOs;
using AURA.Services.MedicalRecord.Domain.Entities;
using AURA.Services.MedicalRecord.Infrastructure.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MassTransit; 

namespace AURA.Services.MedicalRecord.API.Controllers
{
    // Sự kiện gửi ra hệ thống khi bác sĩ duyệt xong
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

<<<<<<< HEAD
        // =========================================================================
        // PHẦN 1: API CHO CLINIC WEB (SỬA LỖI PROPERTY)
        // =========================================================================

        // [POST] Tạo mới/Lưu kết quả khám
=======
        // 1. Tạo ca khám mới (Giữ nguyên logic của bạn)
>>>>>>> 7d68b20f0738f90995a124216dde00831c1ce63d
        [HttpPost]
        public async Task<IActionResult> CreateExamination([FromBody] CreateExaminationRequest request)
        {
            if (request.PatientId == Guid.Empty) return BadRequest("PatientId is required");

            // Gọi Constructor 5 tham số để tạo hồ sơ
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

<<<<<<< HEAD
        // [GET] Lấy chi tiết ca khám - FIX LỖI AiDiagnosis
=======
        // 2. Lấy chi tiết ca khám (Đầy đủ thông tin cho UI)
>>>>>>> 7d68b20f0738f90995a124216dde00831c1ce63d
        [HttpGet("{id}")]
        public async Task<IActionResult> GetExaminationById(Guid id)
        {
            var exam = await _context.Examinations
                .Include(e => e.Patient)
                .FirstOrDefaultAsync(e => e.Id == id);

            if (exam == null) return NotFound(new { Message = "Không tìm thấy hồ sơ khám" });

            var age = exam.Patient != null ? (DateTime.UtcNow.Year - exam.Patient.DateOfBirth.Year) : 0;

            return Ok(new {
                exam.Id,
                exam.PatientId,
                PatientName = exam.Patient?.FullName ?? "Unknown",
                Age = age,
                Gender = exam.Patient?.Gender ?? "Unknown",
                exam.ImageUrl, 
                exam.Status,
                exam.ExamDate,
                exam.DoctorNotes,
<<<<<<< HEAD
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
=======
                // Ưu tiên kết quả chẩn đoán của bác sĩ nếu đã Verified, ngược lại lấy gợi ý từ AI
                DiagnosisResult = exam.Status == "Verified" ? exam.Diagnosis : exam.AiDiagnosis,
                exam.AiRiskScore,
                exam.AiRiskLevel,
                exam.HeatmapUrl
            });
        }

        // 3. Thống kê Dashboard (Đã thêm ClinicId để lọc dữ liệu thực tế)
        [HttpGet("stats")]
        public async Task<IActionResult> GetStats([FromQuery] Guid? clinicId)
        {
            var query = _context.Examinations.AsQueryable();

            // Lọc dữ liệu theo phòng khám thông qua quan hệ với Patient
            if (clinicId.HasValue)
            {
                query = query.Where(e => e.Patient != null && e.Patient.ClinicId == clinicId.Value);
            }

            var totalPatients = clinicId.HasValue 
                ? await _context.Patients.CountAsync(p => p.ClinicId == clinicId.Value)
                : await _context.Patients.CountAsync();

            var pendingExams = await query.CountAsync(e => e.Status == "Pending" || e.Status == "Analyzed");
            
            var highRisk = await query.CountAsync(e => e.AiRiskLevel == "High");

            var recentActivity = await query
                .OrderByDescending(e => e.ExamDate)
                .Take(5)
                .Select(e => new {
                    e.Id,
                    e.ImageUrl,
                    e.Status,
                    UploadedAt = e.ExamDate.ToString("dd/MM/yyyy HH:mm")
                })
                .ToListAsync();

            return Ok(new { 
                Summary = new { 
                    TotalPatients = totalPatients, 
                    PendingExams = pendingExams, 
                    TotalScans = await query.CountAsync(),
                    HighRiskCases = highRisk 
                },
                RecentActivity = recentActivity
            });
        }

        // 4. Danh sách chờ (Ưu tiên các ca nguy cơ cao lên đầu - Logic CDS)
        [HttpGet("queue")]
        public async Task<IActionResult> GetWaitingList([FromQuery] Guid? clinicId)
        {
            var query = _context.Examinations
                .AsNoTracking()
                .Include(e => e.Patient)
                .Where(e => e.Status == "Pending" || e.Status == "Analyzed");

            if (clinicId.HasValue)
            {
                query = query.Where(e => e.Patient != null && e.Patient.ClinicId == clinicId.Value);
            }

            var result = await query
                .OrderByDescending(e => e.AiRiskScore) 
                .ThenBy(e => e.ExamDate)
                .Select(e => new ExaminationQueueDto {
>>>>>>> 7d68b20f0738f90995a124216dde00831c1ce63d
                    Id = e.Id,
                    PatientId = e.PatientId,
                    PatientName = e.Patient != null ? e.Patient.FullName : "Unknown",
                    ImageUrl = e.ImageUrl,
                    ExamDate = e.ExamDate,
                    Status = e.Status,
                    AiDiagnosis = e.AiDiagnosis ?? string.Empty,
                    AiRiskLevel = e.AiRiskLevel ?? "Low",
                    AiRiskScore = e.AiRiskScore ?? 0
                })
                .ToListAsync();

<<<<<<< HEAD
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

=======
            return Ok(result);
        }

        // 5. Tạo dữ liệu giả (Giữ nguyên logic của bạn phục vụ Test)
>>>>>>> 7d68b20f0738f90995a124216dde00831c1ce63d
        [HttpPost("fake")]
        public async Task<IActionResult> CreateFakeData(Guid patientId)
        {
            var fakeExam = new Examination(patientId, "https://via.placeholder.com/150");
            _context.Examinations.Add(fakeExam);
            await _context.SaveChangesAsync();
            return Ok(new { Message = "Đã tạo ca khám giả thành công!", ExamId = fakeExam.Id });
        }

        // 6. Cập nhật kết quả AI (Dùng overload 1 tham số trong Entity Examination.cs)
        [HttpPut("{id}/ai-result")]
        public async Task<IActionResult> UpdateAiResult(Guid id, [FromBody] string aiResult)
        {
            var exam = await _context.Examinations.FindAsync(id);
            if (exam == null) return NotFound("Không tìm thấy ca khám.");
<<<<<<< HEAD
=======

>>>>>>> 7d68b20f0738f90995a124216dde00831c1ce63d
            try {
                exam.UpdateAiResult(aiResult);
                await _context.SaveChangesAsync();
                return Ok(new { Message = "Đã cập nhật AI thành công" });
<<<<<<< HEAD
            } catch (Exception ex) {
                return BadRequest(ex.Message);
            }
        }
=======
            }
            catch (Exception ex) {
                return BadRequest(new { Error = "Lỗi trạng thái", Detail = ex.Message });
            }
        }

        // 7. Bác sĩ xác nhận kết quả (Verify)
        [HttpPut("{id}/verify")]
        public async Task<IActionResult> VerifyExamination(Guid id, [FromBody] ConfirmDiagnosisRequest request)
        {
            var exam = await _context.Examinations.FindAsync(id);
            if (exam == null) return NotFound("Không tìm thấy ca khám.");

            // Kiểm tra quy trình CDS: Phải có kết quả AI hoặc đang chờ mới được duyệt
            if (exam.Status != "Analyzed" && exam.Status != "Pending")
            {
                 return BadRequest(new { Error = "Quy trình CDS", Message = "Hồ sơ không ở trạng thái có thể duyệt." });
            }

            try {
                // Cập nhật chẩn đoán chính thức của bác sĩ
                exam.ConfirmDiagnosis(request.DoctorNotes, request.FinalDiagnosis, request.DoctorId);
                await _context.SaveChangesAsync();

                // Bắn sự kiện để các dịch vụ khác (ví dụ: Thông báo cho bệnh nhân) xử lý
                await _publishEndpoint.Publish(new DiagnosisVerifiedEvent(
                    exam.Id, exam.PatientId, request.FinalDiagnosis, request.DoctorNotes, DateTime.UtcNow
                ));

                return Ok(new { Message = "Bác sĩ đã duyệt thành công." });
            }
            catch (Exception ex) {
                return BadRequest(new { Error = "Lỗi quy trình", Detail = ex.Message });
            }
        }
>>>>>>> 7d68b20f0738f90995a124216dde00831c1ce63d
    }
}