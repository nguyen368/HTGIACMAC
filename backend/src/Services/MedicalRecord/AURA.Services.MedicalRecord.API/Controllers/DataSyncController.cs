using AURA.Services.MedicalRecord.Domain.Entities;
using AURA.Services.MedicalRecord.Infrastructure.Data;
using Microsoft.AspNetCore.Mvc;

namespace AURA.Services.MedicalRecord.API.Controllers
{
    [ApiController]
    [Route("api/data-sync")]
    // API dành riêng cho Apache NiFi (Công nghệ số 6)
    public class DataSyncController : ControllerBase
    {
        private readonly MedicalDbContext _context;

        public DataSyncController(MedicalDbContext context)
        {
            _context = context;
        }

        // [POST] api/data-sync/import-legacy
        // NiFi sẽ gọi vào đây để đồng bộ dữ liệu từ các bệnh viện tuyến dưới
        [HttpPost("import-legacy")]
        public async Task<IActionResult> ImportLegacyData([FromBody] List<LegacyExamDto> legacyData)
        {
            if (legacyData == null || !legacyData.Any()) return BadRequest("No Data");

            int count = 0;
            foreach (var item in legacyData)
            {
                // Logic: Chuyển đổi dữ liệu cũ sang cấu trúc AURA
                // Sử dụng constructor 2 tham số (PatientId, ImageUrl)
                var exam = new Examination(item.PatientId, item.ImageUrl);
                
                // [FIX LỖI TẠI ĐÂY] 
                // Set trạng thái đã duyệt (Verified) vì đây là dữ liệu cũ.
                // Truyền thêm tham số thứ 3 là Guid.Empty (tượng trưng cho System Import)
                exam.ConfirmDiagnosis("Imported from NiFi Pipeline", item.Diagnosis, Guid.Empty);

                _context.Examinations.Add(exam);
                count++;
            }

            await _context.SaveChangesAsync();
            return Ok(new { Message = $"NiFi Sync: Đã import thành công {count} hồ sơ.", Time = DateTime.UtcNow });
        }
    }

    public class LegacyExamDto
    {
        public Guid PatientId { get; set; }
        public string ImageUrl { get; set; } = string.Empty;
        public string Diagnosis { get; set; } = string.Empty;
    }
}