using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using AURA.Services.MedicalRecord.Infrastructure.Data; // Quan trọng: trỏ về Data
using AURA.Services.MedicalRecord.Domain.Entities;

namespace AURA.Services.MedicalRecord.API.Controllers;

[Route("api/[controller]")]
[ApiController]
public class DataSyncController : ControllerBase
{
    private readonly MedicalDbContext _context; // Đã sửa tên

    public DataSyncController(MedicalDbContext context) // Đã sửa Injection
    {
        _context = context;
    }

    [HttpPost("sync-user")]
    public async Task<IActionResult> SyncUser([FromBody] Patient patient)
    {
        var exists = await _context.Patients.AnyAsync(p => p.UserId == patient.UserId);
        if (exists) return Ok("User already synced");

        _context.Patients.Add(patient);
        await _context.SaveChangesAsync();
        return Ok("User synced successfully");
    }
}