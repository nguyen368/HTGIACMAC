using System;
using System.Collections.Generic; // Để dùng ICollection
using Aura.Domain.Common;

namespace Aura.Domain.Entities
{
    public class User : BaseEntity
    {
        public string Email { get; set; } = string.Empty;
        public string PasswordHash { get; set; } = string.Empty;
        public string FullName { get; set; } = string.Empty;
        public string Role { get; set; } = "User"; // Ví dụ: Admin, Doctor, User
        public bool IsActive { get; set; } = true;

        // Một người có thể upload nhiều ảnh
        public ICollection<Upload> Uploads { get; set; } = new List<Upload>();
    }
}