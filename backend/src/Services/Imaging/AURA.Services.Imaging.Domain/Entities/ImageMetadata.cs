using AURA.Shared.Kernel.Primitives;

namespace AURA.Services.Imaging.Domain.Entities;

public class ImageMetadata : AggregateRoot
{
    public Guid PatientId { get; private set; }
    public string ImageUrl { get; private set; }
    public string PublicId { get; private set; }
    public DateTime UploadedAt { get; private set; }

    public ImageMetadata(Guid patientId, string imageUrl, string publicId)
    {
        Id = Guid.NewGuid();
        PatientId = patientId;
        ImageUrl = imageUrl;
        PublicId = publicId;
        UploadedAt = DateTime.UtcNow;
    }
    
    // Constructor rỗng cho EF Core
    private ImageMetadata() { }
}