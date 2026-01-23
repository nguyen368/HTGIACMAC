using Microsoft.AspNetCore.SignalR;
using System.Collections.Concurrent;

namespace AURA.Services.Notification.API.Hubs
{
    public class NotificationHub : Hub
    {
        // Lưu user connection
        private static readonly ConcurrentDictionary<string, string> _userConnections = new();

        // [MỚI] Cho phép Client tham gia vào "Kênh" (Room) của Clinic
        public async Task JoinClinicChannel(string clinicId)
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, $"Clinic_{clinicId}");
        }

        // [MỚI] Rời kênh
        public async Task LeaveClinicChannel(string clinicId)
        {
            await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"Clinic_{clinicId}");
        }

        public override Task OnConnectedAsync()
        {
            var userId = Context.GetHttpContext()?.Request.Query["userId"].ToString();
            if (!string.IsNullOrEmpty(userId))
            {
                _userConnections[userId] = Context.ConnectionId;
            }
            return base.OnConnectedAsync();
        }

        public override Task OnDisconnectedAsync(Exception? exception)
        {
            var userId = _userConnections.FirstOrDefault(x => x.Value == Context.ConnectionId).Key;
            if (userId != null)
            {
                _userConnections.TryRemove(userId, out _);
            }
            return base.OnDisconnectedAsync(exception);
        }

        public static string? GetConnectionId(string userId)
        {
            _userConnections.TryGetValue(userId, out var connectionId);
            return connectionId;
        }
    }
}