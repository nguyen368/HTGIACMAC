using AURA.Services.Imaging.API.DTOs; // Nhớ thêm dòng này
using AURA.Services.Imaging.Application.Interfaces;
using AURA.Services.Imaging.Domain.Entities;
using AURA.Services.Imaging.Infrastructure.Data;
using Microsoft.AspNetCore.Mvc;

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

    [HttpPost("upload")]
    // SỬA Ở ĐÂY: Dùng [FromForm] UploadImageRequest request
    public async Task<IActionResult> Upload([FromForm] UploadImageRequest request)
    {
        // Kiểm tra file rỗng
        if (request.File == null || request.File.Length == 0)
            return BadRequest("File ảnh không được để trống");

        // 1. Upload lên Cloud (gọi qua request.File)
        var result = await _uploader.UploadAsync(request.File);
        if (result.Url == null) return BadRequest("Upload failed");

        // 2. Lưu Metadata vào DB (gọi qua request.PatientId)
        var image = new ImageMetadata(request.PatientId, result.Url, result.PublicId);
        _context.Images.Add(image);
        await _context.SaveChangesAsync();

        return Ok(new { ImageId = image.Id, Url = result.Url });
    }
}