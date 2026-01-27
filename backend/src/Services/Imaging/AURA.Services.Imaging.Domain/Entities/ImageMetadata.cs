using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace AURA.Services.Imaging.Domain.Entities
{
    // FIX CS0103: Khai báo Enum để Controller có thể sử dụng
    public enum ImageStatus { Pending = 0, Analyzed = 1, Rejected = 2, Failed = 3 }

    public class ImageMetadata
    {
        [Key]
        public Guid Id { get; set; } = Guid.NewGuid();

        public Guid PatientId { get; set; }
        public Guid ClinicId { get; set; }
        
        public string OriginalImageUrl { get; set; } = string.Empty;
        public string PublicId { get; set; } = string.Empty; // Cloudinary ID

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        
        // Cập nhật kiểu dữ liệu thành ImageStatus Enum
        public ImageStatus Status { get; set; } = ImageStatus.Pending; 

        // Kết quả từ AI trả về
        public string? PredictionResult { get; set; } // Ví dụ: "DR_Moderate"
        
        // FIX CS1061: Thêm thuộc tính RiskLevel còn thiếu
        public string RiskLevel { get; set; } = string.Empty; 
        
        public double ConfidenceScore { get; set; } = 0;
        public string? HeatmapUrl { get; set; } // Link ảnh bản đồ nhiệt

        public ImageMetadata() { }

        public ImageMetadata(Guid patientId, Guid clinicId, string url, string publicId)
        {
            Id = Guid.NewGuid();
            PatientId = patientId;
            ClinicId = clinicId;
            OriginalImageUrl = url;
            PublicId = publicId;
            CreatedAt = DateTime.UtcNow;
            Status = ImageStatus.Pending;
        }
    }
}