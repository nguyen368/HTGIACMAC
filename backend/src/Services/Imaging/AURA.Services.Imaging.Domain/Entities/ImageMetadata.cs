using AURA.Shared.Kernel.Primitives;

namespace AURA.Services.Imaging.Domain.Entities
{
    public class ImageMetadata : AggregateRoot
    {
        public Guid PatientId { get; private set; }
        
        // [TV5] Thêm trường này để biết ảnh của Phòng khám nào
        public Guid ClinicId { get; private set; } 

        public string ImageUrl { get; private set; }
        public string PublicId { get; private set; }
        public DateTime UploadedAt { get; private set; }

        // Constructor cập nhật thêm clinicId
        public ImageMetadata(Guid patientId, Guid clinicId, string imageUrl, string publicId)
        {
            Id = Guid.NewGuid();
            PatientId = patientId;
            ClinicId = clinicId; // Gán giá trị
            ImageUrl = imageUrl;
            PublicId = publicId;
            UploadedAt = DateTime.UtcNow;
        }

        // Constructor rỗng cho EF Core
        protected ImageMetadata() { }
    }
}