[HttpPost]
public async Task<IActionResult> CreateBill([FromBody] CreateBillRequest request)
{
    // 1. Tạo hóa đơn mới
    var newBill = new Bill
    {
        PatientId = request.PatientId,
        Status = "Pending"
    };

    // 2. Add các dịch vụ vào hóa đơn
    foreach (var item in request.Items)
    {
        newBill.Items.Add(new BillItem
        {
            ServiceName = item.ServiceName,
            Price = item.Price, // Trong thực tế, giá này nên lấy từ DB Bảng Giá (PriceTable)
            Quantity = item.Quantity
        });
    }

    // 3. GỌI LOGIC TÍNH TỔNG TIỀN (Quan trọng!)
    newBill.CalculateTotal();

    // 4. Lưu vào Database
    _context.Bills.Add(newBill);
    await _context.SaveChangesAsync();

    return Ok(newBill);
}

// Class DTO để nhận dữ liệu từ UI
public class CreateBillRequest
{
    public Guid PatientId { get; set; }
    public List<BillItemDto> Items { get; set; }
}
public class BillItemDto 
{
    public string ServiceName { get; set; }
    public decimal Price { get; set; }
    public int Quantity { get; set; }
}