using AURA.Services.Imaging.API.DTOs;
using AURA.Services.Imaging.Application.Interfaces;
using AURA.Services.Imaging.Domain.Entities;
using AURA.Services.Imaging.Infrastructure.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.IO.Compression; // Xử lý file Zip
using System.Text.Json;      // Xử lý JSON
using System.Text.Json.Serialization; // Attribute cho JSON

namespace AURA.Services.Imaging.API.Controllers;

[ApiController]
[Route("api/imaging")]
public class ImagesController : ControllerBase
{
    private readonly IImageUploader _uploader;
    private readonly ImagingDbContext _context;
    // [MỚI] Dùng để tạo HTTP Client gọi sang Python
    private readonly IHttpClientFactory _httpClientFactory; 

    // Inject thêm HttpClientFactory vào Constructor
    public ImagesController(
        IImageUploader uploader, 
        ImagingDbContext context,
        IHttpClientFactory httpClientFactory)
    {
        _uploader = uploader;
        _context = context;
        _httpClientFactory = httpClientFactory;
    }

    // --- CLASS HỨNG KẾT QUẢ TRẢ VỀ TỪ PYTHON ---
    private class AiValidationResponse
    {
        [JsonPropertyName("is_valid")]
        public bool IsValid { get; set; }
        
        [JsonPropertyName("reason")]
        public string? Reason { get; set; }
    }

    // --- HÀM RIÊNG: Gửi ảnh sang AI Core để kiểm tra ---
    private async Task<(bool IsValid, string Reason)> ValidateImageWithAi(Stream fileStream, string fileName)
    {
        try 
        {
            var client = _httpClientFactory.CreateClient();
            
            // [QUAN TRỌNG] Địa chỉ Service Python (AI Core)
            // Nếu chạy Local 2 terminal: dùng "http://localhost:5005/validate-eye"
            // Nếu chạy Docker Compose: dùng "http://ai-core-service:8080/validate-eye"
            string aiServiceUrl = "http://localhost:5005/validate-eye"; 

            var content = new MultipartFormDataContent();
            var streamContent = new StreamContent(fileStream);
            content.Add(streamContent, "file", fileName);

            // Gửi request POST sang Python
            var response = await client.PostAsync(aiServiceUrl, content);
            
            // Nếu Service AI chưa bật hoặc lỗi mạng -> Tạm thời cho qua (Skip Check) để không chặn bác sĩ
            if (!response.IsSuccessStatusCode) 
                return (true, "AI Service Warning: Không kết nối được (Skip Check)");

            // Đọc kết quả JSON
            var jsonString = await response.Content.ReadAsStringAsync();
            var result = JsonSerializer.Deserialize<AiValidationResponse>(jsonString, 
                new JsonSerializerOptions { PropertyNameCaseInsensitive = true });

            return (result?.IsValid ?? true, result?.Reason ?? "Unknown");
        }
        catch (Exception ex)
        {
            // Log lỗi và cho qua
            return (true, $"AI Error: {ex.Message}"); 
        }
    }

    // --- API 1: Upload lẻ (Đã nâng cấp Validate AI) ---
    [HttpPost("upload")]
    public async Task<IActionResult> Upload([FromForm] UploadImageRequest request)
    {
        if (request.File == null || request.File.Length == 0)
            return BadRequest("File ảnh không được để trống");

        // 1. [MỚI] Gọi AI check trước
        using (var stream = request.File.OpenReadStream())
        {
            var (isValid, reason) = await ValidateImageWithAi(stream, request.File.FileName);
            if (!isValid)
            {
                return BadRequest($"Ảnh bị từ chối bởi AI: {reason}");
            }
        }

        // 2. Nếu OK thì Upload lên Cloudinary (như cũ)
        var result = await _uploader.UploadAsync(request.File);
        
        if (string.IsNullOrEmpty(result.Url)) 
            return BadRequest("Upload failed");

        var image = new ImageMetadata(request.PatientId, request.ClinicId, result.Url, result.PublicId);
        
        _context.Images.Add(image);
        await _context.SaveChangesAsync();

        return Ok(new { ImageId = image.Id, Url = result.Url });
    }

