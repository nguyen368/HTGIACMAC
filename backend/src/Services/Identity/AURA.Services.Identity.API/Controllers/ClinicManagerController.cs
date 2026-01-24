using AURA.Services.Identity.API.DTOs;
using AURA.Services.Identity.Infrastructure.Data;
using AURA.Services.Identity.Domain.Entities;
using AURA.Services.Identity.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace AURA.Services.Identity.API.Controllers
{
    [ApiController]
    [Route("api/identity/clinics")]
    [Authorize]
    public class ClinicManagerController : ControllerBase
    {
        private readonly AppIdentityDbContext _context;
        private readonly IPasswordHasher _passwordHasher;

        public ClinicManagerController(AppIdentityDbContext context, IPasswordHasher passwordHasher)
        {
            _context = context;
            _passwordHasher = passwordHasher;
        }

        [HttpPost("doctors")]
        public async Task<IActionResult> AddDoctor([FromBody] CreateDoctorDto dto)
        {
            var userIdStr = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdStr)) return Unauthorized();

            var owner = await _context.Users.FindAsync(Guid.Parse(userIdStr));
            if (owner == null || owner.ClinicId == null) 
                return BadRequest("Tài khoản không gắn với phòng khám.");

            var existing = await _context.Users.FirstOrDefaultAsync(u => u.Email == dto.Email);
            if (existing != null) return BadRequest("Email đã tồn tại.");

            // FIX CHUẨN THEO CONSTRUCTOR TRONG USER.CS:
            // 1. id (Guid), 2. username, 3. passwordHash, 4. email, 5. fullName, 6. role, 7. clinicId
            var doctor = new AURA.Services.Identity.Domain.Entities.User(
                Guid.NewGuid(),                      // 1. id
                dto.Email,                           // 2. username
                _passwordHasher.Hash(dto.Password),  // 3. passwordHash
                dto.Email,                           // 4. email
                dto.FullName,                        // 5. fullName
                "Doctor",                            // 6. role
                owner.ClinicId                       // 7. clinicId
            );

            _context.Users.Add(doctor);
            await _context.SaveChangesAsync();

            return Ok(new { Message = "Đã tạo tài khoản bác sĩ thành công", DoctorId = doctor.Id });
        }

        [HttpGet("my-doctors")]
        public async Task<IActionResult> GetMyDoctors()
        {
            var userIdStr = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdStr)) return Unauthorized();

            // Sửa lỗi cảnh báo: Kiểm tra null cho userIdStr trước khi Parse
            var ownerId = Guid.Parse(userIdStr);
            var user = await _context.Users.AsNoTracking().FirstOrDefaultAsync(u => u.Id == ownerId);
            var clinicId = user?.ClinicId;

            if (clinicId == null) return Ok(new List<object>());

            var doctors = await _context.Users
                .Where(u => u.ClinicId == clinicId && u.Role == "Doctor")
                .Select(u => new { u.Id, u.FullName, u.Email, u.CreatedAt })
                .ToListAsync();

            return Ok(doctors);
        }
    }
}