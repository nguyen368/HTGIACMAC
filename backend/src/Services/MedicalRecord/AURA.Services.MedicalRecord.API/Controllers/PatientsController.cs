using AURA.Services.MedicalRecord.Domain.Entities;
using AURA.Services.MedicalRecord.Infrastructure.Data;
using AURA.Services.MedicalRecord.Application.DTOs;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using FluentValidation;
using Microsoft.AspNetCore.Authorization;

namespace AURA.Services.MedicalRecord.API.Controllers;

[ApiController]
[Route("api/patients")]
[Authorize] // 🌟 Đặt ở đây: Bảo vệ TOÀN BỘ Controller (Create, Get, Put, History...)
public class PatientsController : ControllerBase
{
    private readonly MedicalDbContext _context;
    private readonly IValidator<UpdatePatientProfileRequest> _validator;

    public PatientsController(MedicalDbContext context, IValidator<UpdatePatientProfileRequest> validator)
    {
        _context = context;
        _validator = validator;
    }

    // 1. Tạo hồ sơ mới
    [HttpPost]
    // Không cần [Authorize] ở đây nữa vì đã có ở trên đầu Class rồi
    public async Task<IActionResult> Create([FromBody] UpdatePatientProfileRequest request)
    {
        // --- 2. VALIDATION ---
        var validationResult = await _validator.ValidateAsync(request);
        if (!validationResult.IsValid)
        {
            return BadRequest(new 
            { 
                title = "Lỗi dữ liệu đầu vào", 
                errors = validationResult.Errors.Select(e => e.ErrorMessage) 
            });
        }

        // --- 3. LẤY USER ID ---
        var userIdString = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userIdString))
        {
            userIdString = User.FindFirst("sub")?.Value ?? User.FindFirst("id")?.Value;
        }

        if (string.IsNullOrEmpty(userIdString)) return BadRequest("Không tìm thấy User ID trong Token");
        
        var userId = Guid.Parse(userIdString);

        // --- 4. LOGIC ---
        var existingPatient = await _context.Patients.FirstOrDefaultAsync(p => p.UserId == userId);
        if (existingPatient != null) return BadRequest("Hồ sơ đã tồn tại.");

        var dob = DateTime.SpecifyKind(request.DateOfBirth, DateTimeKind.Utc);
        var patient = new Patient(userId, request.FullName, dob, request.Gender, request.PhoneNumber, request.Address);
        
        _context.Patients.Add(patient);
        await _context.SaveChangesAsync();
        
        return Ok(patient);
    }

    // 2. Lấy thông tin
    [HttpGet("me")]
    public async Task<IActionResult> GetMyProfile()
    {
        var userIdString = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        // Đoạn check null này có thể giữ lại để an toàn, hoặc bỏ đi cũng được vì [Authorize] đã chặn rồi
        if (string.IsNullOrEmpty(userIdString)) return Unauthorized(); 
        
        var userId = Guid.Parse(userIdString);

        var patient = await _context.Patients.FirstOrDefaultAsync(p => p.UserId == userId);
        if (patient == null) return NotFound("Chưa cập nhật hồ sơ y tế.");

        return Ok(patient);
    }

    // 3. Cập nhật
    [HttpPut("me")]
    public async Task<IActionResult> UpdateProfile([FromBody] UpdatePatientProfileRequest request)
    {
        // Validate dữ liệu cập nhật
        var validationResult = await _validator.ValidateAsync(request);
        if (!validationResult.IsValid)
        {
            return BadRequest(new { errors = validationResult.Errors.Select(e => e.ErrorMessage) });
        }

        var userIdString = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userIdString)) return Unauthorized();
        var userId = Guid.Parse(userIdString);

        var patient = await _context.Patients.FirstOrDefaultAsync(p => p.UserId == userId);
        if (patient == null) return NotFound("Hồ sơ không tồn tại.");

        var dob = DateTime.SpecifyKind(request.DateOfBirth, DateTimeKind.Utc);
        
        patient.UpdateInfo(request.FullName, dob, request.Gender, request.PhoneNumber, request.Address);
        
        _context.Patients.Update(patient);
        await _context.SaveChangesAsync();

        return Ok(patient);
    }

    // 4. Lịch sử khám
    [HttpGet("history")]
    public async Task<IActionResult> GetMedicalHistory()
    {
        var userIdString = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userIdString)) return Unauthorized();
        var userId = Guid.Parse(userIdString);

        var patient = await _context.Patients.FirstOrDefaultAsync(p => p.UserId == userId);
        if (patient == null) return NotFound("Chưa có hồ sơ bệnh nhân.");

        var history = await _context.Examinations
                                    .Where(e => e.PatientId == patient.Id)
                                    .OrderByDescending(e => e.ExamDate)
                                    .ToListAsync();

        return Ok(history);
    }
}