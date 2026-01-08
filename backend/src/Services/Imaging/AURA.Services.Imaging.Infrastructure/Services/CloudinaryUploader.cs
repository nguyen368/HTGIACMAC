using AURA.Services.Imaging.Application.Interfaces;
using CloudinaryDotNet;
using CloudinaryDotNet.Actions;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Configuration;

namespace AURA.Services.Imaging.Infrastructure.Services;

public class CloudinaryUploader : IImageUploader
{
    private readonly Cloudinary _cloudinary;

    public CloudinaryUploader(IConfiguration config)
    {
        var account = new Account(
            config["Cloudinary:CloudName"],
            config["Cloudinary:ApiKey"],
            config["Cloudinary:ApiSecret"]
        );
        _cloudinary = new Cloudinary(account);
    }

    public async Task<(string Url, string PublicId)> UploadAsync(IFormFile file)
    {
        if (file.Length == 0) return (null, null);

        using var stream = file.OpenReadStream();
        var uploadParams = new ImageUploadParams
        {
            File = new FileDescription(file.FileName, stream),
            Folder = "aura_patients"
        };

        var uploadResult = await _cloudinary.UploadAsync(uploadParams);
        return (uploadResult.SecureUrl.ToString(), uploadResult.PublicId);
    }
}