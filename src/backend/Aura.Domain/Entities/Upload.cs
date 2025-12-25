using System;
using Aura.Domain.Common;

namespace Aura.Domain.Entities
{
    public class Upload : BaseEntity
    {
        public Guid UserId { get; set; } // Khóa ngoại
        public User User { get; set; } = null!; // Quan hệ ngược lại

        public string ImageUrl { get; set; } = string.Empty; // Link ảnh trên Cloud
        public string Status { get; set; } = "Pending"; // Pending (Chờ), Completed (Xong)
        
        public AIResult? AIResult { get; set; } // 1 Upload có 1 kết quả
    }
}