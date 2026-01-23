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
using Google.Apis.Auth; 
using AURA.Services.Identity.Application.Interfaces;
using AURA.Services.Identity.API.Services;

namespace AURA.Services.Identity.API.Controllers;

// DTO cho Google Login
public class GoogleLoginRequest
{
    public string Token { get; set; } = string.Empty;
}

// DTO cho Firebase Login
public class FirebaseLoginRequest
{
    public string IdToken { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string DisplayName { get; set; } = string.Empty;
}

[ApiController]
[Route("api/auth")]
public class AuthController : ControllerBase
{
    private readonly ISender _sender;
    private readonly AppIdentityDbContext _context;
    private readonly IJwtTokenService _jwtTokenService;
    private readonly FirebaseAuthService _firebaseService; 

    public AuthController(
        ISender sender, 
        AppIdentityDbContext context,
        IJwtTokenService jwtTokenService,
        FirebaseAuthService firebaseService)
    {
        _sender = sender;
        _context = context;
        _jwtTokenService = jwtTokenService;
        _firebaseService = firebaseService;
    }

    // 1. ĐĂNG KÝ BỆNH NHÂN (Mặc định IsActive = true trong Entity)
    [HttpPost("register")]
    public async Task<IActionResult> Register(RegisterUserCommand command)
    {
        var result = await _sender.Send(command);
        if (result.IsSuccess)
        {
            return Ok(new { 
                isSuccess = true, 
                message = "Đăng ký tài khoản bệnh nhân thành công!" 
            });
        }
        return BadRequest(new { isSuccess = false, message = result.Error });
    }

    // 2. ĐĂNG NHẬP (Kiểm tra trạng thái phê duyệt)
    [HttpPost("login")]
    public async Task<IActionResult> Login(LoginQuery query)
    {
        // Kiểm tra xem User có tồn tại và đã được kích hoạt chưa
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == query.Email || u.Username == query.Email);
        
        if (user != null && !user.IsActive)
        {
            return Ok(new { 
                isSuccess = false, 
                message = "Tài khoản của bạn đang chờ quản trị viên phê duyệt. Vui lòng quay lại sau." 
            });
        }

        var result = await _sender.Send(query);
        
        if (result.IsSuccess)
        {
            // Trả về dữ liệu thành công kèm token
            return Ok(result.Value); 
        }

        return Unauthorized(new { isSuccess = false, message = "Tài khoản hoặc mật khẩu không chính xác." });
    }

    // 3. ĐĂNG KÝ ĐỐI TÁC/QUẢN LÝ (Chờ Admin duyệt)
    [HttpPost("register-partner")]
    public async Task<IActionResult> RegisterPartner([FromBody] RegisterPartnerDto dto)
    {
        using var transaction = await _context.Database.BeginTransactionAsync();
        try
        {
            // Tạo phòng khám trước
            var clinic = new Clinic(dto.ClinicName, dto.ClinicAddress, dto.LicenseUrl);
            _context.Clinics.Add(clinic);
            await _context.SaveChangesAsync();

            // Băm mật khẩu
            var passwordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password);
            
            // Tạo User Quản lý (Role ClinicAdmin)
            // Lưu ý: Constructor của User sẽ tự set IsActive = false nếu Role là ClinicAdmin
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
            
            return Ok(new { 
                isSuccess = true, 
                message = "Gửi yêu cầu hợp tác thành công! Vui lòng chờ hệ thống phê duyệt hồ sơ của bạn." 
            });
        }
        catch (Exception ex)
        {
            await transaction.RollbackAsync();
            return BadRequest(new { isSuccess = false, message = "Đăng ký thất bại", detail = ex.Message });
        }
    }

    // 4. QUẢN LÝ TẠO TÀI KHOẢN BÁC SĨ (Admin của phòng khám mới có quyền)
    [Authorize(Roles = "ClinicAdmin")]
    [HttpPost("create-doctor")]
    public async Task<IActionResult> CreateDoctor([FromBody] CreateDoctorDto dto)
    {
        var clinicIdClaim = User.FindFirst("ClinicId")?.Value;
        if (string.IsNullOrEmpty(clinicIdClaim)) 
            return Unauthorized(new { message = "Không tìm thấy thông tin phòng khám của bạn." });

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

        return Ok(new { isSuccess = true, message = "Đã tạo tài khoản Bác sĩ thành công." });
    }

    // 5. LẤY DANH SÁCH BỆNH NHÂN
    [HttpGet("patients")]
    public async Task<IActionResult> GetAllPatients()
    {
        var result = await _sender.Send(new GetPatientsQuery());
        return result.IsSuccess ? Ok(result.Value) : BadRequest(result.Error);
    }

    // 6. ĐĂNG NHẬP GOOGLE
    [HttpPost("google-login")]
    public async Task<IActionResult> GoogleLogin([FromBody] GoogleLoginRequest request)
    {
        try
        {
            var settings = new GoogleJsonWebSignature.ValidationSettings()
            {
                Audience = new List<string>() { "738290642667-5ijkcle6dmrk4rboc9i7djnombohemcv.apps.googleusercontent.com" } 
            };
            
            var payload = await GoogleJsonWebSignature.ValidateAsync(request.Token, settings);
            if (payload == null) return BadRequest(new { message = "Token Google không hợp lệ." });

            var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == payload.Email);
            if (user == null)
            {
                user = new User(Guid.NewGuid(), payload.Email, "", payload.Email, payload.Name, "Patient", null);
                _context.Users.Add(user);
                await _context.SaveChangesAsync();
            }

            var token = _jwtTokenService.GenerateToken(user); 

            return Ok(new {
                token = token,
                role = user.Role,
                fullName = user.FullName,
                email = user.Email,
                picture = payload.Picture,
                isSuccess = true
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Lỗi xác thực Google: " + ex.Message });
        }
    }

    // 7. ĐĂNG NHẬP FIREBASE
    [HttpPost("firebase-login")]
    public async Task<IActionResult> FirebaseLogin([FromBody] FirebaseLoginRequest request)
    {
        try 
        {
            var firebaseUid = await _firebaseService.VerifyTokenAsync(request.IdToken);
            if (string.IsNullOrEmpty(firebaseUid)) return Unauthorized(new { message = "Xác thực Firebase thất bại." });

            var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == request.Email);
            
            if (user == null)
            {
                user = new User(
                    Guid.NewGuid(),
                    request.Email,
                    "",
                    request.Email,
                    request.DisplayName ?? "Người dùng mới",
                    "Patient", 
                    null
                );
                _context.Users.Add(user);
                await _context.SaveChangesAsync();
            }

            var token = _jwtTokenService.GenerateToken(user);

            return Ok(new { 
                Token = token, 
                User = new { user.Id, user.FullName, user.Role },
                isSuccess = true
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { Error = ex.Message });
        }
    }
}