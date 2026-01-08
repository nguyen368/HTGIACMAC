using AURA.Services.Billing.Domain.Entities;
using AURA.Services.Billing.Infrastructure.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace AURA.Services.Billing.API.Controllers;

[ApiController]
[Route("api/bills")]
public class BillsController : ControllerBase
{
    private readonly BillingDbContext _context;

    public BillsController(BillingDbContext context)
    {
        _context = context;
    }

    [HttpPost]
    public async Task<IActionResult> Create(Guid patientId, decimal amount)
    {
        var bill = new Bill(patientId, amount);
        _context.Bills.Add(bill);
        await _context.SaveChangesAsync();
        return Ok(bill);
    }

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var bills = await _context.Bills.ToListAsync();
        return Ok(bills);
    }
}