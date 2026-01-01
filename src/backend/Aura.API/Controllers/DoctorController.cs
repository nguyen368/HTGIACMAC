// File: src/backend/Aura.API/Controllers/DoctorController.cs
using Aura.Application.DTOs;
using Aura.Infrastructure.Persistence; //
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Aura.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    // [Authorize(Roles = "Doctor")] // Tạm thời comment để test nếu chưa xong Auth
    public class DoctorController : ControllerBase
    {
        private readonly AuraDbContext _context;

        public DoctorController(AuraDbContext context)
        {
            _context = context;
        }

        // GET: api/Doctor/assigned-patients/{doctorId}
        [HttpGet("assigned-patients/{doctorId}")]
        public async Task<ActionResult<IEnumerable<PatientQueueDto>>> GetAssignedPatients(Guid doctorId)
        {
            // Logic: Lấy các MedicalReport có DoctorId tương ứng
            // Join: MedicalReport -> AIResult -> Upload -> User (Để lấy tên)
            // Lưu ý: Đây là query giả định dựa trên cấu trúc clean architecture
            
            var query = from report in _context.MedicalReports
                        where report.DoctorId == doctorId
                        // Giả sử có bảng Uploads và Users liên kết (bạn cần check lại quan hệ trong DbContext)
                        /* join aiResult in _context.AIResults on report.AIResultId equals aiResult.Id
                           join upload in _context.Uploads on aiResult.UploadId equals upload.Id
                           join user in _context.Users on upload.UserId equals user.Id 
                        */
                        select new PatientQueueDto
                        {
                            ReportId = report.Id,
                            PatientName = "Nguyễn Văn A", // Placeholder nếu chưa join được User
                            CreatedAt = report.CreatedAt, // Từ BaseEntity
                            Status = report.FinalRiskLevel == "" ? "Pending" : "Reviewed",
                            RiskLevel = "High" // Lấy từ AIResult
                        };

            return await query.ToListAsync();
        }
    }
}