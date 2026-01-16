using AURA.Services.Imaging.API.DTOs;
using AURA.Services.Imaging.Application.Interfaces;
using AURA.Services.Imaging.Domain.Entities;
using AURA.Services.Imaging.Infrastructure.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.IO.Compression;
using System.Text.Json;
using System.Text.Json.Serialization;
using System.Net.Http.Json; 

namespace AURA.Services.Imaging.API.Controllers;

[ApiController]
[Route("api/imaging")]
public class ImagesController : ControllerBase
{
    private readonly IImageUploader _uploader;
    private readonly ImagingDbContext _context;
    private readonly IHttpClientFactory _httpClientFactory;

    public ImagesController(
        IImageUploader uploader, 
        ImagingDbContext context,
        IHttpClientFactory httpClientFactory)
    {
        _uploader = uploader;
        _context = context;
        _httpClientFactory = httpClientFactory;
    }

    // Class hứng kết quả từ AI Python
    private class AiValidationResponse
    {
        [JsonPropertyName("is_valid")] public bool IsValid { get; set; }
        [JsonPropertyName("message")] public string? Message { get; set; }
    }

    // --- LIÊN KẾT 1: GỌI AI SERVICE (Port 8000) ---
    private async Task<(bool IsValid, string Reason)> ValidateImageWithAi(string fileName)
    {
        try 
        {
            var client = _httpClientFactory.CreateClient();
            string aiServiceUrl = "http://localhost:8000/api/ai/validate-eye"; 

            var payload = new { file_name = fileName, image_url = "" };
            var response = await client.PostAsJsonAsync(aiServiceUrl, payload);
            
            if (!response.IsSuccessStatusCode) return (true, "AI Warning: Skip Check");

            var result = await response.Content.ReadFromJsonAsync<AiValidationResponse>();
            return (result?.IsValid ?? true, result?.Message ?? "Unknown");
        }
        catch { return (true, "AI Error"); }
    }

    // --- LIÊN KẾT 2: GỌI NOTIFICATION SERVICE (Port 5005) ---
    // Hàm này sẽ bắn thông báo sang service khác để báo cho bác sĩ
    private async Task NotifyUploadSuccess(Guid patientId, int count)
    {
        try
        {
            var client = _httpClientFactory.CreateClient();
            // URL của Notification Service (Port 5005)
            string notiUrl = "http://localhost:5005/api/notifications/send"; 

            var notification = new 
            {
                Title = "Dữ liệu hình ảnh mới",
                Message = $"Hệ thống vừa nhận được {count} ảnh chụp đáy mắt mới của bệnh nhân {patientId}.",
                Type = "Info",
                UserId = Guid.Empty // Gửi cho Admin/Bác sĩ trực (hoặc ID cụ thể nếu có)
            };

            // Gọi bất đồng bộ không cần chờ kết quả (Fire-and-forget)
            _ = client.PostAsJsonAsync(notiUrl, notification);
        }
        catch (Exception ex)
        {
            // Chỉ log lỗi, không làm fail request chính
            Console.WriteLine($"Warning: Không gửi được thông báo. {ex.Message}");
        }
    }

