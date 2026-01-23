using AURA.Services.Imaging.Application.Interfaces;
using AURA.Services.Imaging.Domain.Entities;
using AURA.Services.Imaging.Infrastructure.Data;
using MassTransit;
using Microsoft.AspNetCore.Mvc;

namespace AURA.Services.Imaging.API.Controllers
{
    // Định nghĩa Event để bắn sang Medical Record (Phải khớp với Consumer bên kia)
    public record ImageUploadedEvent(Guid ImageId, string ImageUrl, Guid PatientId, Guid ClinicId);

    [ApiController]
    [Route("api/hardware")]
    public class HardwareController : ControllerBase
    {
        private readonly IImageUploader _uploader;
        private readonly ImagingDbContext _context;
        private readonly IPublishEndpoint _publishEndpoint;

        public HardwareController(IImageUploader uploader, ImagingDbContext context, IPublishEndpoint publishEndpoint)
        {
            _uploader = uploader;
            _context = context;
            _publishEndpoint = publishEndpoint;
        }

        // [POST] api/hardware/capture
        // Máy chụp ảnh sẽ gọi vào đây sau khi chụp xong
        [HttpPost("capture")]
        public async Task<IActionResult> ReceiveFromCamera([FromForm] IFormFile imageFile, [FromForm] string deviceId, [FromForm] Guid patientId)
        {
            // 1. Kiểm tra thiết bị (Giả lập Security)
            if (string.IsNullOrEmpty(deviceId)) return Unauthorized(new { Error = "Thiết bị không xác định" });
            
            // Giả định: Device ID này thuộc về Phòng khám AURA Sài Gòn (Lấy từ DbInitializer)
            // Trong thực tế, bạn sẽ query DB để map DeviceId -> ClinicId
            // Tạm thời để Guid.Empty hoặc một Guid cố định nếu bạn muốn test
            var defaultClinicId = Guid.Empty; 

            if (imageFile == null || imageFile.Length == 0) return BadRequest("Không có dữ liệu ảnh");

            try 
            {
                // 2. Upload ảnh lên Cloud (Cloudinary)
                var result = await _uploader.UploadAsync(imageFile);
                
                // 3. Lưu Metadata vào DB
                var image = new ImageMetadata(patientId, defaultClinicId, result.Url, result.PublicId);
                
                // (Optional) Đánh dấu nguồn gốc là từ Hardware nếu Entity có field Source
                // image.Source = "FundusCamera"; 

                _context.Images.Add(image);
                await _context.SaveChangesAsync();

                // 4. Bắn sự kiện "ImageUploaded" -> Kích hoạt quy trình AI tự động bên Medical Service
                await _publishEndpoint.Publish(new ImageUploadedEvent(
                    image.Id, 
                    result.Url, 
                    patientId, 
                    defaultClinicId
                ));

                return Ok(new { 
                    Status = "Success", 
                    Message = "Đã nhận ảnh từ Camera và kích hoạt AI phân tích.",
                    ImageId = image.Id,
                    ImageUrl = result.Url
                });
            } 
            catch (Exception ex) 
            { 
                return StatusCode(500, $"Lỗi phần cứng: {ex.Message}"); 
            }
        }
    }
}