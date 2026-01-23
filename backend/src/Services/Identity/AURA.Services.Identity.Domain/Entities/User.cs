using AURA.Shared.Kernel.Primitives;

namespace AURA.Services.Identity.Domain.Entities
{
    public class User : Entity 
    {
        private User() { }

        public User(Guid id, string username, string passwordHash, string email, string fullName, string role, Guid? clinicId = null)
        {
            Id = id; 
            Username = username;
            PasswordHash = passwordHash;
            Email = email;
            FullName = fullName;
            Role = role;
            CreatedAt = DateTime.UtcNow;
            ClinicId = clinicId;

            // Bệnh nhân và Bác sĩ được kích hoạt ngay. Quản lý (ClinicAdmin) phải chờ duyệt.
            IsActive = (role == "ClinicAdmin") ? false : true; 
        }

        public string Username { get; private set; } = string.Empty;
        public string PasswordHash { get; private set; } = string.Empty;
        public string Email { get; private set; } = string.Empty;
        public string FullName { get; private set; } = string.Empty;
        public string Role { get; private set; } = "Patient";
        public DateTime CreatedAt { get; private set; }
        public Guid? ClinicId { get; private set; } 
        public bool IsActive { get; private set; }

        public void SetActive(bool status) => IsActive = status;
        public void ActivateUser() => IsActive = true;
    }
}