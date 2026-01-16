using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using AURA.Services.Billing.Domain.Entities;
using AURA.Services.Billing.Infrastructure.Data;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

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

        // POST: api/bills
        [HttpPost]
        public async Task<IActionResult> CreateBill([FromBody] CreateBillRequest request)
        {
            // 1. Tạo hóa đơn
            var newBill = new Bill
            {
                PatientId = request.PatientId,
                Status = "Pending"
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