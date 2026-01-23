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
    }

    private async Task<AiDiagnosisResponse?> CallAiDiagnosis(string fileName, string imageUrl) {
        try {
            var client = _httpClientFactory.CreateClient();
            string aiUrl = "http://ai-core-service:8000/api/ai/auto-diagnosis"; 
            var response = await client.PostAsJsonAsync(aiUrl, new { file_name = fileName, image_url = imageUrl });
            return response.IsSuccessStatusCode ? await response.Content.ReadFromJsonAsync<AiDiagnosisResponse>() : null;
        } catch { return null; }
    }

    [HttpPost("upload")]
    public async Task<IActionResult> Upload([FromForm] UploadImageRequest request)
    {
        if (request.File == null || request.File.Length == 0) return BadRequest("File rỗng");
        try {
            var result = await _uploader.UploadAsync(request.File);
            var image = new ImageMetadata(request.PatientId, request.ClinicId, result.Url, result.PublicId);
            _context.Images.Add(image);
            await _context.SaveChangesAsync();

            var aiResult = await CallAiDiagnosis(request.File.FileName, result.Url);
            await _publishEndpoint.Publish(new ImageUploadedEvent(image.Id, result.Url, request.PatientId, request.ClinicId));

            // Khai báo biến này để dùng trong lệnh return
            string finalStatus = (aiResult != null && aiResult.Status == "Rejected") ? "Rejected" : "Success";

            return Ok(new { 
                Message = (finalStatus == "Rejected") ? "Ảnh bị từ chối" : "Upload thành công", 
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
                    using var entryStream = entry.Open();
                    using var memoryStream = new MemoryStream();
                    await entryStream.CopyToAsync(memoryStream);
                    memoryStream.Position = 0;
                    var uploadRes = await _uploader.UploadStreamAsync(memoryStream, entry.Name);
                    if (!string.IsNullOrEmpty(uploadRes.Url)) {
                        var image = new ImageMetadata(patientId, clinicId, uploadRes.Url, uploadRes.PublicId);
                        _context.Images.Add(image);
                        await _context.SaveChangesAsync();
                        await _publishEndpoint.Publish(new ImageUploadedEvent(image.Id, uploadRes.Url, patientId, clinicId));
                        successCount++;
                    }
                } catch { }
            }
        }
        return Ok(new { Message = $"Hoàn tất: {successCount} ảnh đã được xử lý" });
    }

    [HttpGet("stats/{clinicId}")]
    public async Task<IActionResult> GetClinicStats(Guid clinicId) {
        var total = await _context.Images.CountAsync(i => i.ClinicId == clinicId);
        var recent = await _context.Images.Where(i => i.ClinicId == clinicId).OrderByDescending(i => i.UploadedAt).Take(5)
            .Select(i => new { i.ImageUrl, UploadedAt = i.UploadedAt.ToString("dd/MM/yyyy HH:mm") }).ToListAsync();
        return Ok(new { Summary = new { TotalScans = total }, RecentActivity = recent });
    }

    [HttpDelete("{imageId}")]
    public async Task<IActionResult> DeleteImage(Guid imageId)
    {
        var image = await _context.Images.FindAsync(imageId);
        if (image == null) return NotFound();
        _context.Images.Remove(image);
        await _context.SaveChangesAsync();
        return Ok(new { Message = "Đã xóa ảnh thành công." });
    }
}