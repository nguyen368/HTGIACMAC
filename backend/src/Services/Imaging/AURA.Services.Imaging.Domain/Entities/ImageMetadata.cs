using AURA.Shared.Kernel.Primitives;
using System; // Đảm bảo có namespace này cho DateTime và Guid

namespace AURA.Services.Imaging.Domain.Entities
{
    public class ImageMetadata : AggregateRoot
    {
        public Guid PatientId { get; private set; }
        
        // [TV5] Trường này xác định ảnh thuộc Phòng khám nào
        public Guid ClinicId { get; private set; } 

        public string ImageUrl { get; private set; }
        public string PublicId { get; private set; }
        public DateTime UploadedAt { get; private set; }

        // --- [MỚI] Các trường hỗ trợ AI và Quy trình xử lý ---
        // Trạng thái: Pending (Chờ) -> Analyzed (Đã xong) -> Verified (Bác sĩ duyệt)
        public string Status { get; private set; } = "Pending"; 
        
        // Lưu kết quả JSON thô từ AI trả về (nullable vì lúc mới upload chưa có)
        public string? AiAnalysisResultJson { get; private set; }

        // Constructor
        public ImageMetadata(Guid patientId, Guid clinicId, string imageUrl, string publicId)
        {
            Id = Guid.NewGuid();
            PatientId = patientId;
            ClinicId = clinicId;
            ImageUrl = imageUrl;
            PublicId = publicId;
            UploadedAt = DateTime.UtcNow;
            Status = "Pending"; // Mặc định khi mới upload
        }

        // Constructor rỗng cho EF Core
        protected ImageMetadata() { }

        // --- [MỚI] Phương thức cập nhật kết quả AI (Behavior) ---
        public void UpdateAiResult(string jsonResult)
        {
            if (string.IsNullOrWhiteSpace(jsonResult))
                throw new ArgumentException("Kết quả AI không được để trống");

            AiAnalysisResultJson = jsonResult;
            Status = "Analyzed"; // Chuyển trạng thái sang đã phân tích
        }
    }
}