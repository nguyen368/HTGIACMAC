using MassTransit;
using AURA.Services.Notification.API.Consumers;
using AURA.Services.Notification.API.Hubs;
using AURA.Shared.Messaging.Events; // Bổ sung để nhận diện Event dùng chung

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
builder.Services.AddSignalR();

// CẤU HÌNH CORS (Giữ nguyên của bạn)
builder.Services.AddCors(options =>
{
    options.AddPolicy("CorsPolicy", policyBuilder => policyBuilder
        .WithOrigins("http://localhost:3000", "http://localhost") 
        .AllowAnyMethod()
        .AllowAnyHeader()
        .AllowCredentials()); 
});

builder.Services.AddMassTransit(x =>
{
    // 1. Consumer báo tin cho Bệnh nhân (Giữ nguyên toàn bộ logic cũ)
    x.AddConsumer<DiagnosisDoneConsumer>(); 
    x.AddConsumer<DiagnosisVerifiedConsumer>(); 

    // 2. [MỚI] Consumer báo tin cho Bác sĩ (Khi AI xử lý xong)
    x.AddConsumer<AnalysisCompletedConsumer>();

    x.UsingRabbitMq((context, cfg) =>
    {
        // Sử dụng định dạng JSON thuần để tương thích giữa các dịch vụ
        cfg.UseRawJsonSerializer(); 

        cfg.Host(builder.Configuration["RabbitMq:Host"] ?? "rabbitmq", "/", h => {
            h.Username("guest");
            h.Password("guest");
        });

        // Queue báo cho bệnh nhân (Logic cũ)
        cfg.ReceiveEndpoint("notification-diagnosis-verified", e =>
        {
            e.ConfigureConsumer<DiagnosisVerifiedConsumer>(context);
        });

        // [MỚI] Queue báo cho bác sĩ để cập nhật kết quả AI lên màn hình real-time
        cfg.ReceiveEndpoint("notification-ai-analysis-completed", e =>
        {
            e.ConfigureConsumer<AnalysisCompletedConsumer>(context);
        });

        cfg.ConfigureEndpoints(context);
    });
});

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors("CorsPolicy");
app.UseAuthorization();

// Đăng ký Hub cho SignalR
app.MapHub<NotificationHub>("/hubs/notifications");
app.MapControllers();

app.Run();