using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AURA.Services.Identity.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class TestAuthController : ControllerBase
    {
        // 1. Ai cũng vào được (Không cần đăng nhập)
        [HttpGet("public")]
        public IActionResult GetPublicData()
        {
            return Ok("Đây là dữ liệu công khai. Ai xem cũng được.");
        }

        // 2. Phải có Token (Bất kể Role gì) mới vào được
        [Authorize] 
        [HttpGet("authenticated")]
        public IActionResult GetAuthenticatedData()
        {
            return Ok($"Chào bạn, bạn đã đăng nhập thành công! User: {User.Identity?.Name}");
        }

        // 3. Chỉ ADMIN mới vào được
        [Authorize(Roles = "Admin")]
        [HttpGet("admin-only")]
        public IActionResult GetAdminData()
        {
            return Ok("Xin chào Sếp! Đây là dữ liệu mật chỉ Admin mới thấy.");
        }

        // 4. Chỉ DOCTOR mới vào được
        [Authorize(Roles = "Doctor")]
        [HttpGet("doctor-only")]
        public IActionResult GetDoctorData()
        {
            return Ok("Xin chào Bác sĩ! Đây là hồ sơ bệnh án.");
        }
    }
}