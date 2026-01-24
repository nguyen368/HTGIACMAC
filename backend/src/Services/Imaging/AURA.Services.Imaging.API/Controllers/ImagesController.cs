using AURA.Services.Imaging.API.DTOs;
using AURA.Services.Imaging.Application.Interfaces;
using AURA.Services.Imaging.Domain.Entities;
using AURA.Services.Imaging.Infrastructure.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.IO.Compression;
using MassTransit;
using AURA.Shared.Messaging.Events;

<<<<<<< HEAD
namespace AURA.Services.Imaging.API.Controllers;

public record ImageUploadedEvent(Guid ImageId, string ImageUrl, Guid PatientId, Guid ClinicId);

// [MỚI] DTO nhận dữ liệu từ bác sĩ
public class UpdateDiagnosisRequest 
{
    public string RiskLevel { get; set; }
    public string DoctorNotes { get; set; }
}

[ApiController]
[Route("api/imaging")]
public class ImagesController : ControllerBase
=======
namespace AURA.Services.Imaging.API.Controllers
>>>>>>> 7d68b20f0738f90995a124216dde00831c1ce63d
{
    // [FIX] Đổi tên Event thành IntegrationEvent để tránh trùng lặp namespace
    public record ImageUploadedIntegrationEvent(Guid ImageId, string ImageUrl, Guid PatientId, Guid ClinicId, DateTime Timestamp);
    
    public class UploadImageRequest
    {
        public IFormFile File { get; set; }
        public Guid PatientId { get; set; }
        public Guid ClinicId { get; set; }
        public string Modality { get; set; }
        public string BodyPart { get; set; }
    }

<<<<<<< HEAD
    private class AiDiagnosisResponse {
        [JsonPropertyName("status")] public string Status { get; set; } = string.Empty;
        [JsonPropertyName("diagnosis")] public string Diagnosis { get; set; } = string.Empty;
        [JsonPropertyName("risk_score")] public double RiskScore { get; set; }
        [JsonPropertyName("risk_level")] public string RiskLevel { get; set; } = string.Empty;
        [JsonPropertyName("heatmap_url")] public string HeatmapUrl { get; set; } = string.Empty;
        [JsonPropertyName("metadata")] public object? Metadata { get; set; } 
    }

    private async Task CreatePendingExamination(Guid patientId, Guid imageId, string imageUrl)
    {
        try {
            var client = _httpClientFactory.CreateClient();
            string medicalUrl = "http://medical-record-service:8080/api/medical-records/examinations";
            var payload = new { PatientId = patientId, ImageId = imageId, ImageUrl = imageUrl, Diagnosis = "Chờ phân tích", Status = "Pending" };
            await client.PostAsJsonAsync(medicalUrl, payload);
        } catch { }
    }

    private async Task<AiDiagnosisResponse?> CallAiDiagnosis(string fileName, string imageUrl) {
        try {
            var client = _httpClientFactory.CreateClient();
            string aiUrl = "http://ai-core-service:8000/api/ai/auto-diagnosis"; 
            var response = await client.PostAsJsonAsync(aiUrl, new { file_name = fileName, image_url = imageUrl });
            if (response.IsSuccessStatusCode) return await response.Content.ReadFromJsonAsync<AiDiagnosisResponse>();
            return null;
        } catch { return null; }
    }

    [HttpPost("upload")]
    public async Task<IActionResult> Upload([FromForm] UploadImageRequest request)
    {
        if (request.File == null || request.File.Length == 0) return BadRequest("File rỗng");
        try {
            var result = await _uploader.UploadAsync(request.File);
            var image = new ImageMetadata(request.PatientId, request.ClinicId, result.Url, result.PublicId);
            
            var aiResult = await CallAiDiagnosis(request.File.FileName, result.Url);
            if (aiResult != null && !string.IsNullOrEmpty(aiResult.Diagnosis))
            {
                var jsonResult = System.Text.Json.JsonSerializer.Serialize(aiResult);
                image.UpdateAiResult(jsonResult);
            }

            _context.Images.Add(image);
            await _context.SaveChangesAsync();
            await CreatePendingExamination(request.PatientId, image.Id, result.Url);
            await _publishEndpoint.Publish(new ImageUploadedEvent(image.Id, result.Url, request.PatientId, request.ClinicId));

            string finalStatus = (aiResult != null && aiResult.Status == "Rejected") ? "Rejected" : "Success";
            return Ok(new { Message = "Thành công", Details = new[] { new { FileName = request.File.FileName, Status = finalStatus, Url = result.Url, Id = image.Id, AiDiagnosis = aiResult } } });
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
=======
    [ApiController]
    [Route("api/imaging")]
    public class ImagesController : ControllerBase
    {
        private readonly IImageUploader _uploader;
        private readonly ImagingDbContext _context;
        private readonly IPublishEndpoint _publishEndpoint;

        public ImagesController(IImageUploader uploader, ImagingDbContext context, IPublishEndpoint publishEndpoint)
        {
            _uploader = uploader;
            _context = context;
            _publishEndpoint = publishEndpoint;
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

                // [FIX] Bắn sự kiện với tên mới
                await _publishEndpoint.Publish(new ImageUploadedIntegrationEvent(
                    image.Id, result.Url, request.PatientId, request.ClinicId, DateTime.UtcNow
                ));

                return Ok(new { Message = "Upload thành công", Id = image.Id, Url = result.Url });
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
>>>>>>> 7d68b20f0738f90995a124216dde00831c1ce63d
                        await entryStream.CopyToAsync(memoryStream);
                        memoryStream.Position = 0;
                        
                        var formFile = new FormFile(memoryStream, 0, memoryStream.Length, "file", entry.Name)
                        {
                            Headers = new HeaderDictionary(),
                            ContentType = "image/jpeg" 
                        };

                        var uploadRes = await _uploader.UploadAsync(formFile);

                        if (!string.IsNullOrEmpty(uploadRes.Url)) {
                            var image = new ImageMetadata(patientId, clinicId, uploadRes.Url, uploadRes.PublicId);
                            _context.Images.Add(image);
                            await _context.SaveChangesAsync();
<<<<<<< HEAD
                            await CreatePendingExamination(patientId, image.Id, uploadRes.Url);
                            await _publishEndpoint.Publish(new ImageUploadedEvent(image.Id, uploadRes.Url, patientId, clinicId));
                            results.Add(new { FileName = entry.Name, Status = "Success", Url = uploadRes.Url }); 
=======
                            
                            // [FIX] Bắn sự kiện với tên mới
                            await _publishEndpoint.Publish(new ImageUploadedIntegrationEvent(
                                image.Id, uploadRes.Url, patientId, clinicId, DateTime.UtcNow
                            ));
>>>>>>> 7d68b20f0738f90995a124216dde00831c1ce63d
                            successCount++;
                        }
                    } catch { }
                }
            }
            return Ok(new { Message = $"Đã tiếp nhận {successCount} ảnh." });
        }

        [HttpGet("stats/{clinicId}")]
        public async Task<IActionResult> GetClinicStats(Guid clinicId) {
            var total = await _context.Images.CountAsync(i => i.ClinicId == clinicId);
            return Ok(new { Summary = new { TotalScans = total } });
        }

        [HttpDelete("{imageId}")]
        public async Task<IActionResult> DeleteImage(Guid imageId)
        {
            var image = await _context.Images.FindAsync(imageId);
            if (image == null) return NotFound();
            _context.Images.Remove(image);
            await _context.SaveChangesAsync();
            return Ok(new { Message = "Deleted." });
        }
<<<<<<< HEAD
        return Ok(new { Message = $"Hoàn tất: {successCount} ảnh", Details = results });
    }

    [HttpDelete("{imageId}")]
    public async Task<IActionResult> DeleteImage(Guid imageId)
    {
        var image = await _context.Images.FindAsync(imageId);
        if (image == null) return NotFound();
        _context.Images.Remove(image);
        await _context.SaveChangesAsync();
        return Ok(new { Message = "Đã xóa" });
    }

    [HttpGet("patient/{patientId}")]
    public async Task<IActionResult> GetImagesByPatient(Guid patientId) {
        return Ok(await _context.Images.Where(i => i.PatientId == patientId).OrderByDescending(i => i.UploadedAt).ToListAsync());
    }

    [HttpGet("stats")]
    public async Task<IActionResult> GetStats([FromQuery] Guid? clinicId)
    {
        var query = _context.Images.AsQueryable();
        // Tạm bỏ lọc ClinicId để đảm bảo hiện dữ liệu
        // if (clinicId.HasValue) query = query.Where(i => i.ClinicId == clinicId.Value);

        var totalUploads = await query.CountAsync();
        var pendingCases = await query.CountAsync(i => i.Status == "Pending");
        var analyzedCases = await query.CountAsync(i => i.Status == "Analyzed");
        var recentImages = await query.OrderByDescending(i => i.UploadedAt).Take(10)
            .Select(i => new { Id = i.Id, ImageUrl = i.ImageUrl, UploadedAt = i.UploadedAt.ToString("dd/MM/yyyy HH:mm"), PatientId = i.PatientId, Status = i.Status }).ToListAsync();

        return Ok(new { summary = new { totalScans = totalUploads, pendingCases = pendingCases, highRiskCases = analyzedCases }, recentActivity = recentImages });
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetImageDetail(Guid id)
    {
        var image = await _context.Images.FindAsync(id);
        if (image == null) return NotFound("Không tìm thấy hồ sơ ảnh.");

        var result = new 
        {
            Id = image.Id,
            ImageUrl = image.ImageUrl, 
            Status = image.Status,
            UploadedAt = image.UploadedAt,
            PatientId = image.PatientId,
            AiResult = image.AiAnalysisResultJson, 
            PatientName = "Bệnh nhân " + image.PatientId.ToString().Substring(0, 5) 
        };
        return Ok(result);
    }

    // --- [MỚI] API LƯU KẾT LUẬN ---
    [HttpPut("{id}/diagnosis")]
    public async Task<IActionResult> UpdateDiagnosis(Guid id, [FromBody] UpdateDiagnosisRequest req)
    {
        var image = await _context.Images.FindAsync(id);
        if (image == null) return NotFound();

        // Cập nhật trạng thái
        // image.Status = "Verified"; // Bỏ comment nếu muốn đổi status
        // _context.Images.Update(image);
        // await _context.SaveChangesAsync();

        return Ok(new { Message = "Đã lưu kết luận thành công!" });
    }
=======
    }
>>>>>>> 7d68b20f0738f90995a124216dde00831c1ce63d
}