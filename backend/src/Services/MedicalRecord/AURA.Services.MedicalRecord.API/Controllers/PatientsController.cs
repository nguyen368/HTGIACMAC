using AURA.Services.MedicalRecord.Domain.Entities;
using AURA.Services.MedicalRecord.Infrastructure.Data;
using AURA.Services.MedicalRecord.Application.DTOs; // Namespace chứa DTO
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using FluentValidation; // 1. Thêm thư viện này

namespace AURA.Services.MedicalRecord.API.Controllers;

[ApiController]
[Route("api/patients")]
public class PatientsController : ControllerBase
{
    private readonly MedicalDbContext _context;
    private readonly IValidator<UpdatePatientProfileRequest> _validator; // 2. Khai báo thêm Validator

    // 3. Tiêm cả DbContext VÀ Validator vào đây
    public PatientsController(MedicalDbContext context, IValidator<UpdatePatientProfileRequest> validator)
    {
        _context = context;
        _validator = validator;
    }

    // 1. Tạo hồ sơ mới
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] UpdatePatientProfileRequest request)
    {
        // --- 4. ĐÂY LÀ PHẦN MỚI: CHẶN DỮ LIỆU LỖI NGAY CỬA ---
        var validationResult = await _validator.ValidateAsync(request);
        if (!validationResult.IsValid)
        {
            // Trả về danh sách lỗi cụ thể (VD: Ngày sinh sai, SĐT sai...)
            return BadRequest(new 
            { 
                title = "Lỗi dữ liệu đầu vào", 
                errors = validationResult.Errors.Select(e => e.ErrorMessage) 
            });
        }
        // ---------------------------------------------------------

        // --- TỪ ĐÂY TRỞ XUỐNG LÀ CODE CŨ CỦA BẠN (KHÔNG ĐỔI) ---
        
        // Debug Token
        if (User.Identity == null || !User.Identity.IsAuthenticated)
        {
            return Unauthorized("Server báo: Token không hợp lệ hoặc sai Key/Issuer/Audience.");
        }

        var userIdString = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userIdString))
        {
            userIdString = User.FindFirst("sub")?.Value ?? User.FindFirst("id")?.Value;
            if (string.IsNullOrEmpty(userIdString))
            {
                return BadRequest(new { message = "Không tìm thấy User ID trong Token" });
            }
        }
        
        var userId = Guid.Parse(userIdString);

        var existingPatient = await _context.Patients.FirstOrDefaultAsync(p => p.UserId == userId);
        if (existingPatient != null) return BadRequest("Hồ sơ đã tồn tại.");

        var dob = DateTime.SpecifyKind(request.DateOfBirth, DateTimeKind.Utc);
        
        var patient = new Patient(userId, request.FullName, dob, request.Gender, request.PhoneNumber, request.Address);
        
        _context.Patients.Add(patient);
        await _context.SaveChangesAsync();
        
        return Ok(patient);
    }

    // 2. Lấy thông tin (GIỮ NGUYÊN)
    [HttpGet("me")]
    public async Task<IActionResult> GetMyProfile()
    {
        var userIdString = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userIdString)) return Unauthorized();
        var userId = Guid.Parse(userIdString);

        var patient = await _context.Patients.FirstOrDefaultAsync(p => p.UserId == userId);
        if (patient == null) return NotFound("Chưa cập nhật hồ sơ y tế.");

        return Ok(patient);
    }

    // 3. Cập nhật (CŨNG NÊN THÊM VALIDATE VÀO ĐÂY)
    [HttpPut("me")]
    public async Task<IActionResult> UpdateProfile([FromBody] UpdatePatientProfileRequest request)
    {
        // --- VALIDATE CẢ LÚC UPDATE NỮA ---
        var validationResult = await _validator.ValidateAsync(request);
        if (!validationResult.IsValid)
        {
            return BadRequest(new { errors = validationResult.Errors.Select(e => e.ErrorMessage) });
        }
        // ----------------------------------

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

    // 4. Lịch sử khám (GIỮ NGUYÊN)
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