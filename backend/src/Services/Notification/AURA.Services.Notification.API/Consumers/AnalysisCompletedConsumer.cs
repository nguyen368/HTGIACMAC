using MassTransit;
using Microsoft.AspNetCore.SignalR;
using AURA.Services.Notification.API.Hubs;
using AURA.Shared.Messaging.Events;

namespace AURA.Services.Notification.API.Consumers
{
    // Phải khớp với Event bên Medical Record
    public record AnalysisCompletedEvent(Guid ExaminationId, Guid ClinicId, Guid PatientId, string RiskLevel, double RiskScore);

    public class AnalysisCompletedConsumer : IConsumer<AnalysisCompletedEvent>
    {
        private readonly IHubContext<NotificationHub> _hubContext;
        private readonly ILogger<AnalysisCompletedConsumer> _logger;

        public AnalysisCompletedConsumer(IHubContext<NotificationHub> hubContext, ILogger<AnalysisCompletedConsumer> logger)
        {
            _hubContext = hubContext;
            _logger = logger;
        }

        public async Task Consume(ConsumeContext<AnalysisCompletedEvent> context)
        {
            var msg = context.Message;
            string clinicGroup = $"Clinic_{msg.ClinicId}";

            _logger.LogInformation($"[NOTIFY DOCTOR] AI xong ca {msg.ExaminationId}. Gửi tin tới nhóm {clinicGroup}");

            // Gửi SignalR tới Group "Clinic_{ID}"
            await _hubContext.Clients.Group(clinicGroup).SendAsync("ReceiveAiResult", new 
            {
                Type = "AiFinished",
                ExamId = msg.ExaminationId,
                RiskLevel = msg.RiskLevel, 
                RiskScore = msg.RiskScore,
                Message = msg.RiskLevel == "High" ? "⚠️ CẢNH BÁO: Ca bệnh rủi ro cao!" : "Đã có kết quả phân tích."
            });
        }
    }
}