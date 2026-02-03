using MassTransit;
using AURA.Services.Notification.API.Consumers;
using AURA.Services.Notification.API.Hubs;
using AURA.Shared.Messaging.Events; // Bổ sung namespace chứa sự kiện dùng chung
using Microsoft.AspNetCore.SignalR;

var builder = WebApplication.CreateBuilder(args);

// =========================================================================
// 1. CẤU HÌNH DỊCH VỤ CƠ BẢN (SERVICES)
// =========================================================================
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
builder.Services.AddSignalR(); // Kích hoạt SignalR cho thông báo thời gian thực

// =========================================================================
// 2. CẤU HÌNH CORS (FIX LỖI CHẶN KẾT NỐI TỪ FRONTEND)
// =========================================================================
builder.Services.AddCors(options =>
{
    options.AddPolicy("CorsPolicy", policyBuilder => policyBuilder
        // [QUAN TRỌNG]: Phải chỉ định rõ nguồn (Origin), KHÔNG được dùng "*" khi có AllowCredentials
        .WithOrigins("http://localhost:3000", "http://localhost") 
        .AllowAnyMethod()
        .AllowAnyHeader()
        .AllowCredentials()); // BẮT BUỘC có dòng này để SignalR hoạt động với React
});

// =========================================================================
// 3. CẤU HÌNH MASSTRANSIT & RABBITMQ
// =========================================================================
builder.Services.AddMassTransit(x =>
{
    // Đăng ký các Consumer để nghe tin nhắn từ các Service khác
    // 1. Consumer báo tin cho Bệnh nhân (Đã có từ trước)
    x.AddConsumer<DiagnosisDoneConsumer>(); 
    x.AddConsumer<DiagnosisVerifiedConsumer>(); 

    // 2. Consumer báo tin cho Bác sĩ (Khi AI xử lý xong - Mới thêm)
    x.AddConsumer<AnalysisCompletedConsumer>();

    x.UsingRabbitMq((context, cfg) =>
    {
        // Sử dụng định dạng JSON thuần để tương thích dữ liệu giữa C# và Python (AI Core)
        // Lưu ý: Nếu các service C# gửi cho nhau dùng chuẩn MassTransit Envelope, dòng này có thể cần xem xét lại tùy vào Sender.
        // Tuy nhiên tôi giữ nguyên theo yêu cầu của bạn.
        cfg.UseRawJsonSerializer(); 

        cfg.Host(builder.Configuration["RabbitMq:Host"] ?? "rabbitmq", "/", h => {
            h.Username("guest");
            h.Password("guest");
        });

        // Queue báo cho bệnh nhân (Khi bác sĩ đã duyệt kết quả)
        cfg.ReceiveEndpoint("notification-diagnosis-verified", e =>
        {
            e.ConfigureConsumer<DiagnosisVerifiedConsumer>(context);
        });

        // Queue báo cho bác sĩ (Khi AI xử lý xong ảnh để cập nhật Dashboard ngay lập tức)
        cfg.ReceiveEndpoint("notification-ai-analysis-completed", e =>
        {
            e.ConfigureConsumer<AnalysisCompletedConsumer>(context);
        });

        // Tự động cấu hình các Consumer còn lại
        cfg.ConfigureEndpoints(context);
    });
});

var app = builder.Build();

// =========================================================================
// 4. CẤU HÌNH MIDDLEWARE (ĐƯỜNG ỐNG XỬ LÝ)
// =========================================================================

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

// [QUAN TRỌNG]: Thứ tự Middleware
// 1. CORS phải đứng trước Authentication/Authorization
app.UseCors("CorsPolicy");

// 2. Auth
app.UseAuthorization();

// =========================================================================
// 5. ĐĂNG KÝ ROUTE
// =========================================================================

// Map đường dẫn cho Hub SignalR - Frontend sẽ kết nối vào link này: http://localhost:8000/hubs/notifications
app.MapHub<NotificationHub>("/hubs/notifications");

app.MapControllers();

app.Run();