    // --- API 2: Upload hàng loạt từ file Zip (Đã nâng cấp Validate AI) ---
    [HttpPost("batch-upload")]
    public async Task<IActionResult> BatchUpload(
        IFormFile zipFile, 
        [FromForm] Guid clinicId, 
        [FromForm] Guid patientId)
    {
        // 1. Validate file zip đầu vào
        if (zipFile == null || zipFile.Length == 0)
            return BadRequest("Vui lòng upload file .zip");

        if (Path.GetExtension(zipFile.FileName).ToLower() != ".zip")
            return BadRequest("File phải có định dạng .zip");

        var results = new List<object>();
        int successCount = 0;

        // 2. Xử lý file Zip
        using (var stream = zipFile.OpenReadStream())
        using (var archive = new ZipArchive(stream, ZipArchiveMode.Read))
        {
            foreach (var entry in archive.Entries)
            {
                // Bỏ qua folder hoặc file rác hệ thống
                if (string.IsNullOrEmpty(entry.Name) || entry.FullName.StartsWith("__")) continue;
                
                // Chỉ xử lý file có đuôi ảnh
                var ext = Path.GetExtension(entry.Name).ToLower();
                if (ext != ".jpg" && ext != ".png" && ext != ".jpeg") continue;

                try 
                {
                    using (var entryStream = entry.Open())
                    using (var memoryStream = new MemoryStream())
                    {
                        // [QUAN TRỌNG] Copy sang MemoryStream để có thể đọc 2 lần (1 cho AI, 1 cho Cloudinary)
                        await entryStream.CopyToAsync(memoryStream);
                        
                        // --- BƯỚC 1: GỬI SANG AI PYTHON CHECK ---
                        memoryStream.Position = 0; // Tua về đầu file
                        var (isValid, reason) = await ValidateImageWithAi(memoryStream, entry.Name);

                        if (!isValid)
                        {
                            // Nếu AI bảo "Đây là ảnh phong cảnh" -> TỪ CHỐI
                            results.Add(new { 
                                FileName = entry.Name, 
                                Status = "Rejected", 
                                Error = reason 
                            });
                            continue; // Bỏ qua ảnh này, nhảy sang ảnh tiếp theo
                        }

                        // --- BƯỚC 2: UPLOAD LÊN CLOUD ---
                        memoryStream.Position = 0; // Tua lại về đầu để upload
                        var uploadResult = await _uploader.UploadStreamAsync(memoryStream, entry.Name);

                        if (!string.IsNullOrEmpty(uploadResult.Url))
                        {
                            // Lưu Metadata vào DB
                            var image = new ImageMetadata(patientId, clinicId, uploadResult.Url, uploadResult.PublicId);
                            _context.Images.Add(image);
                            
                            results.Add(new { 
                                FileName = entry.Name, 
                                Status = "Success", 
                                Url = uploadResult.Url 
                            });
                            successCount++;
                        }
                    }
                }
                catch (Exception ex)
                {
                    results.Add(new { FileName = entry.Name, Status = "Failed", Error = ex.Message });
                }
            }
        }

        // 3. Commit dữ liệu vào Database
        if (successCount > 0)
        {
            await _context.SaveChangesAsync();
        }
        
        return Ok(new { 
            Message = $"Hoàn tất. Thành công: {successCount}, Bị từ chối/Lỗi: {results.Count - successCount}", 
            Details = results 
        });
    }

    // --- API 3: Thống kê (Giữ nguyên code cũ) ---
    [HttpGet("stats/{clinicId}")]
    public async Task<IActionResult> GetClinicStats(Guid clinicId)
    {
        var totalImages = await _context.Images.CountAsync(i => i.ClinicId == clinicId);
        var recentUploads = await _context.Images
            .Where(i => i.ClinicId == clinicId)
            .OrderByDescending(i => i.UploadedAt)
            .Take(5)
            .Select(i => new { i.ImageUrl, UploadedAt = i.UploadedAt.ToString("dd/MM/yyyy HH:mm") })
            .ToListAsync();

        var sevenDaysAgo = DateTime.UtcNow.AddDays(-7);
        var rawData = await _context.Images
            .Where(i => i.ClinicId == clinicId && i.UploadedAt >= sevenDaysAgo)
            .ToListAsync(); 

        var chartData = rawData
            .GroupBy(i => i.UploadedAt.Date)
            .Select(g => new { Date = g.Key.ToString("dd/MM"), Count = g.Count() })
            .OrderBy(x => x.Date)
            .ToList();

        return Ok(new { ClinicId = clinicId, Summary = new { TotalScans = totalImages }, RecentActivity = recentUploads, ChartData = chartData });
    }

    // --- API 4: AI Dummy (Giữ nguyên code cũ) ---
    [HttpPost("analyze-dummy/{imageId}")]
    public async Task<IActionResult> SimulateAiAnalysis(Guid imageId)
    {
        var image = await _context.Images.FirstOrDefaultAsync(x => x.Id == imageId);
        if (image == null) return NotFound("Không tìm thấy ảnh.");

        await Task.Delay(2000); // Giả lập delay

        var random = new Random();
        bool isSick = random.NextDouble() > 0.5;
        var result = new AiAnalysisResultDto
        {
            Diagnosis = isSick ? "Phát hiện dấu hiệu Glaucoma" : "Mắt bình thường",
            RiskLevel = isSick ? "High" : "Low",
            ConfidenceScore = Math.Round(random.NextDouble() * 0.3 + 0.7, 2),
            DoctorNotes = isSick ? "Cần chuyển tuyến trên." : "Tái khám sau 6 tháng."
        };

        try 
        {
            image.UpdateAiResult(JsonSerializer.Serialize(result));
            await _context.SaveChangesAsync();
        }
        catch (Exception ex) { return BadRequest(ex.Message); }

        return Ok(new { Message = "Phân tích AI hoàn tất.", Data = result });
    }
}