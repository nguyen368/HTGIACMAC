using Aura.Application.DTOs;
using Aura.Infrastructure.Persistence;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Aura.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ManagementController : ControllerBase
    {
        private readonly AuraDbContext _context;

        public ManagementController(AuraDbContext context)
        {
            _context = context;
        }

        [HttpGet("stats")]
        public async Task<ActionResult<DashboardStatsDto>> GetStats()
        {
            // Trả về dữ liệu giả lập nếu DB trống để test giao diện
            return Ok(new DashboardStatsDto
            {
                TotalPatients = await _context.Users.CountAsync(),
                TotalScans = await _context.MedicalReports.CountAsync(),
                HighRiskCount = 5, 
                AverageAccuracy = 98.5
            });
        }

        [HttpGet("history")]
        public async Task<ActionResult<List<HistoryRecordDto>>> GetHistory()
        {
            // Lấy 10 tin mới nhất
            var list = await _context.MedicalReports
                .OrderByDescending(r => r.CreatedAt)
                .Take(10)
                .Select(r => new HistoryRecordDto {
                    ReportId = r.Id,
                    RiskLevel = r.FinalRiskLevel,
                    DiagnosisDate = r.CreatedAt,
                    PatientName = "Bệnh nhân Demo",
                    DoctorName = "BS. AI"
                })
                .ToListAsync();
            
            return Ok(list);
        }
    }
}