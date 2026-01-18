using AURA.Services.MedicalRecord.Application.DTOs;
using AURA.Services.MedicalRecord.Domain.Entities;
using AURA.Services.MedicalRecord.Infrastructure.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace AURA.Services.MedicalRecord.API.Controllers;

[ApiController]
[Route("api/examinations")]
public class ExaminationsController : ControllerBase
{
    private readonly MedicalDbContext _context;

    public ExaminationsController(MedicalDbContext context)
    {
        _context = context;
    }

    // =========================================================================
    // PHẦN 1: API HÀNG CHỜ (TUẦN 2)
    // =========================================================================

    // GET: api/examinations/queue -> Lấy danh sách chờ cho Bác sĩ
    [HttpGet("queue")]
    public async Task<IActionResult> GetWaitingList()
    {
        var query = await _context.Examinations
            .AsNoTracking()
            .Include(e => e.Patient) // Join bảng để lấy tên
            .Where(e => e.Status == "Pending" || e.Status == "Analyzed") // Lấy cả ca Chờ và Đã có AI
            .OrderBy(e => e.ExamDate)
            .Select(e => new ExaminationQueueDto
            {
                Id = e.Id,
                PatientId = e.PatientId ?? Guid.Empty,
                PatientName = e.Patient != null ? e.Patient.FullName : "Unknown",
                ImageUrl = e.ImageUrl,
                ExamDate = e.ExamDate,
                Status = e.Status
            })
            .ToListAsync();

        return Ok(query);
    }

    // POST: api/examinations/fake -> Tạo dữ liệu giả để test
    [HttpPost("fake")]
    public async Task<IActionResult> CreateFakeData(Guid patientId)
    {
        var fakeExam = new Examination(patientId, "https://via.placeholder.com/600x400?text=Eye+Image+Test");
        _context.Examinations.Add(fakeExam);
        await _context.SaveChangesAsync();
        return Ok(new { Message = "Đã tạo ca khám giả thành công!", ExamId = fakeExam.Id });
    }

    // =========================================================================
    // PHẦN 2: CHI TIẾT HỒ SƠ CHO UI (TUẦN 4 - NEW 🌟)
    // =========================================================================

    // GET: api/examinations/{id} -> Lấy chi tiết 1 ca khám để hiển thị lên Doctor Workstation
    [HttpGet("{id}")]
    public async Task<IActionResult> GetExaminationDetail(Guid id)
    {
        var exam = await _context.Examinations
            .AsNoTracking()
            .Include(e => e.Patient)
            .FirstOrDefaultAsync(e => e.Id == id);

        if (exam == null) return NotFound("Không tìm thấy hồ sơ.");

        // Trả về object phẳng (flat) để Frontend dễ hiển thị
        return Ok(new 
        {
            exam.Id,
            PatientName = exam.Patient?.FullName ?? "Unknown",
            PatientId = exam.PatientId,
            ImageUrl = exam.ImageUrl,
            DiagnosisResult = exam.DiagnosisResult, // Kết quả AI
            DoctorNotes = exam.DoctorNotes,         // Ghi chú bác sĩ (nếu có)
            Status = exam.Status,
            ExamDate = exam.ExamDate
        });
    }

    // =========================================================================
    // PHẦN 3: STATE PATTERN API (TUẦN 3)
    // =========================================================================

    // PUT: api/examinations/{id}/ai-result -> AI trả kết quả về
    [HttpPut("{id}/ai-result")]
    public async Task<IActionResult> UpdateAiResult(Guid id, [FromBody] string aiResult)
    {
        var exam = await _context.Examinations.FindAsync(id);
        if (exam == null) return NotFound("Không tìm thấy ca khám.");

        try
        {
            exam.UpdateAiResult(aiResult);
            await _context.SaveChangesAsync();
            return Ok(new { Message = "AI cập nhật kết quả thành công", NewStatus = exam.Status });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { Error = "Lỗi trạng thái", Detail = ex.Message });
        }
    }

    // PUT: api/examinations/{id}/verify -> Bác sĩ duyệt hồ sơ
    [HttpPut("{id}/verify")]
    public async Task<IActionResult> VerifyExamination(Guid id, [FromBody] ConfirmDiagnosisRequest request)
    {
        var exam = await _context.Examinations.FindAsync(id);
        if (exam == null) return NotFound("Không tìm thấy ca khám.");

        try
        {
            exam.ConfirmDiagnosis(request.DoctorNotes, request.FinalDiagnosis);
            await _context.SaveChangesAsync();
            return Ok(new { Message = "Bác sĩ đã duyệt hồ sơ thành công", NewStatus = exam.Status });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { Error = "Lỗi trạng thái", Detail = ex.Message });
        }
    }
}