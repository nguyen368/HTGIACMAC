using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using AURA.Services.Identity.Application.Interfaces;
using AURA.Services.Identity.Domain.Entities;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;

namespace AURA.Services.Identity.Infrastructure.Services
{
    public class JwtTokenService : IJwtTokenService
    {
        private readonly IConfiguration _configuration;

        public JwtTokenService(IConfiguration configuration)
        {
            _configuration = configuration;
        }

        public string GenerateToken(User user)
        {
            // Lấy config từ appsettings.json
            var secretKey = _configuration["JwtSettings:SecretKey"];
            var issuer = _configuration["JwtSettings:Issuer"];
            var audience = _configuration["JwtSettings:Audience"];
            var durationInMinutes = double.Parse(_configuration["JwtSettings:DurationInMinutes"]!);

            var securityKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey!));
            var credentials = new SigningCredentials(securityKey, SecurityAlgorithms.HmacSha256);

            // Tạo danh sách Claims (Thông tin đóng gói trong token)
            var claims = new List<Claim>
            {
                // Sửa: Luôn convert Id sang string an toàn
                new Claim(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
                
                // Sửa: Dùng toán tử ?? "" để nếu null thì thay bằng chuỗi rỗng
                new Claim(JwtRegisteredClaimNames.Email, user.Email ?? ""),
                new Claim("username", user.Username ?? ""),
                
                // --- ĐÂY LÀ CHỖ GÂY LỖI 500 ---
                // Tôi đã sửa thành: user.FullName ?? "User" 
                // Nghĩa là: Nếu chưa có tên thì gọi tạm là "User"
                new Claim("fullName", user.FullName ?? "User"),
                
                // Claim Role
                new Claim(ClaimTypes.Role, user.Role ?? "Patient"), 

                // Clinic ID: Nếu null thì để rỗng
                new Claim("clinicId", user.ClinicId?.ToString() ?? string.Empty),
                
                new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())
            };

            var token = new JwtSecurityToken(
                issuer: issuer,
                audience: audience,
                claims: claims,
                expires: DateTime.UtcNow.AddMinutes(durationInMinutes),
                signingCredentials: credentials);

            return new JwtSecurityTokenHandler().WriteToken(token);
        }
    }
}