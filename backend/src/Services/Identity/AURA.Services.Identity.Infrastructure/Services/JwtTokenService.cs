using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using AURA.Services.Identity.Application.Interfaces;
using AURA.Services.Identity.Domain.Entities;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;

namespace AURA.Services.Identity.Infrastructure.Services;

public class JwtTokenService : IJwtTokenService
{
    private readonly IConfiguration _configuration;

    public JwtTokenService(IConfiguration configuration)
    {
        _configuration = configuration;
    }

    public string GenerateToken(User user)
    {
        // 1. Lấy Key từ cấu hình (appsettings.json)
        var secretKey = _configuration["JwtSettings:Secret"] ?? "DayLaMotCaiKeyRatDaiVaBiMatChoDuAnAURA123456";
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        // 2. Định nghĩa các Claims (Thông tin chứa trong Token)
        var claims = new List<Claim>
        {
            new Claim(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
            new Claim(JwtRegisteredClaimNames.Email, user.Email),
            new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
            new Claim("role", user.Role) // Quan trọng cho phân quyền RBAC
        };

        // 3. Tạo Token
        var token = new JwtSecurityToken(
            issuer: _configuration["JwtSettings:Issuer"] ?? "AURA",
            audience: _configuration["JwtSettings:Audience"] ?? "AURA_Client",
            claims: claims,
            expires: DateTime.UtcNow.AddMinutes(60), // Hết hạn sau 60 phút
            signingCredentials: creds
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}