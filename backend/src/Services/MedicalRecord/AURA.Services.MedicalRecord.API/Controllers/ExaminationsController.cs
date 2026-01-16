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

    // 1. Lấy danh sách hàng chờ (Status = Pending)
    [HttpGet("queue")]
    public async Task<IActionResult> GetWaitingList()
    {
        var query = await _context.Examinations
            .AsNoTracking()
            .Include(e => e.Patient) // Join sang bảng Patient để lấy tên
            .Where(e => e.Status == "Pending")
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

    // 2. Tạo dữ liệu giả để Test (Fake Data)
    [HttpPost("fake")]
    public async Task<IActionResult> CreateFakeData(Guid patientId)
    {
        // Tạo một ca khám giả lập
        // Lưu ý: Examination constructor mình vừa sửa ở Bước 1
        var fakeExam = new Examination(patientId, "https://via.placeholder.com/150");

        _context.Examinations.Add(fakeExam);
        await _context.SaveChangesAsync();

        return Ok(new { Message = "Đã tạo ca khám giả thành công!", ExamId = fakeExam.Id });
    }
}