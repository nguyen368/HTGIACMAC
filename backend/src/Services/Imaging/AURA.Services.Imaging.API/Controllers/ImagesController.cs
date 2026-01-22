using AURA.Services.Imaging.API.DTOs;
using AURA.Services.Imaging.Application.Interfaces;
using AURA.Services.Imaging.Domain.Entities;
using AURA.Services.Imaging.Infrastructure.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.IO.Compression;
using System.Text.Json.Serialization;
using System.Net.Http.Json; 
using MassTransit;

namespace AURA.Services.Imaging.API.Controllers;

// Định nghĩa cấu trúc tin nhắn RabbitMQ
public record ImageUploadedEvent(Guid ImageId, string ImageUrl, Guid PatientId, Guid ClinicId);

[ApiController]
[Route("api/imaging")]
public class ImagesController : ControllerBase
{
    private readonly IImageUploader _uploader;
    private readonly ImagingDbContext _context;
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly IPublishEndpoint _publishEndpoint;

    public ImagesController(IImageUploader uploader, ImagingDbContext context, IHttpClientFactory httpClientFactory, IPublishEndpoint publishEndpoint)
    {
        _uploader = uploader;
        _context = context;
        _httpClientFactory = httpClientFactory;
        _publishEndpoint = publishEndpoint;
    }

    private class AiDiagnosisResponse {
        [JsonPropertyName("status")] public string Status { get; set; } = string.Empty;
        [JsonPropertyName("diagnosis")] public string Diagnosis { get; set; } = string.Empty;
        [JsonPropertyName("risk_score")] public double RiskScore { get; set; }
        [JsonPropertyName("risk_level")] public string RiskLevel { get; set; } = string.Empty;
        [JsonPropertyName("heatmap_url")] public string HeatmapUrl { get; set; } = string.Empty;
        [JsonPropertyName("metadata")] public object? Metadata { get; set; } 
    }

    // --- HÀM GỌI AI ĐÃ SỬA ---
    private async Task<AiDiagnosisResponse?> CallAiDiagnosis(string fileName, string imageUrl) {
        try {
            var client = _httpClientFactory.CreateClient();
            
            // [QUAN TRỌNG] Sửa localhost:5006 -> ai-core-service:8000
            // Trong Docker, các service gọi nhau bằng TÊN CONTAINER và PORT NỘI BỘ (8000)
            string aiUrl = "http://ai-core-service:8000/api/ai/auto-diagnosis"; 
            
            Console.WriteLine($"[INFO] Calling AI Core at: {aiUrl}"); // Log ra để dễ debug

            var response = await client.PostAsJsonAsync(aiUrl, new { file_name = fileName, image_url = imageUrl });
            
            if (response.IsSuccessStatusCode)
            {
                return await response.Content.ReadFromJsonAsync<AiDiagnosisResponse>();
            }
            else
            {
                Console.WriteLine($"[ERROR] AI Core returned: {response.StatusCode}");
                return null;
            }
        } catch (Exception ex) { 
            Console.WriteLine($"[EXCEPTION] Connect AI Core failed: {ex.Message}");
            return null; 
        }
    }

    [HttpPost("upload")]
    public async Task<IActionResult> Upload([FromForm] UploadImageRequest request)
    {
        if (request.File == null || request.File.Length == 0) return BadRequest("File rỗng");
        try {
            // 1. Upload ảnh lên Cloud/Local
            var result = await _uploader.UploadAsync(request.File);
            
            // 2. Lưu Metadata vào DB
            var image = new ImageMetadata(request.PatientId, request.ClinicId, result.Url, result.PublicId);
            _context.Images.Add(image);
            await _context.SaveChangesAsync();

            // 3. Gọi AI Core phân tích (Code cũ)
            var aiResult = await CallAiDiagnosis(request.File.FileName, result.Url);
            
            // 4. Gửi Event sang RabbitMQ (để Notification Service báo về Frontend)
            await _publishEndpoint.Publish(new ImageUploadedEvent(image.Id, result.Url, request.PatientId, request.ClinicId));

            string finalStatus = (aiResult != null && aiResult.Status == "Rejected") ? "Rejected" : "Success";

            return Ok(new { 
                Message = finalStatus == "Rejected" ? "Ảnh bị từ chối" : "Upload thành công", 
                Details = new[] { new { 
                    FileName = request.File.FileName, 
                    Status = finalStatus, 
                    Url = result.Url, 
                    Id = image.Id, 
                    AiDiagnosis = aiResult 
                }}
            });
        } catch (Exception ex) { return StatusCode(500, ex.Message); }
    }

