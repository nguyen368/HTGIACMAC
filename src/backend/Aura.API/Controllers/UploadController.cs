using Aura.Domain.Entities;
using Aura.Infrastructure.Persistence;
using CloudinaryDotNet;
using CloudinaryDotNet.Actions;
using Microsoft.AspNetCore.Mvc;
using Newtonsoft.Json;
using System.Text;

namespace Aura.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class UploadController : ControllerBase
    {
        private readonly AuraDbContext _context;
        private readonly Cloudinary _cloudinary;
        private readonly HttpClient _httpClient;

        public UploadController(AuraDbContext context, IConfiguration config, IHttpClientFactory httpClientFactory)
        {
            _context = context;
            _httpClient = httpClientFactory.CreateClient();
            
            var cloudName = config["CloudinarySettings:CloudName"];
            var apiKey = config["CloudinarySettings:ApiKey"];
            var apiSecret = config["CloudinarySettings:ApiSecret"];
            _cloudinary = new Cloudinary(new Account(cloudName, apiKey, apiSecret));
        }

        [HttpPost]
        public async Task<IActionResult> UploadImage(IFormFile file)
        {
            if (file == null || file.Length == 0) return BadRequest("Không có file");

            // 1. Upload lên Cloudinary
            var uploadParams = new ImageUploadParams
            {
                File = new FileDescription(file.FileName, file.OpenReadStream()),
                Folder = "aura_retina"
            };
            var uploadResult = await _cloudinary.UploadAsync(uploadParams);

            if (uploadResult.Error != null) return BadRequest(uploadResult.Error.Message);

            var imageUrl = uploadResult.SecureUrl.ToString();

            // 2. Gọi AI Service (Dùng tên container 'aura-ai')
            var aiRequest = new { image_url = imageUrl };
            var content = new StringContent(JsonConvert.SerializeObject(aiRequest), Encoding.UTF8, "application/json");
            
            // --- QUAN TRỌNG: URL NÀY ĐÃ ĐƯỢC SỬA CHO DOCKER ---
            var response = await _httpClient.PostAsync("http://aura-ai:5001/predict", content);
            
            if (!response.IsSuccessStatusCode) return StatusCode(500, "Lỗi từ AI Service");

            var aiResponseString = await response.Content.ReadAsStringAsync();
            dynamic aiData = JsonConvert.DeserializeObject(aiResponseString);

            // 3. Lưu kết quả (Code demo ngắn gọn)
            var report = new MedicalReport
            {
                FinalRiskLevel = aiData.prediction ?? "Unknown",
                DoctorNotes = "Tự động chẩn đoán",
                CreatedAt = DateTime.UtcNow
            };
            _context.MedicalReports.Add(report);
            await _context.SaveChangesAsync();

            return Ok(new { url = imageUrl, prediction = report.FinalRiskLevel });
        }
        // ... (Giữ nguyên code cũ)

        // API Upload thường (Không gọi AI)
        // POST: api/Upload/basic
        [HttpPost("basic")]
        public async Task<IActionResult> UploadImageBasic(IFormFile file)
        {
            if (file == null || file.Length == 0) return BadRequest("Không có file");

            // 1. Upload lên Cloudinary (Vẫn dùng chung cấu hình cũ)
            var uploadParams = new ImageUploadParams
            {
                File = new FileDescription(file.FileName, file.OpenReadStream()),
                Folder = "aura_storage_only" // Lưu vào folder khác để phân biệt
            };
            var uploadResult = await _cloudinary.UploadAsync(uploadParams);

            if (uploadResult.Error != null) return BadRequest(uploadResult.Error.Message);

            var imageUrl = uploadResult.SecureUrl.ToString();

            // 2. Lưu thông tin vào bảng Upload (Nếu bạn đã có bảng Upload trong DB)
            // Nếu chưa có bảng Upload, bạn có thể bỏ qua bước này hoặc tạo entity Upload
            /* var uploadRecord = new Upload 
            {
                Url = imageUrl,
                UploadedAt = DateTime.UtcNow,
                // UserId = ... (Lấy từ token hoặc gửi lên)
            };
            _context.Uploads.Add(uploadRecord);
            await _context.SaveChangesAsync();
            */

            // Trả về URL để hiển thị ngay
            return Ok(new { url = imageUrl, message = "Upload thành công (Chưa phân tích AI)" });
        }
    }   
}