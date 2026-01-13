using AURA.Services.Imaging.Application.Interfaces;
using CloudinaryDotNet;
using CloudinaryDotNet.Actions;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Configuration;
using System.IO; // [Mới] Cần thêm thư viện này để dùng Stream
using System.Threading.Tasks;

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

    // --- Hàm 1: Upload file lẻ thông thường (giữ nguyên chữ ký hàm để không lỗi code cũ) ---
    public async Task<(string Url, string PublicId)> UploadAsync(IFormFile file)
    {
        if (file == null || file.Length == 0) return (null, null);

        // Chuyển IFormFile sang Stream và gọi hàm xử lý chung ở dưới
        using var stream = file.OpenReadStream();
        return await UploadStreamAsync(stream, file.FileName);
    }

    // --- Hàm 2: [MỚI] Upload từ Stream (Dùng cho file Zip Batch Upload) ---
    public async Task<(string Url, string PublicId)> UploadStreamAsync(Stream stream, string fileName)
    {
        // Reset vị trí stream về đầu (đề phòng trường hợp stream đã bị đọc trước đó)
        if (stream.CanSeek)
        {
            stream.Position = 0;
        }

        var uploadParams = new ImageUploadParams
        {
            File = new FileDescription(fileName, stream),
            Folder = "aura_patients" // Tất cả ảnh sẽ vào folder này trên Cloudinary
        };

        var uploadResult = await _cloudinary.UploadAsync(uploadParams);

        // Kiểm tra nếu Cloudinary trả về lỗi
        if (uploadResult.Error != null)
        {
            return (null, null);
        }

        return (uploadResult.SecureUrl.ToString(), uploadResult.PublicId);
    }
}