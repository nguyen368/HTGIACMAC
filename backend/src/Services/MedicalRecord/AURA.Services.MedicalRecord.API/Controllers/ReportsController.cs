using AURA.Services.MedicalRecord.Infrastructure.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace AURA.Services.MedicalRecord.API.Controllers
{
    [ApiController]
    [Route("api/medical-records/reports")]
    public class ReportsController : ControllerBase
    {
        private readonly MedicalDbContext _context;

        public ReportsController(MedicalDbContext context)
        {
            _context = context;
        }

        // [GET] api/medical-records/reports/{examId}/print
        // API trả về dữ liệu JSON để Frontend render thành file PDF
        [HttpGet("{examId}/print")]
        public async Task<IActionResult> GetReportData(Guid examId)
        {
            var exam = await _context.Examinations
                .Include(e => e.Patient)
                .AsNoTracking()
                .FirstOrDefaultAsync(e => e.Id == examId);

            if (exam == null) return NotFound("Không tìm thấy hồ sơ bệnh án.");

            // --- TRACEABILITY LOGIC (Theo yêu cầu tài liệu) ---
            // Phải hiển thị rõ AI phiên bản nào, ngưỡng bao nhiêu là nguy hiểm
            var traceabilityInfo = new 
            {
                SystemName = "AURA AI Retinal Screening System",
                AlgorithmVersion = "AURA-ResNet v2.1.0",
                AnalysisTimestamp = exam.ExamDate,
                
                // Ngưỡng chẩn đoán (Thresholds) - Để đảm bảo tính minh bạch
                Thresholds = new {
                    LowRisk = "Score < 40%",
                    MediumRisk = "40% <= Score < 80%",
                    HighRisk = "Score >= 80%"
                },
                
                AiConfidenceScore = exam.AiRiskScore ?? 0,
                AiRawDecision = exam.AiDiagnosis
            };
            // --------------------------------------------------

            var reportData = new 
            {
                ReportId = Guid.NewGuid(), // Mã phiếu in
                PrintedAt = DateTime.UtcNow,
                
                // Thông tin hành chính
                ClinicInfo = new {
                    Name = "Hệ thống Y tế AURA",
                    Address = "Trung tâm chẩn đoán hình ảnh từ xa"
                },
                
                PatientInfo = new {
                    Name = exam.Patient?.FullName ?? "N/A",
                    Id = exam.PatientId,
                    DOB = exam.Patient?.DateOfBirth.ToString("dd/MM/yyyy"),
                    Gender = exam.Patient?.Gender
                },

                // Hình ảnh bằng chứng
                Images = new {
                    Original = exam.ImageUrl,
                    Heatmap = exam.HeatmapUrl // Ảnh nhiệt vùng tổn thương
                },

                // Kết quả chuyên môn
                MedicalResult = new {
                    Status = exam.Status, // Verified hoặc Analyzed
                    RiskLevel = exam.AiRiskLevel,
                    FinalDiagnosis = exam.Status == "Verified" ? exam.Diagnosis : "Đang chờ bác sĩ xác nhận",
                    DoctorNote = exam.DoctorNotes,
                    DoctorName = exam.DoctorId != Guid.Empty ? "Bác sĩ Chuyên khoa Mắt" : "Hệ thống AI (Sơ bộ)"
                },

                // Thông tin truy xuất nguồn gốc
                TechnicalTraceability = traceabilityInfo
            };

            return Ok(reportData);
        }
    }
}