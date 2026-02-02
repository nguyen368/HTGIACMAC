using MassTransit;
using AURA.Services.Notification.API.Consumers;
using AURA.Services.Notification.API.Hubs;
using AURA.Shared.Messaging.Events; // Bổ sung để nhận diện Event dùng chung
using Microsoft.AspNetCore.SignalR;
using Prometheus;

var builder = WebApplication.CreateBuilder(args);

// --- 1. CẤU HÌNH DỊCH VỤ CƠ BẢN ---
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
builder.Services.AddSignalR(); // Kích hoạt SignalR cho thông báo thời gian thực

// --- 2. CẤU HÌNH CORS (Dứt điểm lỗi chặn kết nối từ Frontend) ---
builder.Services.AddCors(options =>
{
    options.AddPolicy("CorsPolicy", policyBuilder => policyBuilder
        .WithOrigins("http://localhost:3000", "http://localhost") // Cho phép React App
        .AllowAnyMethod()
        .AllowAnyHeader()
        .AllowCredentials()); // BẮT BUỘC có dòng này để SignalR hoạt động
});

// --- 3. CẤU HÌNH MASSTRANSIT & RABBITMQ ---
builder.Services.AddMassTransit(x =>
{
    // Đăng ký các Consumer để nghe tin nhắn từ các Service khác
    // 1. Consumer báo tin cho Bệnh nhân
    x.AddConsumer<DiagnosisDoneConsumer>(); 
    x.AddConsumer<DiagnosisVerifiedConsumer>(); 

    // 2. Consumer báo tin cho Bác sĩ (Khi AI xử lý xong)
    x.AddConsumer<AnalysisCompletedConsumer>();

    x.UsingRabbitMq((context, cfg) =>
    {
        // Sử dụng định dạng JSON thuần để tương thích dữ liệu giữa C# và Python (AI Core)
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

        // Tự động cấu hình các Consumer còn lại (như DiagnosisDoneConsumer)
        cfg.ConfigureEndpoints(context);
    });
});

var app = builder.Build();

// --- 4. CẤU HÌNH MIDDLEWARE (ĐƯỜNG ỐNG XỬ LÝ) ---
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

// Thứ tự quan trọng: CORS phải đứng trước Authorization
app.UseCors("CorsPolicy");
app.UseAuthorization();

// --- 5. ĐĂNG KÝ ROUTE ---
// Map đường dẫn cho Hub SignalR - Frontend sẽ kết nối vào link này
app.MapHub<NotificationHub>("/hubs/notifications");
app.UseHttpMetrics();
app.MapControllers();
app.MapMetrics();
app.Run();