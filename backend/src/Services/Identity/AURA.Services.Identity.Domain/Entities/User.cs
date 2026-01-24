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
<<<<<<< HEAD
            
            PhoneNumber = null; 
            CitizenId = null; // Mặc định null

            ClinicId = clinicId;
=======
            ClinicId = clinicId;

            // Bệnh nhân và Bác sĩ được kích hoạt ngay. Quản lý (ClinicAdmin) phải chờ duyệt.
>>>>>>> 7d68b20f0738f90995a124216dde00831c1ce63d
            IsActive = (role == "ClinicAdmin") ? false : true; 
        }

        public string Username { get; private set; } = string.Empty;
        public string PasswordHash { get; private set; } = string.Empty;
        public string Email { get; private set; } = string.Empty;
        public string FullName { get; private set; } = string.Empty;
        public string Role { get; private set; } = "Patient";
        public DateTime CreatedAt { get; private set; }
<<<<<<< HEAD

        public Guid? ClinicId { get; private set; } 
        public bool IsActive { get; private set; }

        public string? PhoneNumber { get; private set; } 
        
        // --- [MỚI] THÊM THUỘC TÍNH NÀY ĐỂ HẾT LỖI CONTROLLER ---
        public string? CitizenId { get; private set; } 

        public void SetPhoneNumber(string phone) => PhoneNumber = phone;
        
        // --- [MỚI] THÊM HÀM SETTER ---
        public void SetCitizenId(string citizenId) => CitizenId = citizenId;

=======
        public Guid? ClinicId { get; private set; } 
        public bool IsActive { get; private set; }

>>>>>>> 7d68b20f0738f90995a124216dde00831c1ce63d
        public void SetActive(bool status) => IsActive = status;
        public void ActivateUser() => IsActive = true;
    }
}