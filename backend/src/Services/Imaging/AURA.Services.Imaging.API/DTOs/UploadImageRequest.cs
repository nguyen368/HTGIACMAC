using Microsoft.AspNetCore.Http;

namespace AURA.Services.Imaging.API.DTOs;

public class UploadImageRequest
{
    public Guid PatientId { get; set; }
    public IFormFile File { get; set; }
}