using MediatR;
using Microsoft.AspNetCore.Mvc;
using AURA.Services.Identity.Application.Users.Commands.RegisterUser;
using AURA.Services.Identity.Application.Users.Queries.Login;
using AURA.Services.Identity.Application.Users.Queries.GetPatients; 
using AURA.Services.Identity.Infrastructure.Data; // Thêm dòng này
using AURA.Services.Identity.Domain.Entities;   // Thêm dòng này
using AURA.Services.Identity.API.DTOs;          // Thêm dòng này
using Microsoft.AspNetCore.Authorization;       // Thêm dòng này
using Microsoft.EntityFrameworkCore;           // Thêm dòng này

namespace AURA.Services.Identity.API.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController : ControllerBase
{
    private readonly ISender _sender;
    private readonly AppIdentityDbContext _context; // Logic nước rút: Dùng trực tiếp DB Context

    public AuthController(ISender sender, AppIdentityDbContext context)
    {
        _sender = sender;
        _context = context;
    }

    [HttpPost("register")]
    public async Task<IActionResult> Register(RegisterUserCommand command)
    {
        var result = await _sender.Send(command);
        return result.IsSuccess ? Ok(result) : BadRequest(result.Error);
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login(LoginQuery query)
    {
        var result = await _sender.Send(query);
        return result.IsSuccess ? Ok(result) : Unauthorized(result.Error);
    }

    // --- LOGIC MỚI: ĐĂNG KÝ ĐỐI TÁC (PHÒNG KHÁM) ---
    [HttpPost("register-partner")]
    public async Task<IActionResult> RegisterPartner([FromBody] RegisterPartnerDto dto)
    {
        // Sử dụng Transaction để đảm bảo tính toàn vẹn (tạo cả 2 hoặc không gì cả)
        using var transaction = await _context.Database.BeginTransactionAsync();
        try
        {
            // 1. Tạo Phòng khám (Clinic)
            var clinic = new Clinic(dto.ClinicName, dto.ClinicAddress, dto.LicenseUrl);
            _context.Clinics.Add(clinic);
            await _context.SaveChangesAsync();

            // 2. Tạo User Admin cho phòng khám
            // Ghi chú: Sử dụng BCrypt để hash mật khẩu (Cần cài package BCrypt.Net-Next nếu chưa có)
            var passwordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password);
            
            var user = new User(
                Guid.NewGuid(),
                dto.Username,
                passwordHash,
                dto.Email,
                dto.FullName,
                "ClinicAdmin",
                clinic.Id // Gắn Id của phòng khám vừa tạo
            );

            _context.Users.Add(user);
            await _context.SaveChangesAsync();

            await transaction.CommitAsync();
            return Ok(new { Message = "Đăng ký đối tác thành công! Đang chờ duyệt." });
        }
        catch (Exception ex)
        {
            await transaction.RollbackAsync();
            return BadRequest(new { Error = "Đăng ký thất bại", Detail = ex.Message });
        }
    }

    // --- LOGIC MỚI: CLINIC ADMIN TẠO BÁC SĨ ---
    [Authorize(Roles = "ClinicAdmin")]
    [HttpPost("create-doctor")]
    public async Task<IActionResult> CreateDoctor([FromBody] CreateDoctorDto dto)
    {
        // Lấy ClinicId từ Claims của Token (Admin đang đăng nhập)
        var clinicIdClaim = User.FindFirst("ClinicId")?.Value;
        if (string.IsNullOrEmpty(clinicIdClaim)) 
            return Unauthorized("Không tìm thấy thông tin phòng khám của Admin.");

        var passwordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password);
        
        var doctor = new User(
            Guid.NewGuid(),
            dto.Username,
            passwordHash,
            dto.Email,
            dto.FullName,
            "Doctor",
            Guid.Parse(clinicIdClaim)
        );

        _context.Users.Add(doctor);
        await _context.SaveChangesAsync();

        return Ok(new { Message = "Đã tạo tài khoản Bác sĩ thành công." });
    }

    [HttpGet("patients")]
    public async Task<IActionResult> GetAllPatients()
    {
        var result = await _sender.Send(new GetPatientsQuery());
        return result.IsSuccess ? Ok(result) : BadRequest(result.Error);
    }
}