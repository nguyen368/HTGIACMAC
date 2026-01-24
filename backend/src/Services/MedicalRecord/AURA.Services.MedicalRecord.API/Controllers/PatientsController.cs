using AURA.Services.MedicalRecord.Application.DTOs;
using AURA.Services.MedicalRecord.Domain.Entities;
using AURA.Services.MedicalRecord.Infrastructure.Data;
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
    private readonly MedicalDbContext _context;
    private readonly IValidator<UpdatePatientProfileRequest> _validator;

    public PatientsController(MedicalDbContext context, IValidator<UpdatePatientProfileRequest> validator)
    {
        _context = context;
        _validator = validator;
    }

    // =================================================================================
    // 1. QUẢN LÝ HỒ SƠ CÁ NHÂN (PROFILE)
    // =================================================================================

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] UpdatePatientProfileRequest request)
    {
        var validationResult = await _validator.ValidateAsync(request);
        if (!validationResult.IsValid)
        {
            return BadRequest(new { errors = validationResult.Errors.Select(e => e.ErrorMessage) });
        }

        var userId = GetUserIdFromToken();
        if (userId == Guid.Empty) return Unauthorized("Không tìm thấy User ID hợp lệ.");

        var existingPatient = await _context.Patients.FirstOrDefaultAsync(p => p.UserId == userId);
        if (existingPatient != null) return BadRequest("Hồ sơ bệnh nhân đã tồn tại.");

        var dob = DateTime.SpecifyKind(request.DateOfBirth, DateTimeKind.Utc);
        
        // [FIX LỖI BUILD CS7036]: Đã thêm request.ClinicId vào tham số thứ 2
        var patient = new Patient(userId, request.ClinicId, request.FullName, dob, request.Gender, request.PhoneNumber, request.Address);
        
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

        return Ok(patient);
    }

    [HttpPut("me")]
    public async Task<IActionResult> UpdateProfile([FromBody] UpdatePatientProfileRequest request)
    {
        var validationResult = await _validator.ValidateAsync(request);
        if (!validationResult.IsValid)
        {
            return BadRequest(new { errors = validationResult.Errors.Select(e => e.ErrorMessage) });
        }

        var userId = GetUserIdFromToken();
        if (userId == Guid.Empty) return Unauthorized();

        var patient = await _context.Patients.FirstOrDefaultAsync(p => p.UserId == userId);
        var dob = DateTime.SpecifyKind(request.DateOfBirth, DateTimeKind.Utc);

        if (patient == null) 
        {
            // [FIX LỖI BUILD CS7036]: Đã thêm request.ClinicId vào tham số thứ 2
            patient = new Patient(userId, request.ClinicId, request.FullName, dob, request.Gender, request.PhoneNumber, request.Address);
            _context.Patients.Add(patient);
        }
        else 
        {
            patient.UpdateInfo(request.FullName, dob, request.Gender, request.PhoneNumber, request.Address);
            _context.Patients.Update(patient);
        }

        await _context.SaveChangesAsync();
        return Ok(patient);
    }

    // =================================================================================
    // 2. LỊCH SỬ KHÁM BỆNH & CDS VIEW
    // =================================================================================

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
            exam.Id,
            exam.ExamDate,
            exam.ImageUrl,
            exam.Status,
            exam.HeatmapUrl,
            exam.AiRiskScore,
            exam.AiRiskLevel,
            exam.AiDiagnosis,
            exam.Diagnosis,
            exam.DoctorNotes
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
        var userIdString = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userIdString))
        {
            userIdString = User.FindFirst("sub")?.Value ?? User.FindFirst("id")?.Value;
        }

        if (Guid.TryParse(userIdString, out var userId)) return userId;
        return Guid.Empty;
    }
}