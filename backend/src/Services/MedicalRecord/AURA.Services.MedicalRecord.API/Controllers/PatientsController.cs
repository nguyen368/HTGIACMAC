using AURA.Services.MedicalRecord.Domain.Entities;
using AURA.Services.MedicalRecord.Infrastructure.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace AURA.Services.MedicalRecord.API.Controllers;

[ApiController]
[Route("api/patients")]
public class PatientsController : ControllerBase
{
    private readonly MedicalDbContext _context;

    public PatientsController(MedicalDbContext context)
    {
        _context = context;
    }

    [HttpPost]
    public async Task<IActionResult> Create(string fullName, DateTime dob, string gender, string phone, string address)
    {
        // --- THÊM DÒNG NÀY ĐỂ FIX LỖI ---
        // Ép kiểu ngày tháng về chuẩn UTC mà PostgreSQL yêu cầu
        dob = DateTime.SpecifyKind(dob, DateTimeKind.Utc);
        // --------------------------------

        var patient = new Patient(fullName, dob, gender, phone, address);
        _context.Patients.Add(patient);
        await _context.SaveChangesAsync();
        return Ok(patient);
    }

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var patients = await _context.Patients.ToListAsync();
        return Ok(patients);
    }
}