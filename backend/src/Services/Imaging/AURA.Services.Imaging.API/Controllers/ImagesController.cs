using AURA.Services.Imaging.API.DTOs;
using AURA.Services.Imaging.Application.Interfaces;
using AURA.Services.Imaging.Domain.Entities;
using AURA.Services.Imaging.Infrastructure.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.IO.Compression;
using MassTransit;

namespace AURA.Services.Imaging.API.Controllers
{
    // Sự kiện tích hợp để báo cho các Service khác qua RabbitMQ
    public record ImageUploadedIntegrationEvent(Guid ImageId, string ImageUrl, Guid PatientId, Guid ClinicId, DateTime Timestamp);

    // Request nhận kết quả từ AI Service
    public class UpdateDiagnosisRequest { 
        public string RiskLevel { get; set; } = string.Empty; 
        public string DoctorNotes { get; set; } = string.Empty; 
        public string PredictionResult { get; set; } = string.Empty;
        public double ConfidenceScore { get; set; }
        public string HeatmapUrl { get; set; } = string.Empty;
    }

    [ApiController]
    [Route("api/imaging")]
    public class ImagesController : ControllerBase
    {
        private readonly IImageUploader _uploader;
        private readonly ImagingDbContext _context;
        private readonly IPublishEndpoint _publishEndpoint;
        private readonly IHttpClientFactory _httpClientFactory;

        public ImagesController(IImageUploader uploader, ImagingDbContext context, IPublishEndpoint publishEndpoint, IHttpClientFactory httpClientFactory)
        {
            _uploader = uploader;
            _context = context;
            _publishEndpoint = publishEndpoint;
            _httpClientFactory = httpClientFactory;
        }

        // --- 1. THỐNG KÊ (Giữ nguyên logic của bạn) ---
        [HttpGet("stats")]
        public async Task<IActionResult> GetStats([FromQuery] Guid clinicId)
        {
            var query = _context.Images.Where(i => i.ClinicId == clinicId);
            return Ok(new { 
                TotalImages = await query.CountAsync(), 
                TodayUploads = await query.CountAsync(i => i.CreatedAt >= DateTime.UtcNow.Date) 
            });
        }

        // --- 2. KHO DỮ LIỆU (MỚI): Lấy danh sách ảnh cho trang Gallery của Phòng khám ---
        [HttpGet("clinic/{clinicId}")]
        public async Task<IActionResult> GetImagesByClinic(Guid clinicId)
        {
            var images = await _context.Images
                .Where(i => i.ClinicId == clinicId)
                .OrderByDescending(i => i.CreatedAt)
                .Select(i => new {
                    id = i.Id,
                    url = i.OriginalImageUrl, // Đảm bảo trả về URL ảnh từ Cloudinary
                    patientId = i.PatientId,
                    createdAt = i.CreatedAt,
                    status = i.Status.ToString()
                })
                .ToListAsync();
            return Ok(images);
        }

        // --- 3. LẤY ẢNH THEO BỆNH NHÂN (Giữ nguyên logic của bạn) ---
        [HttpGet("patient/{patientId}")]
        public async Task<IActionResult> GetImagesByPatient(Guid patientId)
        {
            var images = await _context.Images
                .Where(i => i.PatientId == patientId)
                .OrderByDescending(i => i.CreatedAt)
                .ToListAsync();
            return Ok(images);
        }

        // --- 4. UPLOAD ĐƠN LẺ (Tích hợp đồng bộ ImageUrl) ---
        [HttpPost("upload")]
        public async Task<IActionResult> Upload([FromForm] UploadImageRequest request)
        {
            if (request.File == null || request.File.Length == 0) 
                return BadRequest("File không hợp lệ.");

            var uploadRes = await _uploader.UploadAsync(request.File);
            var image = new ImageMetadata(request.PatientId, request.ClinicId, uploadRes.Url, uploadRes.PublicId);
            
            _context.Images.Add(image);
            await _context.SaveChangesAsync();

            // Tích hợp: Truyền URL ảnh sang Medical Record để dứt điểm lỗi màn hình đen
            await CreatePendingExamination(request.PatientId, image.Id, request.ClinicId, uploadRes.Url);
            
            // Publish qua RabbitMQ để AI Service bắt đầu làm việc
            await _publishEndpoint.Publish(new ImageUploadedIntegrationEvent(
                image.Id, uploadRes.Url, request.PatientId, request.ClinicId, DateTime.UtcNow));
            
            return Ok(new { Id = image.Id, Url = uploadRes.Url });
        }

