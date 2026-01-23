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
                            
                            // [FIX] Bắn sự kiện với tên mới
                            await _publishEndpoint.Publish(new ImageUploadedIntegrationEvent(
                                image.Id, uploadRes.Url, patientId, clinicId, DateTime.UtcNow
                            ));
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
    }
}