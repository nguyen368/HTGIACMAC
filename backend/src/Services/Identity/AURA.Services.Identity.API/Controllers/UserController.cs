using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using AURA.Services.Identity.Domain.Entities; 
using AURA.Services.Identity.Infrastructure.Data; 

namespace AURA.Services.Identity.API.Controllers
{
    public class CreatePatientRequest
    {
        public string FullName { get; set; } = string.Empty;
        public string CitizenId { get; set; } = string.Empty;
        public string PhoneNumber { get; set; } = string.Empty;
        public int Age { get; set; }
        public string Gender { get; set; } = "Male";
    }

    [ApiController]
    [Route("api/users")]
    public class UserController : ControllerBase
    {
        private readonly AppIdentityDbContext _context; 

        public UserController(AppIdentityDbContext context)
        {
            _context = context;
        }

        // 1. Lấy danh sách bệnh nhân (ĐÃ SỬA LỖI HOA/THƯỜNG)
        [HttpGet("patients")]
        public async Task<IActionResult> GetPatients()
        {
            try 
            {
                var patients = await _context.Users
                    // --- QUAN TRỌNG: Dùng ToLower() để tìm chính xác bất chấp hoa thường ---
                    .Where(u => u.Role.ToLower() == "patient") 
                    // ----------------------------------------------------------------------
                    .Select(u => new 
                    {
                        Id = u.Id,
                        FullName = u.FullName ?? "Chưa đặt tên",
                        Email = u.Email,
                        Phone = u.PhoneNumber ?? "",
                        CitizenId = u.CitizenId ?? "N/A"
                    })
                    .ToListAsync();

                return Ok(patients);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Lỗi Server", error = ex.Message });
            }
        }

        // 2. Tạo bệnh nhân mới
        [HttpPost("patients")]
        public async Task<IActionResult> CreatePatient([FromBody] CreatePatientRequest request)
        {
            if (string.IsNullOrEmpty(request.FullName)) return BadRequest("Tên không được để trống");

            // --- Logic khởi tạo User dùng Constructor ---
            var newId = Guid.NewGuid();
            var newUsername = request.PhoneNumber; 
            if(string.IsNullOrEmpty(newUsername)) newUsername = "user_" + newId.ToString().Substring(0,8);

            var newPatient = new User(
                id: newId,
                username: newUsername,
                passwordHash: "NoPassword", 
                email: $"patient_{newId}@aura.local", 
                fullName: request.FullName,
                role: "patient", // Lưu role chữ thường cho đồng bộ
                clinicId: null
            );

            if(!string.IsNullOrEmpty(request.PhoneNumber)) newPatient.SetPhoneNumber(request.PhoneNumber);
            if(!string.IsNullOrEmpty(request.CitizenId)) newPatient.SetCitizenId(request.CitizenId);

            try {
                _context.Users.Add(newPatient);
                await _context.SaveChangesAsync();

                return Ok(new {
                    Id = newPatient.Id,
                    FullName = newPatient.FullName,
                    Email = newPatient.Email,
                    Phone = newPatient.PhoneNumber,
                    CitizenId = newPatient.CitizenId 
                });
            }
            catch (Exception ex) {
                return StatusCode(500, "Lỗi lưu DB: " + ex.Message);
            }
        }
    }
}