        // --- 5. BATCH UPLOAD ZIP (Giữ nguyên logic successCount và loop của bạn) ---
        [HttpPost("batch-upload")]
        public async Task<IActionResult> BatchUpload(IFormFile zipFile, [FromForm] Guid clinicId, [FromForm] Guid patientId)
        {
            if (zipFile == null || zipFile.Length == 0) return BadRequest("Zip rỗng");
            
            int successCount = 0;
            using var stream = zipFile.OpenReadStream();
            using var archive = new ZipArchive(stream, ZipArchiveMode.Read);
            
            foreach (var entry in archive.Entries)
            {
                if (string.IsNullOrEmpty(entry.Name) || entry.FullName.StartsWith("__") || entry.Name.StartsWith(".")) 
                    continue;
                
                var ext = Path.GetExtension(entry.Name).ToLower();
                if (ext != ".jpg" && ext != ".png" && ext != ".jpeg") 
                    continue;

                try {
                    using var ms = new MemoryStream();
                    using (var entryStream = entry.Open()) { await entryStream.CopyToAsync(ms); }
                    ms.Position = 0;

                    var formFile = new FormFile(ms, 0, ms.Length, "file", entry.Name) { 
                        Headers = new HeaderDictionary(), 
                        ContentType = "image/jpeg" 
                    };

                    var uploadRes = await _uploader.UploadAsync(formFile);
                    var image = new ImageMetadata(patientId, clinicId, uploadRes.Url, uploadRes.PublicId);
                    
                    _context.Images.Add(image);
                    await _context.SaveChangesAsync();
                    
                    // Tạo ca khám tương ứng bên Medical Record cho từng file trong ZIP
                    await CreatePendingExamination(patientId, image.Id, clinicId, uploadRes.Url);
                    
                    await _publishEndpoint.Publish(new ImageUploadedIntegrationEvent(
                        image.Id, uploadRes.Url, patientId, clinicId, DateTime.UtcNow));
                    
                    successCount++;
                } 
                catch { continue; }
            }
            return Ok(new { Message = $"Thành công {successCount} ảnh." });
        }

        // --- 6. CẬP NHẬT CHẨN ĐOÁN (Nhận kết quả từ AI Service) ---
        [HttpPut("{id}/diagnosis")]
        public async Task<IActionResult> UpdateDiagnosis(Guid id, [FromBody] UpdateDiagnosisRequest request)
        {
            var image = await _context.Images.FindAsync(id);
            if (image == null) return NotFound();

            image.PredictionResult = request.PredictionResult;
            image.ConfidenceScore = request.ConfidenceScore;
            image.RiskLevel = request.RiskLevel;
            image.HeatmapUrl = request.HeatmapUrl;
            image.Status = ImageStatus.Analyzed;

            await _context.SaveChangesAsync();

            // Đồng bộ kết quả AI sang Medical Record để hiển thị Dashboard thời gian thực
            try {
                var client = _httpClientFactory.CreateClient();
                await client.PutAsJsonAsync($"http://medical-record-service:8080/api/medical-records/examinations/ai-update/{id}", request);
            } catch (Exception ex) {
                Console.WriteLine($"[Sync Result Error] {ex.Message}");
            }

            return Ok();
        }

        // --- 7. XÓA ẢNH (Bổ sung để quản lý kho dữ liệu) ---
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteImage(Guid id)
        {
            var image = await _context.Images.FindAsync(id);
            if (image == null) return NotFound();

            _context.Images.Remove(image);
            await _context.SaveChangesAsync();
            return Ok(new { Message = "Xóa ảnh thành công." });
        }

        // --- HÀM HỖ TRỢ ĐỒNG BỘ DỮ LIỆU SANG MEDICAL SERVICE ---
        private async Task CreatePendingExamination(Guid patientId, Guid imageId, Guid clinicId, string imageUrl)
        {
            try {
                var client = _httpClientFactory.CreateClient();
                string medicalUrl = "http://medical-record-service:8080/api/medical-records/examinations";
                
                var payload = new { 
                    PatientId = patientId, 
                    ImageId = imageId, 
                    ClinicId = clinicId,
                    ImageUrl = imageUrl, 
                    Diagnosis = "Chờ AI phân tích",
                    DoctorNotes = "Hệ thống khởi tạo tự động",
                    DoctorId = Guid.Empty
                };

                await client.PostAsJsonAsync(medicalUrl, payload);
            } 
            catch (Exception ex) {
                Console.WriteLine($"[Sync Error] {ex.Message}");
            }
        }
    }
}