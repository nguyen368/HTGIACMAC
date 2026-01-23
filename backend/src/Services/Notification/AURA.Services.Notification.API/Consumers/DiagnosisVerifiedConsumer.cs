using MassTransit;
using Microsoft.AspNetCore.SignalR;
using AURA.Services.Notification.API.Hubs;
using System.Threading.Tasks;
using System;
using Microsoft.Extensions.Logging;

namespace AURA.Services.Notification.API.Consumers
{
    // 1. Định nghĩa lại Event để khớp với bên Medical Service gửi sang
    public record DiagnosisVerifiedEvent(Guid ExaminationId, Guid PatientId, string FinalDiagnosis, string DoctorNotes, DateTime VerifiedAt);

    // 2. Class Consumer xử lý tin nhắn
    public class DiagnosisVerifiedConsumer : IConsumer<DiagnosisVerifiedEvent>
    {
        private readonly IHubContext<NotificationHub> _hubContext;
        private readonly ILogger<DiagnosisVerifiedConsumer> _logger;

        // Inject Hub để gửi SignalR
        public DiagnosisVerifiedConsumer(IHubContext<NotificationHub> hubContext, ILogger<DiagnosisVerifiedConsumer> logger)
        {
            _hubContext = hubContext;
            _logger = logger;
        }

        public async Task Consume(ConsumeContext<DiagnosisVerifiedEvent> context)
        {
            var msg = context.Message;
            var userId = msg.PatientId.ToString();

            _logger.LogInformation($"[NOTIFY] Bác sĩ đã duyệt xong ca {msg.ExaminationId}. Đang gửi tin nhắn cho BN {userId}...");

            // Logic gửi thông báo Real-time tới đúng User (Bệnh nhân)
            // Tìm ConnectionId của user này trong Hub
            var connectionId = NotificationHub.GetConnectionId(userId);
            
            if (!string.IsNullOrEmpty(connectionId))
            {
                // Gửi sự kiện "ReceiveMedicalResult" xuống Frontend React
                await _hubContext.Clients.Client(connectionId).SendAsync("ReceiveMedicalResult", new 
                {
                    Type = "DoctorVerified",
                    ExamId = msg.ExaminationId,
                    Result = msg.FinalDiagnosis,
                    Message = "Bác sĩ đã có kết luận cho hồ sơ của bạn. Vui lòng kiểm tra lịch sử."
                });
                _logger.LogInformation($"--> Đã gửi SignalR thành công tới {connectionId}");
            }
            else
            {
                _logger.LogWarning($"User {userId} hiện đang Offline. Không thể gửi thông báo Real-time.");
            }
        }
    }
}