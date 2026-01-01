using Microsoft.AspNetCore.Mvc;
using Aura.Infrastructure.Persistence;
using Aura.Domain.Entities;
using Aura.Application.DTOs;
using Microsoft.EntityFrameworkCore;
using BCrypt.Net; // Thư viện mã hóa

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

        // [POST] api/Auth/register
        [HttpPost("register")]
        public async Task<IActionResult> Register([FromBody] RegisterDto request)
        {
            // 1. Validate dữ liệu đầu vào
            if (string.IsNullOrEmpty(request.Email) || string.IsNullOrEmpty(request.Password))
            {
                return BadRequest("Email và mật khẩu không được để trống.");
            }

            // 2. Kiểm tra Email đã tồn tại chưa
            if (await _context.Users.AnyAsync(u => u.Email == request.Email))
            {
                return BadRequest("Email này đã được sử dụng!");
            }

            // 3. Mã hóa mật khẩu (Quan trọng!)
            // Work factor 11 là mức cân bằng tốt giữa bảo mật và tốc độ
            string passwordHash = BCrypt.Net.BCrypt.HashPassword(request.Password, workFactor: 11);

            // 4. Tạo User mới
            var user = new User
            {
                FullName = request.FullName,
                Email = request.Email,
                PasswordHash = passwordHash, // Lưu chuỗi đã mã hóa, KHÔNG lưu text thô
                Role = "User", // Mặc định là User, Admin sẽ set lại sau
                IsActive = true
            };

            _context.Users.Add(user);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Đăng ký thành công!", userId = user.Id });
        }

        // [POST] api/Auth/login
        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginDto request)
        {
            // 1. Tìm user theo email
            var user = await _context.Users
                .FirstOrDefaultAsync(u => u.Email == request.Email);

            // 2. Kiểm tra user có tồn tại không
            if (user == null)
            {
                return Unauthorized("Email hoặc mật khẩu không chính xác!");
            }

            // 3. Kiểm tra mật khẩu (So sánh password nhập vào với hash trong DB)
            bool isPasswordValid = BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash);

            if (!isPasswordValid)
            {
                return Unauthorized("Email hoặc mật khẩu không chính xác!");
            }

            // 4. Kiểm tra tài khoản có bị khóa không
            if (!user.IsActive)
            {
                return Unauthorized("Tài khoản này đã bị khóa.");
            }

            // 5. Trả về thông tin (Tuần 4 sẽ nâng cấp lên JWT Token ở đây)
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