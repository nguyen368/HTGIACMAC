using AURA.Shared.Kernel.Primitives;

namespace AURA.Services.Identity.Domain.Entities
{
    public class User : Entity 
    {
        // Constructor rỗng cho EF Core
        private User() { }

        // Constructor public (Giữ nguyên logic của bạn)
        public User(Guid id, string username, string passwordHash, string email, string fullName, string role, Guid? clinicId = null)
        {
            Id = id; 
            Username = username;
            PasswordHash = passwordHash;
            Email = email;
            FullName = fullName;
            Role = role;
            CreatedAt = DateTime.UtcNow;

            // --- CODE LIÊN KẾT PHÒNG KHÁM ---
            ClinicId = clinicId;
            // Nếu là ClinicAdmin thì mặc định chưa kích hoạt (chờ duyệt)
            IsActive = (role == "ClinicAdmin") ? false : true; 
        }

        public string Username { get; private set; } = string.Empty;
        public string PasswordHash { get; private set; } = string.Empty;
        public string Email { get; private set; } = string.Empty;
        public string FullName { get; private set; } = string.Empty;
        public string Role { get; private set; } = "Patient";
        public DateTime CreatedAt { get; private set; }

        // --- CÁC TRƯỜNG MỚI ---
        public Guid? ClinicId { get; private set; } 
        public bool IsActive { get; private set; }

        // --- HÀM BỔ SUNG ĐỂ SỬA LỖI BUILD ---
        
        /// <summary>
        /// Cập nhật trạng thái hoạt động của User (Dùng trong AdminController)
        /// </summary>
        public void SetActive(bool status) 
        {
            IsActive = status;
        }

        /// <summary>
        /// Hàm kích hoạt nhanh tài khoản
        /// </summary>
        public void ActivateUser() => IsActive = true;
    }
}