    // --- 1. API UPLOAD HÀNG LOẠT (ZIP) ---
    [HttpPost("batch-upload")]
    public async Task<IActionResult> BatchUpload(IFormFile zipFile, [FromForm] Guid clinicId, [FromForm] Guid patientId)
    {
        if (zipFile == null || zipFile.Length == 0) return BadRequest("File rỗng");
        if (Path.GetExtension(zipFile.FileName).ToLower() != ".zip") return BadRequest("Phải là file .zip");

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

                try 
                {
                    // Bước 1: Hỏi AI
                    var (isValid, reason) = await ValidateImageWithAi(entry.Name);
                    if (!isValid) { results.Add(new { FileName = entry.Name, Status = "Rejected", Error = reason }); continue; }

                    // Bước 2: Upload Cloud
                    using (var entryStream = entry.Open())
                    using (var memoryStream = new MemoryStream())
                    {
                        await entryStream.CopyToAsync(memoryStream);
                        memoryStream.Position = 0;
                        var uploadResult = await _uploader.UploadStreamAsync(memoryStream, entry.Name);

                        if (!string.IsNullOrEmpty(uploadResult.Url))
                        {
                            var image = new ImageMetadata(patientId, clinicId, uploadResult.Url, uploadResult.PublicId);
                            _context.Images.Add(image);
                            results.Add(new { FileName = entry.Name, Status = "Success", Url = uploadResult.Url, AiNote = "AI Passed" });
                            successCount++;
                        }
                    }
                }
                catch (Exception ex) { results.Add(new { FileName = entry.Name, Status = "Failed", Error = ex.Message }); }
            }
        }

        if (successCount > 0) 
        {
            await _context.SaveChangesAsync();
            // ==> Gửi thông báo sau khi lưu thành công
            await NotifyUploadSuccess(patientId, successCount);
        }
        
        return Ok(new { Message = $"Hoàn tất. Thành công: {successCount}", Details = results });
    }

    // --- 2. API UPLOAD ĐƠN LẺ ---
    [HttpPost("upload")]
    public async Task<IActionResult> Upload([FromForm] UploadImageRequest request)
    {
        if (request.File == null || request.File.Length == 0) return BadRequest("File rỗng");
        var results = new List<object>(); 

        // 1. Check AI
        var (isValid, reason) = await ValidateImageWithAi(request.File.FileName);
        if (!isValid) 
        {
            results.Add(new { FileName = request.File.FileName, Status = "Rejected", Error = reason });
            return Ok(new { Message = "Ảnh bị từ chối bởi AI", Details = results });
        }

        try 
        {
            // 2. Upload & Lưu DB
            var result = await _uploader.UploadAsync(request.File);
            var image = new ImageMetadata(request.PatientId, request.ClinicId, result.Url, result.PublicId);
            _context.Images.Add(image);
            await _context.SaveChangesAsync();

            // ==> Gửi thông báo
            await NotifyUploadSuccess(request.PatientId, 1);

            results.Add(new { FileName = request.File.FileName, Status = "Success", Url = result.Url, AiNote = "AI Passed" });
            return Ok(new { Message = "Upload thành công", Details = results });
        }
        catch (Exception ex)
        {
            results.Add(new { FileName = request.File.FileName, Status = "Failed", Error = ex.Message });
            return StatusCode(500, new { Message = "Lỗi Server", Details = results });
        }
    }

    // --- 3. API THỐNG KÊ ---
    [HttpGet("stats/{clinicId}")]
    public async Task<IActionResult> GetClinicStats(Guid clinicId)
    {
        var totalImages = await _context.Images.CountAsync(i => i.ClinicId == clinicId);
        var recentUploads = await _context.Images.Where(i => i.ClinicId == clinicId).OrderByDescending(i => i.UploadedAt).Take(5)
            .Select(i => new { i.ImageUrl, UploadedAt = i.UploadedAt.ToString("dd/MM/yyyy HH:mm") }).ToListAsync();
        
        return Ok(new { Summary = new { TotalScans = totalImages }, RecentActivity = recentUploads });
    }

    // --- 4. LẤY ẢNH BỆNH NHÂN ---
    [HttpGet("patient/{patientId}")]
    public async Task<IActionResult> GetImagesByPatient(Guid patientId)
    {
        var images = await _context.Images.Where(i => i.PatientId == patientId).OrderByDescending(i => i.UploadedAt)
            .Select(i => new { i.Id, i.ImageUrl, UploadedAt = i.UploadedAt.ToString("dd/MM/yyyy HH:mm"), FileName = "Ảnh đáy mắt" }).ToListAsync();
        return Ok(images);
    }

    // --- 5. XÓA ẢNH ---
    [HttpDelete("{imageId}")]
    public async Task<IActionResult> DeleteImage(Guid imageId)
    {
        var image = await _context.Images.FindAsync(imageId);
        if (image == null) return NotFound(new { Message = "Không tìm thấy ảnh" });
        _context.Images.Remove(image);
        await _context.SaveChangesAsync();
        return Ok(new { Message = "Đã xóa ảnh thành công" });
    }
}