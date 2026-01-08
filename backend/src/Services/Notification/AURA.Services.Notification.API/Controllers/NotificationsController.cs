using Microsoft.AspNetCore.Mvc;

namespace AURA.Services.Notification.API.Controllers;

[ApiController]
[Route("api/notifications")]
public class NotificationsController : ControllerBase
{
    [HttpPost("send-email")]
    public IActionResult SendEmail(string to, string subject, string body)
    {
        // Giả lập việc gửi mail bằng cách in ra màn hình Console (Log)
        Console.WriteLine($"=============================================");
        Console.WriteLine($"[EMAIL SENT] To: {to}");
        Console.WriteLine($"Subject: {subject}");
        Console.WriteLine($"Body: {body}");
        Console.WriteLine($"Timestamp: {DateTime.UtcNow}");
        Console.WriteLine($"=============================================");
        
        return Ok(new { status = "Sent", timestamp = DateTime.UtcNow });
    }
}