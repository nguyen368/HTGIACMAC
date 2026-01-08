using Microsoft.AspNetCore.Http;

namespace AURA.Services.Imaging.Application.Interfaces;

public interface IImageUploader
{
    Task<(string Url, string PublicId)> UploadAsync(IFormFile file);
}