using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using AURA.Services.Identity.Infrastructure.Data;
using AURA.Services.Identity.Domain.Entities;
using AURA.Services.Identity.API.DTOs; // Giả sử đã có DTOs

namespace AURA.Services.Identity.API.Controllers;

[ApiController]
[Route("api/admin")]
// [Authorize(Roles = "SuperAdmin")] // Uncomment khi deploy thật
public class AdminController : ControllerBase
{
    private readonly AppIdentityDbContext _context;
    public AdminController(AppIdentityDbContext context) => _context = context;

    // ===========================
    // 1. QUẢN LÝ PHÒNG KHÁM (CLINICS)
    // ===========================

    [HttpGet("clinics")]
    public async Task<IActionResult> GetAllClinics()
    {
        var clinics = await _context.Clinics.ToListAsync();
        return Ok(clinics);
    }

    // API Cũ: Duyệt phòng khám
    [HttpPut("clinics/{id}/approve")]
    public async Task<IActionResult> ApproveClinic(Guid id)
    {
        var clinic = await _context.Clinics.FindAsync(id);
        if (clinic == null) return NotFound("Không tìm thấy phòng khám.");

        // 1. Kích hoạt phòng khám
        clinic.Approve(); 

        // 2. Tìm và kích hoạt tài khoản Admin của phòng khám đó
        var adminUser = await _context.Users.FirstOrDefaultAsync(u => u.ClinicId == id && u.Role == "ClinicAdmin");
        if (adminUser != null)
        {
            adminUser.ActivateUser();
        }

        await _context.SaveChangesAsync();
        return Ok(new { Message = $"Phòng khám {clinic.Name} đã được xác minh và kích hoạt thành công!" });
    }

    [HttpPost("clinics")]
    public async Task<IActionResult> CreateClinic([FromBody] RegisterPartnerDto dto)
    {
        // Logic tạo nhanh phòng khám từ Admin Dashboard
        var clinic = new Clinic(dto.ClinicName, dto.ClinicAddress, dto.LicenseUrl);
        _context.Clinics.Add(clinic);
        await _context.SaveChangesAsync();
        return Ok(new { Message = "Tạo phòng khám thành công", ClinicId = clinic.Id });
    }

    // ===========================
    // 2. QUẢN LÝ USER HỆ THỐNG
    // ===========================

    [HttpGet("users")]
    public async Task<IActionResult> GetAllUsers([FromQuery] string role = "")
    {
        var query = _context.Users.AsQueryable();
        if (!string.IsNullOrEmpty(role))
        {
            query = query.Where(u => u.Role == role);
        }
        
        var users = await query
            .Select(u => new { u.Id, u.FullName, u.Email, u.Role, u.CreatedAt, u.IsActive })
            .Take(100) // Giới hạn 100 user mới nhất
            .OrderByDescending(u => u.CreatedAt)
            .ToListAsync();

        return Ok(users);
    }

    [HttpDelete("users/{id}")]
    public async Task<IActionResult> DeleteUser(Guid id)
    {
        var user = await _context.Users.FindAsync(id);
        if (user == null) return NotFound();

        _context.Users.Remove(user);
        await _context.SaveChangesAsync();
        return Ok(new { Message = "Đã xóa người dùng thành công" });
    }
}