using AURA.Services.Imaging.API.DTOs;
using AURA.Services.Imaging.Application.Interfaces;
using AURA.Services.Imaging.Domain.Entities;
using AURA.Services.Imaging.Infrastructure.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Http;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using System.Linq;
using Microsoft.EntityFrameworkCore;
using System.IO;                 // Để xử lý Stream và Path
using System.IO.Compression;     // Để xử lý giải nén Zip
using System.Text.Json;          // [Mới] Để serialize JSON kết quả AI

namespace AURA.Services.Imaging.API.Controllers;

[ApiController]
[Route("api/imaging")]
public class ImagesController : ControllerBase
{
    private readonly IImageUploader _uploader;
    private readonly ImagingDbContext _context;

    public ImagesController(IImageUploader uploader, ImagingDbContext context)
    {
        _uploader = uploader;
        _context = context;
    }

    // --- API 1: Upload lẻ (Dùng để test hoặc cho user thường) ---
    [HttpPost("upload")]
    public async Task<IActionResult> Upload([FromForm] UploadImageRequest request)
    {
        if (request.File == null || request.File.Length == 0)
            return BadRequest("File ảnh không được để trống");

        var result = await _uploader.UploadAsync(request.File);
        
        if (string.IsNullOrEmpty(result.Url)) 
            return BadRequest("Upload failed");

        var image = new ImageMetadata(request.PatientId, request.ClinicId, result.Url, result.PublicId);
        
        _context.Images.Add(image);
        await _context.SaveChangesAsync();

        return Ok(new { ImageId = image.Id, Url = result.Url });
    }

