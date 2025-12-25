using System;
using Aura.Domain.Common;

namespace Aura.Domain.Entities
{
    public class AIResult : BaseEntity
    {
        public Guid UploadId { get; set; }
        public Upload Upload { get; set; } = null!;

        public double RiskScore { get; set; } // Điểm nguy cơ (0.0 - 1.0)
        public string Diagnosis { get; set; } = string.Empty; // Chẩn đoán
        public string MetadataJson { get; set; } = "{}"; // Lưu tọa độ vùng bệnh
    }
}