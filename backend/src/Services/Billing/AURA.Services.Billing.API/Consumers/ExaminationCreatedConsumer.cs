using MassTransit;
using AURA.Services.Billing.Domain.Entities; // Giả sử đã có entity Bill
using AURA.Services.Billing.Infrastructure.Data;

namespace AURA.Services.Billing.API.Consumers
{
    // Record Event từ Medical Record (Cần định nghĩa hoặc share library)
    public record ExaminationCreatedEvent(Guid ExaminationId, Guid PatientId, Guid ClinicId, DateTime CreatedAt);

    public class ExaminationCreatedConsumer : IConsumer<ExaminationCreatedEvent>
    {
        private readonly BillingDbContext _context;
        private readonly ILogger<ExaminationCreatedConsumer> _logger;

        public ExaminationCreatedConsumer(BillingDbContext context, ILogger<ExaminationCreatedConsumer> logger)
        {
            _context = context;
            _logger = logger;
        }

        public async Task Consume(ConsumeContext<ExaminationCreatedEvent> context)
        {
            var msg = context.Message;
            _logger.LogInformation($"[BILLING] Tạo hóa đơn cho ca khám {msg.ExaminationId}");

            // Logic: Tính phí 1 lượt khám
            var bill = new Bill
            {
                Id = Guid.NewGuid(),
                PatientId = msg.PatientId,
                ClinicId = msg.ClinicId,
                Amount = 50000, // Ví dụ: 50k VND/lượt
                Status = "Pending", // Chờ thanh toán
                Type = "ExaminationFee",
                CreatedAt = DateTime.UtcNow,
                ReferenceId = msg.ExaminationId // Link tới Exam
            };

            _context.Bills.Add(bill);
            await _context.SaveChangesAsync();
            
            // Có thể bắn event BillCreatedEvent nếu cần
        }
    }
}