    // --- API 2: [TV5] [FR-24] Upload hàng loạt từ file Zip (Batch Processing) ---
    [HttpPost("batch-upload")]
    public async Task<IActionResult> BatchUpload(
        IFormFile zipFile,       // Nhận 1 file Zip thay vì List<File>
        [FromForm] Guid clinicId, 
        [FromForm] Guid patientId)
    {
        // 1. Validate file zip
        if (zipFile == null || zipFile.Length == 0)
            return BadRequest("Vui lòng upload file .zip");

        if (Path.GetExtension(zipFile.FileName).ToLower() != ".zip")
            return BadRequest("File phải có định dạng .zip");

        var results = new List<object>();
        int successCount = 0;

        // 2. Mở và đọc file Zip trực tiếp từ Stream (không cần lưu tạm ra ổ cứng)
        using (var stream = zipFile.OpenReadStream())
        using (var archive = new ZipArchive(stream, ZipArchiveMode.Read))
        {
            // Duyệt qua từng file trong file nén
            foreach (var entry in archive.Entries)
            {
                // Bỏ qua folder hoặc file hệ thống (ví dụ __MACOSX trên Mac)
                if (string.IsNullOrEmpty(entry.Name) || entry.FullName.StartsWith("__")) continue;

                // Chỉ xử lý file ảnh
                var ext = Path.GetExtension(entry.Name).ToLower();
                if (ext != ".jpg" && ext != ".png" && ext != ".jpeg") continue;

                try 
                {
                    // Mở stream của file ảnh con
                    using (var entryStream = entry.Open())
                    {
                        // Gọi hàm UploadStreamAsync (đã thêm vào Interface)
                        var uploadResult = await _uploader.UploadStreamAsync(entryStream, entry.Name);

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

        // 3. Commit vào Database
        if (successCount > 0)
        {
            await _context.SaveChangesAsync();
        }
        
        return Ok(new { 
            Message = $"Đã giải nén và xử lý thành công {successCount} ảnh.", 
            Details = results 
        });
    }

    // --- API 3: [TV5] [FR-26] Báo cáo thống kê cho Phòng khám ---
    [HttpGet("stats/{clinicId}")]
    public async Task<IActionResult> GetClinicStats(Guid clinicId)
    {
        // 1. Tổng số ảnh đã chụp tại phòng khám này
        var totalImages = await _context.Images.CountAsync(i => i.ClinicId == clinicId);

        // 2. Lấy danh sách 5 ảnh mới nhất (History)
        var recentUploads = await _context.Images
            .Where(i => i.ClinicId == clinicId)
            .OrderByDescending(i => i.UploadedAt)
            .Take(5)
            .Select(i => new 
            { 
                i.ImageUrl, 
                UploadedAt = i.UploadedAt.ToString("dd/MM/yyyy HH:mm") 
            })
            .ToListAsync();

        // 3. Biểu đồ: Thống kê số lượng ảnh trong 7 ngày qua
        var sevenDaysAgo = DateTime.UtcNow.AddDays(-7);
        
        // (Lấy dữ liệu thô về RAM rồi mới GroupBy Client-side để tránh lỗi SQL với hàm Date)
        var rawData = await _context.Images
            .Where(i => i.ClinicId == clinicId && i.UploadedAt >= sevenDaysAgo)
            .ToListAsync(); 

        var chartData = rawData
            .GroupBy(i => i.UploadedAt.Date)
            .Select(g => new { 
                Date = g.Key.ToString("dd/MM"), 
                Count = g.Count() 
            })
            .OrderBy(x => x.Date)
            .ToList();

        return Ok(new 
        { 
            ClinicId = clinicId,
            Summary = new { TotalScans = totalImages },
            RecentActivity = recentUploads,
            ChartData = chartData
        });
    }

    // --- API 4: [TUẦN 2] AI Dummy - Giả lập phân tích ảnh (MỚI THÊM) ---
    // URL: POST api/imaging/analyze-dummy/{imageId}
    [HttpPost("analyze-dummy/{imageId}")]
    public async Task<IActionResult> SimulateAiAnalysis(Guid imageId)
    {
        // 1. Tìm xem ảnh có tồn tại trong DB không
        var image = await _context.Images.FirstOrDefaultAsync(x => x.Id == imageId);
        if (image == null)
            return NotFound("Không tìm thấy ảnh với ID này.");

        // 2. [QUAN TRỌNG] Giả lập thời gian chờ (Delay 2 giây)
        // Mục đích: Để Frontend test được hiệu ứng "Loading..." xoay vòng
        await Task.Delay(2000); 

        // 3. Sinh dữ liệu giả (Mock Data) ngẫu nhiên
        var random = new Random();
        bool isSick = random.NextDouble() > 0.5; // 50% cơ hội bị bệnh, 50% khỏe

        var result = new AiAnalysisResultDto
        {
            Diagnosis = isSick ? "Phát hiện dấu hiệu Glaucoma (Giai đoạn 2)" : "Mắt bình thường",
            RiskLevel = isSick ? "High" : "Low",
            // Random độ tin cậy từ 70% - 99%
            ConfidenceScore = Math.Round(random.NextDouble() * (0.99 - 0.70) + 0.70, 2), 
            // Giả lập tọa độ vùng đỏ trên mắt
            HeatmapCoordinates = isSick 
                ? new List<string> { "{x: 120, y: 45, r: 10}", "{x: 140, y: 60, r: 15}" } 
                : new List<string>(),
            DoctorNotes = isSick 
                ? "Cần chuyển tuyến trên để kiểm tra nhãn áp ngay." 
                : "Không cần can thiệp y tế. Tái khám sau 6 tháng."
        };

        // 4. Lưu kết quả giả này vào Database
        try 
        {
            // Chuyển object thành chuỗi JSON
            string jsonResult = JsonSerializer.Serialize(result);
            
            // Gọi hàm Update bạn đã viết trong Entity
            image.UpdateAiResult(jsonResult);
            
            await _context.SaveChangesAsync();
        }
        catch (Exception ex)
        {
            return BadRequest($"Lỗi khi lưu kết quả: {ex.Message}");
        }

        // 5. Trả về kết quả cho Frontend
        return Ok(new 
        { 
            Message = "Phân tích AI hoàn tất (Dữ liệu giả lập).", 
            Data = result 
        });
    }
}