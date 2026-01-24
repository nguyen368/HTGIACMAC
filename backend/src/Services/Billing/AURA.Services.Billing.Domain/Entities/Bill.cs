using System;
using System.Collections.Generic;
using System.Linq; 

namespace AURA.Services.Billing.Domain.Entities
{
    public class Bill
    {
        public Guid Id { get; set; } = Guid.NewGuid();
        public Guid PatientId { get; set; }
        
        // --- CÁC TRƯỜNG CẦN THIẾT CHO API ---
        public Guid ClinicId { get; set; }
        
        // Biến chính lưu số tiền
        public decimal Amount { get; set; } 

        // [FIX LỖI CS1061] Thêm thuộc tính này để tương thích với code cũ đang gọi .TotalAmount
        // Nó sẽ trỏ trực tiếp vào biến Amount
        public decimal TotalAmount 
        {
            get => Amount;
            private set => Amount = value;
        }
        
        public string Type { get; set; } = "Examination"; // VD: Examination, Medicine
        public Guid ReferenceId { get; set; } // ID tham chiếu
        public DateTime? PaidAt { get; set; } // Thời điểm thanh toán

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        
        // [FIX LỖI CS0200] Chuyển từ 'private set' thành 'set' 
        // để Controller có thể gán: bill.Status = "Paid"
        public string Status { get; set; } = "Pending"; 

        // Giữ lại Items cho logic tính toán chi tiết
        public List<BillItem> Items { get; set; } = new List<BillItem>();

        // Constructor mặc định (bắt buộc)
        public Bill() { }

        // Constructor tiện lợi
        public Bill(Guid patientId, decimal amount, string type, Guid referenceId)
        {
            Id = Guid.NewGuid();
            PatientId = patientId;
            Amount = amount;
            Type = type;
            ReferenceId = referenceId;
            Status = "Pending";
            CreatedAt = DateTime.UtcNow;
        }

        // Hàm tính tổng tiền từ danh sách items
        public void CalculateTotal()
        {
            if (Items != null && Items.Any())
            {
                Amount = Items.Sum(item => item.Price * item.Quantity);
            }
        }

        // Hàm hỗ trợ nghiệp vụ
        public void MarkAsPaid()
        {
            Status = "Paid";
            PaidAt = DateTime.UtcNow;
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