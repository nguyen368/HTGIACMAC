using MassTransit;
using AURA.Services.Notification.API.Consumers;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// --- BẮT ĐẦU CẤU HÌNH RABBITMQ ---
builder.Services.AddMassTransit(x =>
{
    // 1. Đăng ký Consumer (Người nhận tin)
    x.AddConsumer<DiagnosisDoneConsumer>();

    // 2. Cấu hình kết nối tới Docker RabbitMQ
    x.UsingRabbitMq((context, cfg) =>
    {
        // --- DÒNG QUAN TRỌNG NHẤT (Kiểm tra kỹ dòng này) ---
        cfg.UseRawJsonSerializer(); 
        // ----------------------------------------------------

        cfg.Host("rabbitmq", "/", h => {
            h.Username("guest");
            h.Password("guest");
        });

        cfg.ConfigureEndpoints(context);
    });
});
// --- KẾT THÚC CẤU HÌNH ---

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseAuthorization();
app.MapControllers();

app.Run();