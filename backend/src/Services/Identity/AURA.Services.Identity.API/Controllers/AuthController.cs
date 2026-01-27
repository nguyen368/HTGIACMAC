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
using MassTransit; 
using AURA.Shared.Messaging.Events; 

namespace AURA.Services.Identity.API.Controllers;

public class GoogleLoginRequest
{
    public string Token { get; set; } = string.Empty;
}

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
    private readonly IPublishEndpoint _publishEndpoint;

    public AuthController(
        ISender sender, 
        AppIdentityDbContext context,
        IJwtTokenService jwtTokenService,
        FirebaseAuthService firebaseService,
        IPublishEndpoint publishEndpoint)
    {
        _sender = sender;
        _context = context;
        _jwtTokenService = jwtTokenService;
        _firebaseService = firebaseService;
        _publishEndpoint = publishEndpoint;
    }

    // --- CÁC API KHÁC GIỮ NGUYÊN ---

    [HttpPost("register")]
    public async Task<IActionResult> Register(RegisterUserCommand command)
    {
        var result = await _sender.Send(command);
        if (result.IsSuccess)
        {
            // Publish Event an toàn (Fire-and-forget)
            try 
            {
                await _publishEndpoint.Publish(new UserRegisteredIntegrationEvent(
                    result.Value, 
                    command.Email, 
                    command.FullName, 
                    command.PhoneNumber, 
                    "Patient", 
                    null 
                ));
            }
            catch (Exception) { /* Log lỗi RabbitMQ nhưng không làm fail request đăng ký */ }

            return Ok(new { 
                isSuccess = true, 
                message = "Đăng ký tài khoản bệnh nhân thành công!" 
            });
        }
        return BadRequest(new { isSuccess = false, message = result.Error });
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login(LoginQuery query)
    {
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
            return Ok(result.Value); 
        }

        return Unauthorized(new { isSuccess = false, message = "Tài khoản hoặc mật khẩu không chính xác." });
    }

    // --- [FIX] SỬA LỖI TRANSACTION ---
    [HttpPost("register-partner")]
    public async Task<IActionResult> RegisterPartner([FromBody] RegisterPartnerDto dto)
    {
        // 1. Kiểm tra trùng lặp trước để tránh lỗi DB
        if (await _context.Users.AnyAsync(u => u.Email == dto.Email))
            return BadRequest(new { isSuccess = false, message = "Email này đã được sử dụng." });

        if (await _context.Users.AnyAsync(u => u.Username == dto.Username))
            return BadRequest(new { isSuccess = false, message = "Username này đã được sử dụng." });

        User user = null;

        // 2. Transaction chỉ bao bọc thao tác DB
        using var transaction = await _context.Database.BeginTransactionAsync();
        try
        {
            var clinic = new Clinic(dto.ClinicName, dto.ClinicAddress, dto.LicenseUrl);
            _context.Clinics.Add(clinic);
            await _context.SaveChangesAsync();

            var passwordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password);
            
            user = new User(
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

            await transaction.CommitAsync(); // DB thành công -> Chốt transaction
        }
        catch (Exception ex)
        {
            await transaction.RollbackAsync(); // Chỉ rollback khi lỗi DB
            return BadRequest(new { isSuccess = false, message = "Đăng ký thất bại", detail = ex.Message });
        }

        // 3. Publish Event ra ngoài Transaction (Nếu lỗi cũng không ảnh hưởng việc tạo User)
        try
        {
            await _publishEndpoint.Publish(new UserRegisteredIntegrationEvent(
                user.Id, 
                user.Email, 
                user.FullName, 
                user.PhoneNumber ?? "", // Xử lý null
                user.Role, 
                user.ClinicId
            ));
        }
        catch (Exception)
        {
            // Log warning: User đã tạo nhưng Event gửi thất bại
            // Hệ thống vẫn coi là đăng ký thành công
        }
        
        return Ok(new { 
            isSuccess = true, 
            message = "Gửi yêu cầu hợp tác thành công! Bạn có thể đăng nhập ngay." 
        });
    }

    [Authorize(Roles = "ClinicAdmin")]
    [HttpPost("create-doctor")]
    public async Task<IActionResult> CreateDoctor([FromBody] CreateDoctorDto dto)
    {
        var clinicIdClaim = User.FindFirst("clinicId")?.Value ?? User.FindFirst("ClinicId")?.Value;
        
        if (string.IsNullOrEmpty(clinicIdClaim)) 
            return Unauthorized(new { message = "Không tìm thấy thông tin phòng khám của bạn trong Token." });

        if (await _context.Users.AnyAsync(u => u.Username == dto.Username || u.Email == dto.Email))
             return BadRequest(new { message = "Tài khoản hoặc Email đã tồn tại." });

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

        try 
        {
            await _publishEndpoint.Publish(new UserRegisteredIntegrationEvent(
                doctor.Id, 
                doctor.Email, 
                doctor.FullName, 
                doctor.PhoneNumber ?? "", 
                doctor.Role, 
                doctor.ClinicId
            ));
        }
        catch { }

        return Ok(new { isSuccess = true, message = "Đã tạo tài khoản Bác sĩ thành công." });
    }

    [HttpGet("patients")]
    public async Task<IActionResult> GetAllPatients()
    {
        var result = await _sender.Send(new GetPatientsQuery());
        return result.IsSuccess ? Ok(result.Value) : BadRequest(result.Error);
    }

    [HttpGet("clinics")]
    [AllowAnonymous]
    public async Task<IActionResult> GetClinics()
    {
        try
        {
            var clinics = await _context.Clinics
                .Select(c => new {
                    id = c.Id,
                    name = c.Name,
                    address = c.Address
                })
                .ToListAsync();

            return Ok(clinics);
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = "Không thể tải danh sách phòng khám", error = ex.Message });
        }
    }

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

                try {
                    await _publishEndpoint.Publish(new UserRegisteredIntegrationEvent(
                        user.Id, user.Email, user.FullName, null, user.Role, null
                    ));
                } catch {}
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

                try {
                    await _publishEndpoint.Publish(new UserRegisteredIntegrationEvent(
                        user.Id, user.Email, user.FullName, null, user.Role, null
                    ));
                } catch {}
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