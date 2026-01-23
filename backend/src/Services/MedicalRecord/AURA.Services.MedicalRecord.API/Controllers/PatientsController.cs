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
        var patient = new Patient(userId, request.FullName, dob, request.Gender, request.PhoneNumber, request.Address);
        
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
            patient = new Patient(userId, request.FullName, dob, request.Gender, request.PhoneNumber, request.Address);
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
                                  .ToListAsync();

        return Ok(exams);
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
        // Thử lấy ID từ nhiều nguồn Claim khác nhau để đảm bảo không sót
        var userIdString = User.FindFirst(ClaimTypes.NameIdentifier)?.Value 
                        ?? User.FindFirst("sub")?.Value 
                        ?? User.FindFirst("id")?.Value;

        if (Guid.TryParse(userIdString, out var userId)) return userId;
        return Guid.Empty;
    }
}