using Aura.Domain.Entities;
using Aura.Infrastructure.Persistence;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Aura.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class UserController : ControllerBase
    {
        private readonly AuraDbContext _context;

        public UserController(AuraDbContext context)
        {
            _context = context;
        }

        // GET: api/User/5
        // Lấy thông tin chi tiết người dùng
        [HttpGet("{id}")]
        public async Task<ActionResult<User>> GetUser(int id)
        {
            var user = await _context.Users.FindAsync(id);

            if (user == null)
            {
                return NotFound("Không tìm thấy người dùng");
            }

            // Ẩn mật khẩu trước khi trả về
            user.PasswordHash = null; 
            return user;
        }

        // PUT: api/User/5
        // Cập nhật thông tin (Họ tên, Email)
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateUser(int id, [FromBody] UserUpdateDto request)
        {
            var user = await _context.Users.FindAsync(id);
            if (user == null) return NotFound();

            user.FullName = request.FullName;
            // Nếu muốn cho sửa Email thì mở dòng dưới, cần check trùng email nữa
            // user.Email = request.Email; 

            _context.Users.Update(user);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Cập nhật hồ sơ thành công!" });
        }
    }

    // DTO để hứng dữ liệu update
    public class UserUpdateDto
    {
        public string FullName { get; set; }
        public string Email { get; set; }
    }
}