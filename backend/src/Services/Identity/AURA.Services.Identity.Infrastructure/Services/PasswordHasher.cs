using AURA.Services.Identity.Application.Interfaces;
using BCrypt.Net;

namespace AURA.Services.Identity.Infrastructure.Services;

public class PasswordHasher : IPasswordHasher
{
    public string Hash(string password)
    {
        // Tạo hash với salt tự động (mặc định work factor là 11 hoặc 12)
        return BCrypt.Net.BCrypt.HashPassword(password);
    }

    public bool Verify(string password, string passwordHash)
    {
        // Hàm Verify của BCrypt tự tách salt từ hash ra để so sánh
        return BCrypt.Net.BCrypt.Verify(password, passwordHash);
    }
}