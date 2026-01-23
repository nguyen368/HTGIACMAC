using System;

namespace AURA.Services.Imaging.API.Events
{
    // Định nghĩa Event tách biệt hoàn toàn
    public record ImageUploadedEvent(Guid ImageId, string ImageUrl, Guid PatientId, Guid ClinicId, DateTime Timestamp);
}