using AURA.Services.MedicalRecord.Application.DTOs;
using AURA.Services.MedicalRecord.Domain.Entities;
using AURA.Services.MedicalRecord.Infrastructure.Data; // [FIX] Đổi từ Persistence -> Data
using FluentValidation;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace AURA.Services.MedicalRecord.API.Controllers;

[ApiController]
[Route("api/patients")]
[Authorize]
public class PatientsController : ControllerBase
{
    private readonly MedicalDbContext _context; // [FIX] Đổi tên class thành MedicalDbContext
    private readonly IValidator<UpdatePatientProfileRequest> _validator;

    // [FIX] Inject MedicalDbContext vào Constructor
    public PatientsController(MedicalDbContext context, IValidator<UpdatePatientProfileRequest> validator)
    {
        _context = context;
        _validator = validator;
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] UpdatePatientProfileRequest request)
    {
        var validationResult = await _validator.ValidateAsync(request);
        if (!validationResult.IsValid) return BadRequest(new { errors = validationResult.Errors.Select(e => e.ErrorMessage) });

        var userId = GetUserIdFromToken();
        if (userId == Guid.Empty) return Unauthorized();

        var existingPatient = await _context.Patients.FirstOrDefaultAsync(p => p.UserId == userId);
        if (existingPatient != null) return BadRequest("Hồ sơ bệnh nhân đã tồn tại.");

        var dob = DateTime.SpecifyKind(request.DateOfBirth, DateTimeKind.Utc);
        
        // [UPDATE] Thêm AvatarUrl vào constructor (giả sử Patient entity đã hỗ trợ)
        // Nếu Entity chưa có constructor nhận AvatarUrl, ta có thể gán property sau khi new
        var patient = new Patient(userId, request.ClinicId, request.FullName, dob, request.Gender, request.PhoneNumber, request.Address);
        
        // [NEW] Gán AvatarUrl nếu có
        if (!string.IsNullOrEmpty(request.AvatarUrl))
        {
            // Lưu ý: Cần đảm bảo Entity Patient có property AvatarUrl public set
            // patient.AvatarUrl = request.AvatarUrl; 
            // Nếu dùng phương thức UpdateInfo để set, hãy cập nhật phương thức đó trong Entity
            
            // Tạm thời gán trực tiếp hoặc qua method (tùy vào Domain của bạn)
            patient.UpdateAvatar(request.AvatarUrl); 
        }

        // [NEW] Xử lý MedicalHistory nếu có
        if (request.MedicalHistory != null)
        {
            // Logic thêm tiền sử bệnh. Ví dụ:
            if (request.MedicalHistory.HasDiabetes)
                patient.AddMedicalHistory("Diabetes", $"Tiểu đường {request.MedicalHistory.YearsOfDiabetes} năm", DateTime.UtcNow);
            
            if (request.MedicalHistory.HasHypertension)
                patient.AddMedicalHistory("Hypertension", "Cao huyết áp", DateTime.UtcNow);
            
            if (!string.IsNullOrEmpty(request.MedicalHistory.SmokingStatus) && request.MedicalHistory.SmokingStatus != "never")
                patient.AddMedicalHistory("Smoking", $"Hút thuốc: {request.MedicalHistory.SmokingStatus}", DateTime.UtcNow);
        }
        
        _context.Patients.Add(patient);
        await _context.SaveChangesAsync();
        return Ok(patient);
    }

    [HttpGet("me")]
    public async Task<IActionResult> GetMyProfile()
    {
        var userId = GetUserIdFromToken();
        if (userId == Guid.Empty) return Unauthorized();

        var patient = await _context.Patients
            .Include(p => p.MedicalHistories) 
            .AsNoTracking()
            .FirstOrDefaultAsync(p => p.UserId == userId);

        if (patient == null) return NotFound("Chưa cập nhật hồ sơ y tế.");
        
        // [UPDATE] Trả về object có chứa AvatarUrl và MedicalHistory để Frontend map
        // Bạn có thể dùng AutoMapper hoặc tạo DTO response riêng.
        // Ở đây trả về entity trực tiếp (như code cũ), giả sử entity đã có AvatarUrl.
        return Ok(patient);
    }

    [HttpPut("me")]
    public async Task<IActionResult> UpdateProfile([FromBody] UpdatePatientProfileRequest request)
    {
        var validationResult = await _validator.ValidateAsync(request);
        if (!validationResult.IsValid) return BadRequest(new { errors = validationResult.Errors.Select(e => e.ErrorMessage) });

        var userId = GetUserIdFromToken();
        if (userId == Guid.Empty) return Unauthorized();

        var patient = await _context.Patients.Include(p => p.MedicalHistories).FirstOrDefaultAsync(p => p.UserId == userId);
        var dob = DateTime.SpecifyKind(request.DateOfBirth, DateTimeKind.Utc);

        if (patient == null) {
            patient = new Patient(userId, request.ClinicId, request.FullName, dob, request.Gender, request.PhoneNumber, request.Address);
            
            // [NEW] Gán AvatarUrl khi tạo mới
            if (!string.IsNullOrEmpty(request.AvatarUrl)) patient.UpdateAvatar(request.AvatarUrl);

            _context.Patients.Add(patient);
        } else {
            patient.UpdateInfo(request.FullName, dob, request.Gender, request.PhoneNumber, request.Address);
            
            // [NEW] Cập nhật AvatarUrl nếu có thay đổi
            if (!string.IsNullOrEmpty(request.AvatarUrl))
            {
                patient.UpdateAvatar(request.AvatarUrl);
            }

            _context.Patients.Update(patient);
        }

        // [NEW] Cập nhật Medical History (Xóa cũ thêm mới hoặc update - ở đây demo thêm mới đơn giản)
        // Lưu ý: Logic này cần tinh chỉnh tùy business rule thực tế
        if (request.MedicalHistory != null)
        {
            // Xóa lịch sử cũ để cập nhật lại trạng thái mới nhất (hoặc update từng cái)
            // _context.MedicalHistories.RemoveRange(patient.MedicalHistories); 
            
            // Ví dụ cập nhật đơn giản:
            if (request.MedicalHistory.HasDiabetes)
            {
                var existing = patient.MedicalHistories.FirstOrDefault(h => h.Condition == "Diabetes");
                if (existing == null) patient.AddMedicalHistory("Diabetes", $"Tiểu đường {request.MedicalHistory.YearsOfDiabetes} năm", DateTime.UtcNow);
                else existing.UpdateDescription($"Tiểu đường {request.MedicalHistory.YearsOfDiabetes} năm");
            }
            
            // Tương tự cho các bệnh khác...
        }

        await _context.SaveChangesAsync();
        return Ok(patient);
    }

    [HttpGet("examinations")]
    public async Task<IActionResult> GetExaminationHistory()
    {
        var userId = GetUserIdFromToken();
        var patient = await _context.Patients.AsNoTracking().FirstOrDefaultAsync(p => p.UserId == userId);
        if (patient == null) return NotFound("Chưa có hồ sơ bệnh nhân.");

        var exams = await _context.Examinations
            .AsNoTracking()
            .Where(e => e.PatientId == patient.Id)
            .OrderByDescending(e => e.ExamDate)
            .Select(e => new {
                e.Id,
                e.ExamDate,
                e.ImageUrl,
                e.Status,
                Result = e.Status == "Verified" ? e.Diagnosis : (e.Status == "Analyzed" ? e.AiDiagnosis : "Đang xử lý"),
                e.AiRiskLevel
            })
            .ToListAsync();
        return Ok(exams);
    }

    [HttpGet("examinations/{examId}")]
    public async Task<IActionResult> GetExamDetail(Guid examId)
    {
        var userId = GetUserIdFromToken();
        var patient = await _context.Patients.AsNoTracking().FirstOrDefaultAsync(p => p.UserId == userId);
        if (patient == null) return Unauthorized();

        var exam = await _context.Examinations
            .Where(e => e.Id == examId && e.PatientId == patient.Id)
            .FirstOrDefaultAsync();

        if (exam == null) return NotFound("Không tìm thấy ca khám này.");

        return Ok(new {
            exam.Id, exam.ExamDate, exam.ImageUrl, exam.Status, exam.HeatmapUrl,
            exam.AiRiskScore, exam.AiRiskLevel, exam.AiDiagnosis, exam.Diagnosis, exam.DoctorNotes
        });
    }

    [HttpPost("{patientId}/history")]
    public async Task<IActionResult> AddMedicalHistory(Guid patientId, [FromBody] AddMedicalHistoryRequest request)
    {
        var patient = await _context.Patients.FindAsync(patientId);
        if (patient == null) return NotFound("Không tìm thấy bệnh nhân.");
        patient.AddMedicalHistory(request.Condition, request.Description, request.DiagnosedDate);
        await _context.SaveChangesAsync();
        return Ok(new { Message = "Thành công!", PatientId = patientId });
    }

    private Guid GetUserIdFromToken()
    {
        var userIdString = User.FindFirst(ClaimTypes.NameIdentifier)?.Value 
                           ?? User.FindFirst("sub")?.Value 
                           ?? User.FindFirst("id")?.Value;
        return Guid.TryParse(userIdString, out var userId) ? userId : Guid.Empty;
    }
}