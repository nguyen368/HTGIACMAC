using Microsoft.AspNetCore.SignalR;
using System.Collections.Concurrent;

namespace AURA.Services.Notification.API.Hubs
{
    public class NotificationHub : Hub
    {
        // Lưu trữ danh sách kết nối: Key là UserId, Value là ConnectionId
        private static readonly ConcurrentDictionary<string, string> _userConnections = new();

        // [MỚI] Cho phép Client tham gia vào "Kênh" (Room) của Clinic
        // Khi Bác sĩ đăng nhập, Frontend sẽ gọi hàm này với ClinicId của họ
        public async Task JoinClinicChannel(string clinicId)
        {
            string groupName = $"Clinic_{clinicId}";
            await Groups.AddToGroupAsync(Context.ConnectionId, groupName);
            
            // Log để kiểm tra trong Console Docker
            Console.WriteLine($"--> [SignalR] Connection {Context.ConnectionId} đã tham gia nhóm {groupName}");
        }

        // [MỚI] Rời kênh khi chuyển trang hoặc đăng xuất
        public async Task LeaveClinicChannel(string clinicId)
        {
            await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"Clinic_{clinicId}");
        }

        public override Task OnConnectedAsync()
        {
            // Lấy userId từ chuỗi query (ví dụ: ?userId=abc)
            var userId = Context.GetHttpContext()?.Request.Query["userId"].ToString();
            if (!string.IsNullOrEmpty(userId))
            {
                _userConnections[userId] = Context.ConnectionId;
                Console.WriteLine($"--> [SignalR] Người dùng {userId} đã kết nối ({Context.ConnectionId})");
            }
            return base.OnConnectedAsync();
        }

        public override Task OnDisconnectedAsync(Exception? exception)
        {
            var userId = _userConnections.FirstOrDefault(x => x.Value == Context.ConnectionId).Key;
            if (userId != null)
            {
                _userConnections.TryRemove(userId, out _);
                Console.WriteLine($"--> [SignalR] Người dùng {userId} đã ngắt kết nối.");
            }
            return base.OnDisconnectedAsync(exception);
        }

        // Hàm hỗ trợ lấy ConnectionId nếu cần gửi tin nhắn cá nhân (Private Message)
        public static string? GetConnectionId(string userId)
        {
            _userConnections.TryGetValue(userId, out var connectionId);
            return connectionId;
        }
    }
}