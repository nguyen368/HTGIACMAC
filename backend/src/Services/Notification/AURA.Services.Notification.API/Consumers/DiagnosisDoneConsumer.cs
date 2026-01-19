using MassTransit;
using AURA.Services.Notification.API.IntegrationEvents;
using System.Threading.Tasks;
using System;

namespace AURA.Services.Notification.API.Consumers
{
    
    public class DiagnosisDoneConsumer : IConsumer<DiagnosisDone>
    {
        public Task Consume(ConsumeContext<DiagnosisDone> context)
        {
            var msg = context.Message;
            // Log ra console để check
            Console.WriteLine($"[RABBITMQ RECEIVE] >>> Bác sĩ {msg.DoctorName} đã khám xong cho BN {msg.PatientId}. Kết quả: {msg.Result}");
            return Task.CompletedTask;
        }
    }
}