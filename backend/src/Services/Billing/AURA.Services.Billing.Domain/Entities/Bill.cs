using System;
using System.Collections.Generic;
using System.Linq; // Quan trọng: Để dùng hàm .Sum()

namespace AURA.Services.Billing.Domain.Entities
{
    public class Bill
    {
        public Guid Id { get; set; } = Guid.NewGuid();
        public Guid PatientId { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public string Status { get; set; } = "Pending"; // Pending, Paid, Cancelled

        public decimal TotalAmount { get; private set; }

        // Quan hệ 1-nhiều: Một hóa đơn có nhiều dịch vụ
        public List<BillItem> Items { get; set; } = new List<BillItem>();

        public void CalculateTotal()
        {
            if (Items != null && Items.Any())
            {
                TotalAmount = Items.Sum(item => item.Price * item.Quantity);
            }
        }
    }

    public class BillItem
    {
        public Guid Id { get; set; } = Guid.NewGuid();
        public string ServiceName { get; set; } = string.Empty;
        public decimal Price { get; set; }
        public int Quantity { get; set; }
    }
}