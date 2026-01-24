using MassTransit;
using AURA.Services.MedicalRecord.Domain.Entities;
using AURA.Services.MedicalRecord.Infrastructure.Data;
using AURA.Shared.Messaging.Events;
using Microsoft.EntityFrameworkCore;

namespace AURA.Services.MedicalRecord.API.Consumers
{
    public class UserRegisteredConsumer : IConsumer<UserRegisteredIntegrationEvent>
    {
        private readonly MedicalDbContext _context;
        private readonly ILogger<UserRegisteredConsumer> _logger;

        public UserRegisteredConsumer(MedicalDbContext context, ILogger<UserRegisteredConsumer> logger)
        {
            _context = context;
            _logger = logger;
        }

        public async Task Consume(ConsumeContext<UserRegisteredIntegrationEvent> context)
        {
            var msg = context.Message;
            _logger.LogInformation($"[SYNC] Nhận thông tin người dùng mới: {msg.FullName} ({msg.Role})");

            if (msg.Role == "Patient")
            {
                var existing = await _context.Patients.AnyAsync(p => p.UserId == msg.UserId);
                if (!existing)
                {
                    // Tạo hồ sơ bệnh nhân mặc định để không bị lỗi 404 khi vào trang Profile
                    var patient = new Patient(
                        msg.UserId, 
                        msg.ClinicId ?? Guid.Empty, 
                        msg.FullName, 
                        DateTime.SpecifyKind(new DateTime(2000, 1, 1), DateTimeKind.Utc), 
                        "Other", 
                        "", 
                        "Chưa cập nhật");
                        
                    _context.Patients.Add(patient);
                    await _context.SaveChangesAsync();
                }
            }
        }
    }
}