using MediatR;
using Microsoft.AspNetCore.Mvc;
using AURA.Services.Identity.Application.Users.Commands.RegisterUser;
using AURA.Services.Identity.Application.Users.Queries.Login;
using AURA.Services.Identity.Application.Users.Queries.GetPatients; 
using AURA.Services.Identity.Infrastructure.Data;
using AURA.Services.Identity.Domain.Entities;
using AURA.Services.Identity.API.DTOs;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using Google.Apis.Auth; // Thư viện Google
using AURA.Services.Identity.Application.Interfaces; // Để dùng IJwtTokenService

namespace AURA.Services.Identity.API.Controllers;

// DTO nhận token từ Frontend
public class GoogleLoginRequest
{
    public string Token { get; set; }
}

[ApiController]
[Route("api/auth")]
public class AuthController : ControllerBase
{
    private readonly ISender _sender;
    private readonly AppIdentityDbContext _context;
    private readonly IJwtTokenService _jwtTokenService; // Service tạo Token

    public AuthController(
        ISender sender, 
        AppIdentityDbContext context,
        IJwtTokenService jwtTokenService)
    {
        _sender = sender;
        _context = context;
        _jwtTokenService = jwtTokenService;
    }

    // =========================================================
    // 1. CÁC API CŨ CỦA BẠN (GIỮ NGUYÊN 100%)
    // =========================================================

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

    [HttpPost("register-partner")]
    public async Task<IActionResult> RegisterPartner([FromBody] RegisterPartnerDto dto)
    {
        using var transaction = await _context.Database.BeginTransactionAsync();
        try
        {
            var clinic = new Clinic(dto.ClinicName, dto.ClinicAddress, dto.LicenseUrl);
            _context.Clinics.Add(clinic);
            await _context.SaveChangesAsync();

            var passwordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password);
            
            var user = new User(
                Guid.NewGuid(),
                dto.Username,
                passwordHash,
                dto.Email,
                dto.FullName,
                "ClinicAdmin",
                clinic.Id 
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

    [Authorize(Roles = "ClinicAdmin")]
    [HttpPost("create-doctor")]
    public async Task<IActionResult> CreateDoctor([FromBody] CreateDoctorDto dto)
    {
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

    // =========================================================
    // 2. API GOOGLE LOGIN (MỚI THÊM VÀO)
    // =========================================================

    [HttpPost("google-login")]
    public async Task<IActionResult> GoogleLogin([FromBody] GoogleLoginRequest request)
    {
        try
        {
            // A. Cấu hình xác thực Google
            // Client ID này phải khớp với cái ở Frontend và Google Console
            var settings = new GoogleJsonWebSignature.ValidationSettings()
            {
                Audience = new List<string>() { "738290642667-5ijkcle6dmrk4rboc9i7djnombohemcv.apps.googleusercontent.com" } 
            };
            
            // B. Xác thực token gửi lên từ Frontend
            var payload = await GoogleJsonWebSignature.ValidateAsync(request.Token, settings);

            if (payload == null)
                return BadRequest(new { message = "Token Google không hợp lệ." });

            // C. Kiểm tra User trong DB
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == payload.Email);

            if (user == null)
            {
                // D. Nếu chưa có -> Tạo User mới (Role mặc định: Patient)
                user = new User(
                    Guid.NewGuid(),
                    payload.Email, // Username lấy email
                    "", // Password để trống hoặc chuỗi ngẫu nhiên vì dùng Google
                    payload.Email,
                    payload.Name, // Fullname từ Google
                    "Patient",
                    null // Không thuộc phòng khám nào
                );

                // Nếu entity User yêu cầu PasswordHash không được null, hãy tạo fake
                // user.UpdatePasswordHash("GOOGLE_AUTH_NO_PASSWORD"); 

                _context.Users.Add(user);
                await _context.SaveChangesAsync();
            }

            // E. Tạo Token hệ thống (JWT) trả về cho Frontend
            // Sử dụng IJwtTokenService đã inject ở trên
            var token = _jwtTokenService.GenerateToken(user); 

            // F. Trả về kết quả đúng format Frontend đang đợi
            return Ok(new
            {
                token = token,
                role = user.Role,
                fullName = user.FullName,
                email = user.Email,
                picture = payload.Picture
            });
        }
        catch (InvalidJwtException)
        {
            return Unauthorized(new { message = "Token Google giả mạo hoặc hết hạn." });
        }
        catch (Exception ex)
        {
            // Log lỗi ra console để debug nếu cần
            Console.WriteLine(ex.ToString());
            return StatusCode(500, new { message = "Lỗi Server: " + ex.Message });
        }
    }
}