    [HttpPost("batch-upload")]
    public async Task<IActionResult> BatchUpload(IFormFile zipFile, [FromForm] Guid clinicId, [FromForm] Guid patientId)
    {
        if (zipFile == null || zipFile.Length == 0) return BadRequest("File rỗng");
        var results = new List<object>();
        int successCount = 0;

        using (var stream = zipFile.OpenReadStream())
        using (var archive = new ZipArchive(stream, ZipArchiveMode.Read))
        {
            foreach (var entry in archive.Entries)
            {
                if (string.IsNullOrEmpty(entry.Name) || entry.FullName.StartsWith("__")) continue;
                var ext = Path.GetExtension(entry.Name).ToLower();
                if (ext != ".jpg" && ext != ".png" && ext != ".jpeg") continue;

                try {
                    using (var entryStream = entry.Open())
                    using (var memoryStream = new MemoryStream()) {
                        await entryStream.CopyToAsync(memoryStream);
                        memoryStream.Position = 0;
                        var uploadRes = await _uploader.UploadStreamAsync(memoryStream, entry.Name);
                        if (!string.IsNullOrEmpty(uploadRes.Url)) {
                            var image = new ImageMetadata(patientId, clinicId, uploadRes.Url, uploadRes.PublicId);
                            _context.Images.Add(image);
                            await _context.SaveChangesAsync();
                            
                            // Bắn tin nhắn RabbitMQ
                            await _publishEndpoint.Publish(new ImageUploadedEvent(image.Id, uploadRes.Url, patientId, clinicId));

                            results.Add(new { FileName = entry.Name, Status = "Success", Url = uploadRes.Url }); 
                            successCount++;
                        }
                    }
                } catch { }
            }
        }
        return Ok(new { Message = $"Hoàn tất: {successCount} ảnh đã được xử lý", Details = results });
    }

    [HttpGet("stats/{clinicId}")]
    public async Task<IActionResult> GetClinicStats(Guid clinicId) {
        var total = await _context.Images.CountAsync(i => i.ClinicId == clinicId);
        var recent = await _context.Images.Where(i => i.ClinicId == clinicId).OrderByDescending(i => i.UploadedAt).Take(5)
            .Select(i => new { i.ImageUrl, UploadedAt = i.UploadedAt.ToString("dd/MM/yyyy HH:mm") }).ToListAsync();
        return Ok(new { Summary = new { TotalScans = total }, RecentActivity = recent });
    }

    [HttpGet("patient/{patientId}")]
    public async Task<IActionResult> GetImagesByPatient(Guid patientId) {
        var images = await _context.Images.Where(i => i.PatientId == patientId).OrderByDescending(i => i.UploadedAt)
            .Select(i => new { i.Id, i.ImageUrl, UploadedAt = i.UploadedAt.ToString("dd/MM/yyyy HH:mm"), FileName = "Ảnh đáy mắt" }).ToListAsync();
        return Ok(images);
    }
    // ... code cũ ...

    [HttpDelete("{imageId}")]
    public async Task<IActionResult> DeleteImage(Guid imageId)
    {
        var image = await _context.Images.FindAsync(imageId);
        if (image == null) return NotFound("Không tìm thấy ảnh.");

        // Xóa file trên Cloudinary/Local thông qua interface uploader (nếu cần)
        // await _uploader.DeleteAsync(image.PublicId); 

        _context.Images.Remove(image);
        await _context.SaveChangesAsync();

        return Ok(new { Message = "Đã xóa ảnh thành công." });
    }
    
}