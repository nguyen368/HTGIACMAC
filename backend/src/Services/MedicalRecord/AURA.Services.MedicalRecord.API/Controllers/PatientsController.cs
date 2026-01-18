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

    // [POST] api/patients -> Tạo hồ sơ lần đầu
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] UpdatePatientProfileRequest request)
    {
        // 1. Validation
        var validationResult = await _validator.ValidateAsync(request);
        if (!validationResult.IsValid)
        {
            return BadRequest(new 
            { 
                title = "Lỗi dữ liệu đầu vào", 
                errors = validationResult.Errors.Select(e => e.ErrorMessage) 
            });
        }

        // 2. Lấy UserId từ Token
        var userId = GetUserIdFromToken();
        if (userId == Guid.Empty) return Unauthorized("Không tìm thấy User ID hợp lệ.");

        // 3. Check tồn tại
        var existingPatient = await _context.Patients.FirstOrDefaultAsync(p => p.UserId == userId);
        if (existingPatient != null) return BadRequest("Hồ sơ bệnh nhân đã tồn tại.");

        // 4. Lưu DB
        var dob = DateTime.SpecifyKind(request.DateOfBirth, DateTimeKind.Utc);
        var patient = new Patient(userId, request.FullName, dob, request.Gender, request.PhoneNumber, request.Address);
        
        _context.Patients.Add(patient);
        await _context.SaveChangesAsync();
        
        return Ok(patient);
    }

    // [GET] api/patients/me -> Xem hồ sơ của chính mình
    [HttpGet("me")]
    public async Task<IActionResult> GetMyProfile()
    {
        var userId = GetUserIdFromToken();
        if (userId == Guid.Empty) return Unauthorized();

        // Include MedicalHistories để xem luôn tiền sử bệnh
        var patient = await _context.Patients
            .Include(p => p.MedicalHistories) 
            .AsNoTracking() // Tối ưu đọc
            .FirstOrDefaultAsync(p => p.UserId == userId);

        // Nếu chưa có hồ sơ, trả về 404 hoặc null tùy logic FE, ở đây return NotFound để FE biết redirect
        if (patient == null) return NotFound("Chưa cập nhật hồ sơ y tế.");

        return Ok(patient);
    }

    // [PUT] api/patients/me -> Cập nhật thông tin (Đã giữ logic UPSERT của bạn)
    [HttpPut("me")]
    public async Task<IActionResult> UpdateProfile([FromBody] UpdatePatientProfileRequest request)
    {
        // 1. Validate
        var validationResult = await _validator.ValidateAsync(request);
        if (!validationResult.IsValid)
        {
            return BadRequest(new { errors = validationResult.Errors.Select(e => e.ErrorMessage) });
        }

        var userId = GetUserIdFromToken();
        if (userId == Guid.Empty) return Unauthorized();

        // 2. Tìm hồ sơ trong DB
        var patient = await _context.Patients.FirstOrDefaultAsync(p => p.UserId == userId);
        
        // Chuẩn hóa ngày sinh sang UTC
        var dob = DateTime.SpecifyKind(request.DateOfBirth, DateTimeKind.Utc);

        // 3. Logic UPSERT (Update or Insert) - FIX QUAN TRỌNG
        if (patient == null) 
        {
            // TRƯỜNG HỢP 1: Chưa có hồ sơ -> TẠO MỚI LUÔN
            patient = new Patient(userId, request.FullName, dob, request.Gender, request.PhoneNumber, request.Address);
            _context.Patients.Add(patient);
        }
        else 
        {
            // TRƯỜNG HỢP 2: Đã có hồ sơ -> CẬP NHẬT
            patient.UpdateInfo(request.FullName, dob, request.Gender, request.PhoneNumber, request.Address);
            _context.Patients.Update(patient);
        }

        await _context.SaveChangesAsync();

        return Ok(patient);
    }

    // =================================================================================
    // 2. QUẢN LÝ LỊCH SỬ (HISTORY & EXAMS)
    // =================================================================================

    // [GET] api/patients/examinations -> Xem lịch sử các lần khám
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

    // [POST] api/patients/{patientId}/history -> Thêm tiền sử bệnh
    [HttpPost("{patientId}/history")]
    public async Task<IActionResult> AddMedicalHistory(Guid patientId, [FromBody] AddMedicalHistoryRequest request)
    {
        var patient = await _context.Patients.FindAsync(patientId);
        if (patient == null) return NotFound("Không tìm thấy bệnh nhân.");

        // Gọi method Domain
        patient.AddMedicalHistory(request.Condition, request.Description, request.DiagnosedDate);

        await _context.SaveChangesAsync();
        return Ok(new { Message = "Đã thêm tiền sử bệnh thành công!", PatientId = patientId });
    }

    // =================================================================================
    // 3. HELPER METHODS
    // =================================================================================
    
    private Guid GetUserIdFromToken()
    {
        var userIdString = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userIdString))
        {
            userIdString = User.FindFirst("sub")?.Value ?? User.FindFirst("id")?.Value;
        }

        if (Guid.TryParse(userIdString, out var userId))
        {
            return userId;
        }
        return Guid.Empty;
    }
}