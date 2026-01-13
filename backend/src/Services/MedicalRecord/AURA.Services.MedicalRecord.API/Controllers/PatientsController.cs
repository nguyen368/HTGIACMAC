using AURA.Services.MedicalRecord.Domain.Entities;
using AURA.Services.MedicalRecord.Infrastructure.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims; // Để lấy UserId từ Token

namespace AURA.Services.MedicalRecord.API.Controllers;

[ApiController]
[Route("api/patients")]
public class PatientsController : ControllerBase
{
    private readonly MedicalDbContext _context;

    public PatientsController(MedicalDbContext context)
    {
        _context = context;
    }

    // 1. Tạo hồ sơ mới (Thường gọi ngay sau khi Đăng ký User thành công)
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] UpdatePatientProfileRequest request)
    {
        // --- DEBUG: KIỂM TRA XEM USER CÓ ĐƯỢC XÁC THỰC KHÔNG ---
        if (!User.Identity.IsAuthenticated)
        {
            return Unauthorized("Server báo: Token không hợp lệ hoặc sai Key/Issuer/Audience.");
        }

        // --- DEBUG: IN RA TẤT CẢ CLAIMS ĐANG CÓ ---
        var allClaims = User.Claims.Select(c => $"{c.Type}: {c.Value}").ToList();
        
        var userIdString = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userIdString))
        {
            // Nếu tìm không thấy, thử tìm theo "sub" hoặc "id" thủ công
            userIdString = User.FindFirst("sub")?.Value 
                           ?? User.FindFirst("id")?.Value;
                           
            if (string.IsNullOrEmpty(userIdString))
            {
                return BadRequest(new { 
                    message = "Không tìm thấy User ID trong Token", 
                    availableClaims = allClaims // In ra để xem token có gì
                });
            }
        }
        
        var userId = Guid.Parse(userIdString);
        // ---------------------------------------------------------

        var existingPatient = await _context.Patients.FirstOrDefaultAsync(p => p.UserId == userId);
        if (existingPatient != null) return BadRequest("Hồ sơ đã tồn tại.");

        var dob = DateTime.SpecifyKind(request.DateOfBirth, DateTimeKind.Utc);
        
        var patient = new Patient(userId, request.FullName, dob, request.Gender, request.PhoneNumber, request.Address);
        
        _context.Patients.Add(patient);
        await _context.SaveChangesAsync();
        
        return Ok(patient);
    }

    // 2. Lấy thông tin hồ sơ cá nhân (My Profile)
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

    // 3. Cập nhật thông tin (Update)
    [HttpPut("me")]
    public async Task<IActionResult> UpdateProfile([FromBody] UpdatePatientProfileRequest request)
    {
        var userIdString = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userIdString)) return Unauthorized();
        var userId = Guid.Parse(userIdString);

        var patient = await _context.Patients.FirstOrDefaultAsync(p => p.UserId == userId);
        if (patient == null) return NotFound("Hồ sơ không tồn tại.");

        var dob = DateTime.SpecifyKind(request.DateOfBirth, DateTimeKind.Utc);
        
        // Gọi hàm Update trong Domain Entity
        patient.UpdateInfo(request.FullName, dob, request.Gender, request.PhoneNumber, request.Address);
        
        _context.Patients.Update(patient);
        await _context.SaveChangesAsync();

        return Ok(patient);
    }
    [HttpGet("history")]
    public async Task<IActionResult> GetMedicalHistory()
    {
        var userIdString = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userIdString)) return Unauthorized();
        var userId = Guid.Parse(userIdString);

        // 1. Tìm PatientId từ UserId
        var patient = await _context.Patients.FirstOrDefaultAsync(p => p.UserId == userId);
        if (patient == null) return NotFound("Chưa có hồ sơ bệnh nhân.");

        // 2. Lấy danh sách khám bệnh dựa trên PatientId
        // Cần Include hoặc Join nếu muốn lấy thêm thông tin chi tiết
        var history = await _context.Examinations
                                    .Where(e => e.PatientId == patient.Id)
                                    .OrderByDescending(e => e.ExamDate) // Mới nhất lên đầu
                                    .ToListAsync();

        return Ok(history);
    }
}