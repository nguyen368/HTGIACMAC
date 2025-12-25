using Microsoft.AspNetCore.Mvc;
using CloudinaryDotNet;
using CloudinaryDotNet.Actions;
using Aura.Infrastructure.Persistence;
using Aura.Domain.Entities;

namespace Aura.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class UploadController : ControllerBase
    {
        private readonly Cloudinary _cloudinary;
        private readonly AuraDbContext _context;

        public UploadController(Cloudinary cloudinary, AuraDbContext context)
        {
            _cloudinary = cloudinary;
            _context = context;
        }

        [HttpPost]
        public async Task<IActionResult> UploadImage(IFormFile file, [FromQuery] Guid userId)
        {
            // 1. Kiểm tra file có tồn tại không
            if (file == null || file.Length == 0)
                return BadRequest("Vui lòng chọn file ảnh!");

            // 2. Upload lên Cloudinary
            var uploadResult = new ImageUploadResult();
            if (file.Length > 0)
            {
                using var stream = file.OpenReadStream();
                var uploadParams = new ImageUploadParams
                {
                    File = new FileDescription(file.FileName, stream),
                    Folder = "aura_retinal_scans" // Tên thư mục trên Cloud
                };
                uploadResult = await _cloudinary.UploadAsync(uploadParams);
            }

            if (uploadResult.Error != null)
                return BadRequest(uploadResult.Error.Message);

            // 3. Lưu thông tin vào Database
            var uploadRecord = new Upload
            {
                UserId = userId,
                ImageUrl = uploadResult.SecureUrl.ToString(), // Link ảnh trên mạng
                Status = "Pending", // Đang chờ AI xử lý
                CreatedAt = DateTime.UtcNow
            };

            _context.Uploads.Add(uploadRecord);
            await _context.SaveChangesAsync();

            return Ok(new 
            { 
                message = "Upload thành công!", 
                uploadId = uploadRecord.Id, 
                imageUrl = uploadRecord.ImageUrl 
            });
        }
    }
}