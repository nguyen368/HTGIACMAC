using AURA.Services.MedicalRecord.API.Consumers;
using AURA.Services.MedicalRecord.Infrastructure.Data; 
using MassTransit;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

// 1. Cấu hình Database
builder.Services.AddDbContext<MedicalDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

// 2. Cấu hình MassTransit (RabbitMQ)
builder.Services.AddMassTransit(x =>
{
    // Đăng ký Consumer để nhận sự kiện upload ảnh
    x.AddConsumer<ImageUploadedConsumer>();

    x.UsingRabbitMq((context, cfg) =>
    {
        cfg.Host(builder.Configuration["RabbitMq:Host"] ?? "rabbitmq", "/", h =>
        {
            h.Username(builder.Configuration["RabbitMq:Username"] ?? "guest");
            h.Password(builder.Configuration["RabbitMq:Password"] ?? "guest");
        });

        // Định nghĩa Queue nhận tin
        cfg.ReceiveEndpoint("medical-record-image-uploaded", e =>
        {
            e.ConfigureConsumer<ImageUploadedConsumer>(context);
        });
        
        cfg.ConfigureEndpoints(context);
    });
});

// 3. Đăng ký HttpClient để gọi AI Core Service
builder.Services.AddHttpClient();

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

// 4. Middleware Pipeline
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

// app.UseHttpsRedirection(); // Tắt HTTPS trong Docker nội bộ
app.UseAuthorization();
app.MapControllers();

// Auto Migrate DB
try 
{
    using (var scope = app.Services.CreateScope())
    {
        var db = scope.ServiceProvider.GetRequiredService<MedicalDbContext>();
        db.Database.Migrate();
    }
}
catch (Exception ex)
{
    Console.WriteLine($"[ERROR] DB Migration Failed: {ex.Message}");
}

app.Run();