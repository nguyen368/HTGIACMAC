using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using AURA.Services.Billing.Domain.Entities;
using AURA.Services.Billing.Infrastructure.Data;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using System.Linq;

namespace AURA.Services.Billing.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class BillsController : ControllerBase
    {
        private readonly BillingDbContext _context;

        public BillsController(BillingDbContext context)
        {
            _context = context;
        }

        // ===========================
        // 1. TẠO & LẤY HÓA ĐƠN
        // ===========================

        // POST: api/bills
        [HttpPost]
        public async Task<IActionResult> CreateBill([FromBody] CreateBillRequest request)
        {
            // 1. Tạo hóa đơn
            var newBill = new Bill
            {
                PatientId = request.PatientId,
                Status = "Pending",
                CreatedAt = DateTime.UtcNow
            };

            // 2. Thêm dịch vụ
            if (request.Items != null)
            {
                foreach (var item in request.Items)
                {
                    newBill.Items.Add(new BillItem
                    {
                        ServiceName = item.ServiceName,
                        Price = item.Price,
                        Quantity = item.Quantity
                    });
                }
            }

            // 3. Tính tiền
            newBill.CalculateTotal();

            // 4. Lưu DB
            _context.Bills.Add(newBill);
            await _context.SaveChangesAsync();

            return Ok(newBill);
        }

        [HttpGet]
        public async Task<IActionResult> GetBills()
        {
            // Lấy tất cả hóa đơn từ Database về
            var bills = await _context.Bills.Include(b => b.Items).OrderByDescending(b => b.CreatedAt).ToListAsync();
            return Ok(bills);
        }

        // ===========================
        // 2. THANH TOÁN & THỐNG KÊ (NEW)
        // ===========================

        // [POST] Thanh toán (Giả lập)
        [HttpPost("pay/{billId}")]
        public async Task<IActionResult> ProcessPayment(Guid billId)
        {
            var bill = await _context.Bills.FindAsync(billId);
            if (bill == null) return NotFound();

            if (bill.Status == "Paid") return BadRequest("Hóa đơn đã thanh toán");

            bill.Status = "Paid";
            bill.PaidAt = DateTime.UtcNow;
            
            await _context.SaveChangesAsync();
            return Ok(new { Message = "Thanh toán thành công" });
        }

        // [GET] ADMIN DASHBOARD: Thống kê doanh thu 7 ngày qua
        [HttpGet("admin/revenue-chart")]
        public async Task<IActionResult> GetRevenueChart()
        {
            var sevenDaysAgo = DateTime.UtcNow.AddDays(-7);
            
            // Logic Group By để tính tổng tiền theo ngày
            var data = await _context.Bills
                .Where(b => b.CreatedAt >= sevenDaysAgo && b.Status == "Paid") // Chỉ tính bill đã trả
                .GroupBy(b => b.CreatedAt.Date)
                .Select(g => new {
                    Date = g.Key,
                    TotalAmount = g.Sum(b => b.TotalAmount),
                    Count = g.Count()
                })
                .OrderBy(x => x.Date)
                .ToListAsync();

            return Ok(data);
        }
    }

    // Class DTO (Data Transfer Object) để nhận dữ liệu từ Frontend
    public class CreateBillRequest
    {
        public Guid PatientId { get; set; }
        public List<BillItemDto> Items { get; set; } = new List<BillItemDto>();
    }

    public class BillItemDto
    {
        public string ServiceName { get; set; }
        public decimal Price { get; set; }
        public int Quantity { get; set; }
    }
}