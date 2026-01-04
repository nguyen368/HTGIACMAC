using Aura.Application.DTOs;
using Aura.Domain.Entities;
using Aura.Infrastructure.Persistence;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using BCrypt.Net;

namespace Aura.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ClinicController : ControllerBase
    {
        private readonly AuraDbContext _context;

        public ClinicController(AuraDbContext context)
        {
            _context = context;
        }

        // 1. [GET] Xem danh sách phòng khám
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Clinic>>> GetClinics()
        {
            return await _context.Clinics.ToListAsync();
        }

        // 2. [GET] Xem chi tiết 1 phòng khám
        [HttpGet("{id}")]
        public async Task<ActionResult<Clinic>> GetClinic(Guid id)
        {
            var clinic = await _context.Clinics.FindAsync(id);
            if (clinic == null) return NotFound("Không tìm thấy phòng khám");
            return clinic;
        }

        // 3. [POST] Tạo phòng khám (Đã test)
        [HttpPost]
        public async Task<IActionResult> CreateClinic([FromBody] CreateClinicDto request)
        {
            var clinic = new Clinic 
            { 
                Id = Guid.NewGuid(), 
                Name = request.Name, 
                Address = request.Address, 
                Phone = request.Phone 
            };
            _context.Clinics.Add(clinic);
            await _context.SaveChangesAsync();
            return CreatedAtAction(nameof(GetClinic), new { id = clinic.Id }, clinic);
        }

        // 4. [PUT] Sửa thông tin phòng khám
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateClinic(Guid id, [FromBody] UpdateClinicDto request)
        {
            var clinic = await _context.Clinics.FindAsync(id);
            if (clinic == null) return NotFound("Không tìm thấy phòng khám");

            // Chỉ update trường nào có dữ liệu gửi lên
            if (!string.IsNullOrEmpty(request.Name)) clinic.Name = request.Name;
            if (!string.IsNullOrEmpty(request.Address)) clinic.Address = request.Address;
            if (!string.IsNullOrEmpty(request.Phone)) clinic.Phone = request.Phone;

            await _context.SaveChangesAsync();
            return Ok(new { message = "Cập nhật thành công", clinic });
        }

        // 5. [DELETE] Xóa phòng khám
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteClinic(Guid id)
        {
            var clinic = await _context.Clinics.FindAsync(id);
            if (clinic == null) return NotFound("Không tìm thấy phòng khám");

            _context.Clinics.Remove(clinic);
            await _context.SaveChangesAsync();
            return Ok(new { message = "Đã xóa phòng khám" });
        }

        // 6. [GET] Xem danh sách bác sĩ của phòng khám
        [HttpGet("{clinicId}/doctors")]
        public async Task<ActionResult<IEnumerable<DoctorDto>>> GetDoctorsByClinic(Guid clinicId)
        {
            var doctors = await _context.Doctors
                .Include(d => d.User)
                .Where(d => d.ClinicId == clinicId)
                .Select(d => new DoctorDto 
                { 
                    Id = d.Id, 
                    FullName = d.User.FullName, 
                    Email = d.User.Email, 
                    Specialization = d.Specialization 
                })
                .ToListAsync();
            return Ok(doctors);
        }

        // 7. [POST] Thêm bác sĩ (Đã test)
        [HttpPost("{clinicId}/doctors")]
        public async Task<IActionResult> AddDoctor(Guid clinicId, [FromBody] CreateDoctorDto request)
        {
            var clinic = await _context.Clinics.FindAsync(clinicId);
            if (clinic == null) return NotFound("Phòng khám không tồn tại");

            if (await _context.Users.AnyAsync(u => u.Email == request.Email)) 
                return BadRequest("Email đã tồn tại");

            using var transaction = _context.Database.BeginTransaction();
            try {
                var user = new User {
                    Id = Guid.NewGuid(),
                    FullName = request.FullName,
                    Email = request.Email,
                    PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password),
                    Role = "Doctor",
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow,
                    IsDeleted = false
                };
                
                var doctor = new Doctor {
                    Id = Guid.NewGuid(),
                    UserId = user.Id,
                    ClinicId = clinic.Id,
                    Specialization = request.Specialization,
                    LicenseNumber = request.LicenseNumber
                };

                _context.Users.Add(user);
                _context.Doctors.Add(doctor);
                await _context.SaveChangesAsync();
                await transaction.CommitAsync();

                return Ok(new DoctorDto { Id = doctor.Id, FullName = user.FullName, Email = user.Email, Specialization = doctor.Specialization });
            } catch (Exception ex) {
                await transaction.RollbackAsync();
                return StatusCode(500, "Lỗi: " + ex.Message);
            }
        }
    }
}