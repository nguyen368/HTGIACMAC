using AURA.Shared.Kernel.Primitives;

namespace AURA.Services.Identity.Domain.Entities
{
    public class User : Entity // Entity đã có sẵn public Guid Id { get; protected set; }
    {
        // Constructor rỗng cho EF Core
        private User() { }

        // Constructor public
        public User(Guid id, string username, string passwordHash, string email, string fullName, string role)
        {
            Id = id; // Gán vào Id của lớp cha (Entity)
            Username = username;
            PasswordHash = passwordHash;
            Email = email;
            FullName = fullName;
            Role = role;
            CreatedAt = DateTime.UtcNow;
        }

        // --- ĐÃ XÓA DÒNG public Guid Id Ở ĐÂY ĐỂ HẾT WARNING ---
        
        public string Username { get; private set; } = string.Empty;
        public string PasswordHash { get; private set; } = string.Empty;
        public string Email { get; private set; } = string.Empty;
        public string FullName { get; private set; } = string.Empty;
        public string Role { get; private set; } = "Patient";
        public DateTime CreatedAt { get; private set; }
    }
}