using MassTransit; 
using AURA.Services.Notification.API.Consumers;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddControllers(); // Quan trọng: Kích hoạt Controller
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// --- CẤU HÌNH MASSTRANSIT (RABBITMQ) ---
builder.Services.AddMassTransit(x =>
{
    // Đăng ký Consumer để nhận tin nhắn
    x.AddConsumer<DiagnosisDoneConsumer>();

    x.UsingRabbitMq((context, cfg) =>
    {
        // Cấu hình kết nối tới RabbitMQ trong Docker
        // Host: "rabbitmq" (tên service trong docker-compose)
        cfg.Host("rabbitmq", "/", h => {
            h.Username("guest");
            h.Password("guest");
        });

        // Tự động tạo hàng đợi (Queue)
        cfg.ConfigureEndpoints(context);
    });
});
// -------------------------------------------

var app = builder.Build();
var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();
app.UseAuthorization();
app.MapControllers(); // Quan trọng: Map các route

app.Run();