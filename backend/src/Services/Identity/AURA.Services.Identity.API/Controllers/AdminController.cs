using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using AURA.Services.Identity.Infrastructure.Data;

namespace AURA.Services.Identity.API.Controllers;

[ApiController]
[Route("api/admin")]
[Authorize(Roles = "SuperAdmin")] // Chỉ Super Admin mới được vào đây
public class AdminController : ControllerBase
{
    private readonly AppIdentityDbContext _context;
    public AdminController(AppIdentityDbContext context) => _context = context;

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
}