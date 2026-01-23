using MassTransit;
using AURA.Services.Notification.API.Consumers;
using AURA.Services.Notification.API.Hubs;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
builder.Services.AddSignalR();

// Cấu hình CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("CorsPolicy", builder => builder
        .WithOrigins("http://localhost:3000", "http://localhost") 
        .AllowAnyMethod()
        .AllowAnyHeader()
        .AllowCredentials()); 
});

builder.Services.AddMassTransit(x =>
{
    // 1. Consumer báo tin cho Bệnh nhân (Cũ)
    x.AddConsumer<DiagnosisDoneConsumer>(); // Hoặc DiagnosisVerifiedConsumer tùy tên file cũ của bạn
    x.AddConsumer<DiagnosisVerifiedConsumer>(); // Tôi add cả 2 để chắc chắn, bạn có thể xóa cái nào ko dùng

    // 2. [MỚI] Consumer báo tin cho Bác sĩ (AI xong)
    x.AddConsumer<AnalysisCompletedConsumer>();

    x.UsingRabbitMq((context, cfg) =>
    {
        cfg.UseRawJsonSerializer(); 

        cfg.Host(builder.Configuration["RabbitMq:Host"] ?? "rabbitmq", "/", h => {
            h.Username("guest");
            h.Password("guest");
        });

        // Queue báo cho bệnh nhân
        cfg.ReceiveEndpoint("notification-diagnosis-verified", e =>
        {
            e.ConfigureConsumer<DiagnosisVerifiedConsumer>(context);
        });

        // [MỚI] Queue báo cho bác sĩ
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

app.MapHub<NotificationHub>("/hubs/notifications");
app.MapControllers();

app.Run();