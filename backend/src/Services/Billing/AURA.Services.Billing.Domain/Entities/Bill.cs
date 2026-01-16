namespace AURA.Services.Billing.Domain.Entities
{
    public class Bill
    {
        public Guid Id { get; set; } = Guid.NewGuid();
        public Guid PatientId { get; set; } // ID bệnh nhân
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public string Status { get; set; } = "Pending"; // Pending, Paid, Cancelled

        // Tổng tiền (Sẽ được tính tự động)
        public decimal TotalAmount { get; private set; }

        // Danh sách dịch vụ trong hóa đơn (Cái bạn đang thiếu)
        public List<BillItem> Items { get; set; } = new List<BillItem>();

        // Hàm tính tổng tiền (Logic nghiệp vụ)
        public void CalculateTotal()
        {
            TotalAmount = Items.Sum(item => item.Price * item.Quantity);
        }
    }

    // Class con lưu chi tiết (Thêm class này vào cùng file hoặc tạo file mới)
    public class BillItem
    {
        public Guid Id { get; set; } = Guid.NewGuid();
        public string ServiceName { get; set; } = string.Empty; // Tên dịch vụ
        public decimal Price { get; set; } // Đơn giá
        public int Quantity { get; set; } = 1; // Số lượng
    }
}