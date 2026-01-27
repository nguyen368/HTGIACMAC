using MassTransit;
using AURA.Services.MedicalRecord.Infrastructure.Data;
using AURA.Services.MedicalRecord.Domain.Entities;
using AURA.Shared.Messaging.Events; 

namespace AURA.Services.MedicalRecord.API.Consumers
{
    // [FIX] Đổi UserRegisteredEvent thành UserRegisteredIntegrationEvent
    public class UserRegisteredConsumer : IConsumer<UserRegisteredIntegrationEvent>
    {
        private readonly MedicalDbContext _context;

        public UserRegisteredConsumer(MedicalDbContext context)
        {
            _context = context;
        }

        // [FIX] Đổi UserRegisteredEvent thành UserRegisteredIntegrationEvent
        public async Task Consume(ConsumeContext<UserRegisteredIntegrationEvent> context)
        {
            var message = context.Message;
            
            var newPatient = new Patient(
                message.UserId,
                message.ClinicId ?? Guid.Empty, // Xử lý nullable nếu cần
                message.FullName,
                DateTime.UtcNow, 
                "Unknown",       
                message.PhoneNumber ?? "N/A", // Xử lý null nếu cần
                "N/A"            
            );

            // Kiểm tra trùng
            var exists = _context.Patients.Any(p => p.UserId == message.UserId);
            if (!exists)
            {
                _context.Patients.Add(newPatient);
                await _context.SaveChangesAsync();
                Console.WriteLine($"--> [Medical] Synced patient: {message.Email}");
            }
        }
    }
}