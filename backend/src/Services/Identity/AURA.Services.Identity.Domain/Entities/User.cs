using AURA.Shared.Kernel.Primitives;
using System;

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
            // Bệnh nhân/Bác sĩ kích hoạt ngay, ClinicAdmin đợi duyệt
            IsActive = (role != "ClinicAdmin"); 
        }

        public string Username { get; private set; } = string.Empty;
        public string PasswordHash { get; private set; } = string.Empty;
        public string Email { get; private set; } = string.Empty;
        public string FullName { get; private set; } = string.Empty;
        public string Role { get; private set; } = "Patient";
        public DateTime CreatedAt { get; private set; }
        public Guid? ClinicId { get; private set; } 
        public bool IsActive { get; private set; }
        public string? PhoneNumber { get; private set; } 
        public string? CitizenId { get; private set; } 

        // Các hàm nghiệp vụ (Bắt buộc phải có để hết lỗi build)
        public void SetPhoneNumber(string phone) => PhoneNumber = phone;
        public void SetCitizenId(string citizenId) => CitizenId = citizenId;
        public void SetActive(bool status) => IsActive = status;
        
        // Hàm này AdminController đang gọi đây:
        public void ActivateUser() => IsActive = true;
    }
}