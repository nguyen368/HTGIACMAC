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

    private async Task<AiDiagnosisResponse?> CallAiDiagnosis(string fileName, string imageUrl) {
        try {
            var client = _httpClientFactory.CreateClient();
            // Gọi qua tên service trong mạng Docker
            string aiUrl = "http://ai-core-service:8000/api/ai/auto-diagnosis"; 
            // Thiết lập timeout dài hơn (60s) vì AI quét ảnh tốn thời gian
            client.Timeout = TimeSpan.FromSeconds(60);
            var response = await client.PostAsJsonAsync(aiUrl, new { file_name = fileName, image_url = imageUrl });
            return response.IsSuccessStatusCode ? await response.Content.ReadFromJsonAsync<AiDiagnosisResponse>() : null;
        } catch (Exception ex) {
            Console.WriteLine($"--> [Imaging] Lỗi gọi AI: {ex.Message}");
            return null;
        }        
    }

    [HttpPost("upload")]
    public async Task<IActionResult> Upload([FromForm] UploadImageRequest request)
    {
        if (request.File == null || request.File.Length == 0) return BadRequest("File rỗng");
        try {
            // 1. Upload ảnh lên Cloud (Cloudinary)
            var result = await _uploader.UploadAsync(request.File);
            
            // 2. Gọi AI để kiểm định ngay lập tức
            var aiResult = await CallAiDiagnosis(request.File.FileName, result.Url);

            // 3. XỬ LÝ NẾU AI TỪ CHỐI (Ảnh mặt người, phong cảnh...)
            if (aiResult != null && aiResult.Status == "Rejected") {
                return BadRequest(new { 
                    Status = "Rejected",
                    Message = aiResult.Diagnosis, // Thông báo từ AI cực kỳ khó tính
                    Url = result.Url 
                });
            }

            // 4. CHỈ LƯU VÀO DB NẾU LÀ VÕNG MẠC THẬT
            var image = new ImageMetadata(request.PatientId, request.ClinicId, result.Url, result.PublicId);
            _context.Images.Add(image);
            await _context.SaveChangesAsync();

            await _publishEndpoint.Publish(new ImageUploadedEvent(image.Id, result.Url, request.PatientId, request.ClinicId));

            return Ok(new { 
                Message = "Sàng lọc hoàn tất thành công", 
                Details = new[] { new { 
                    FileName = request.File.FileName, Status = "Success", Url = result.Url, Id = image.Id, AiDiagnosis = aiResult 
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
                            var aiCheck = await CallAiDiagnosis(entry.Name, uploadRes.Url);
                            if (aiCheck != null && aiCheck.Status == "Success") {
                                var image = new ImageMetadata(patientId, clinicId, uploadRes.Url, uploadRes.PublicId);
                                _context.Images.Add(image);
                                await _context.SaveChangesAsync(); 
                                await _publishEndpoint.Publish(new ImageUploadedEvent(image.Id, uploadRes.Url, patientId, clinicId));
                                results.Add(new { FileName = entry.Name, Status = "Success", Url = uploadRes.Url }); 
                                successCount++;
                            } else {
                                results.Add(new { FileName = entry.Name, Status = "Rejected", Message = "Ảnh không đạt chuẩn võng mạc" });
                            }
                        }
                    }
                } catch { }
            }
        }
        return Ok(new { Message = $"Hoàn tất xử lý lô: {successCount} ảnh hợp lệ", Details = results });
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
}