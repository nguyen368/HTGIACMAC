using Microsoft.AspNetCore.Mvc;
using Aura.Infrastructure.Persistence;
using Aura.Domain.Entities;
using Aura.Application.DTOs;
using Microsoft.EntityFrameworkCore;

namespace Aura.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AuthController : ControllerBase
    {
        private readonly AuraDbContext _context;

        public AuthController(AuraDbContext context)
        {
            _context = context;
        }

        // API Đăng ký (Đã làm)
        [HttpPost("register")]
        public async Task<IActionResult> Register([FromBody] RegisterDto request)
        {
            if (await _context.Users.AnyAsync(u => u.Email == request.Email))
            {
                return BadRequest("Email này đã được sử dụng!");
            }

            var user = new User
            {
                FullName = request.FullName,
                Email = request.Email,
                PasswordHash = request.Password, // Lưu ý: Dự án thật phải mã hóa password nhé!
                Role = "User",
                IsActive = true
            };

            _context.Users.Add(user);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Đăng ký thành công!", userId = user.Id });
        }

        // --- PHẦN MỚI THÊM: API ĐĂNG NHẬP ---
        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginDto request)
        {
            // 1. Tìm user theo email
            var user = await _context.Users
                .FirstOrDefaultAsync(u => u.Email == request.Email);

            // 2. Kiểm tra nếu không tìm thấy hoặc sai password
            if (user == null || user.PasswordHash != request.Password)
            {
                return Unauthorized("Email hoặc mật khẩu không chính xác!");
            }

            // 3. Trả về thông tin User (Sau này sẽ trả về Token JWT ở đây)
            return Ok(new 
            { 
                message = "Đăng nhập thành công!", 
                userId = user.Id,
                fullName = user.FullName,
                role = user.Role
            });
        }
    }
}