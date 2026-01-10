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
using Microsoft.EntityFrameworkCore; // Dùng để truy vấn Database (Count, ToList)

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

    // --- API 2: [TV5] [FR-24] Upload hàng loạt (Batch Processing) ---
    [HttpPost("batch-upload")]
    public async Task<IActionResult> BatchUpload(
        [FromForm] List<IFormFile> files, 
        [FromForm] Guid clinicId, 
        [FromForm] Guid patientId)
    {
        if (files == null || files.Count == 0)
            return BadRequest("Vui lòng chọn ít nhất 1 file ảnh.");

        var results = new List<object>();

        // Iterator Pattern: Duyệt qua từng file để xử lý
        foreach (var file in files)
        {
            if (file.Length > 0)
            {
                var uploadResult = await _uploader.UploadAsync(file);

                if (!string.IsNullOrEmpty(uploadResult.Url))
                {
                    // Lưu vào DB kèm ClinicId
                    var image = new ImageMetadata(patientId, clinicId, uploadResult.Url, uploadResult.PublicId);
                    _context.Images.Add(image);
                    
                    results.Add(new { 
                        FileName = file.FileName, 
                        Status = "Success", 
                        Url = uploadResult.Url 
                    });
                }
            }
        }

        // Lưu tất cả thay đổi vào Database một lần
        await _context.SaveChangesAsync();
        
        return Ok(new { 
            Message = $"Đã xử lý xong {files.Count} ảnh.", 
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
        
        // (Lấy dữ liệu về RAM rồi mới GroupBy để tránh lỗi SQL với DateTime)
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
}