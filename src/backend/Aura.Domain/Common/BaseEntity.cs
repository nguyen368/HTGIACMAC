using System;

namespace Aura.Domain.Common
{
    public abstract class BaseEntity
    {
        public Guid Id { get; set; } = Guid.NewGuid(); // ID dạng chuỗi ngẫu nhiên (UUID)
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? UpdatedAt { get; set; }
        public bool IsDeleted { get; set; } = false; // Xóa mềm (ẩn đi chứ không xóa thật)
    }
}