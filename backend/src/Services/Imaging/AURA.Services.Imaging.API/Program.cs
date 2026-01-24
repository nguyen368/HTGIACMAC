using AURA.Services.Imaging.Application.Interfaces;
using AURA.Services.Imaging.Infrastructure.Data;
using AURA.Services.Imaging.Infrastructure.Services; 
using Microsoft.EntityFrameworkCore;
using MassTransit;

var builder = WebApplication.CreateBuilder(args);

// 1. Cấu hình Database (PostgreSQL)
builder.Services.AddDbContext<ImagingDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

// 2. Cấu hình MassTransit (RabbitMQ) - Đóng vai trò Publisher
builder.Services.AddMassTransit(x =>
{
    x.UsingRabbitMq((context, cfg) =>
    {
        cfg.Host(builder.Configuration["RabbitMq:Host"] ?? "rabbitmq", "/", h =>
        {
            h.Username(builder.Configuration["RabbitMq:Username"] ?? "guest");
            h.Password(builder.Configuration["RabbitMq:Password"] ?? "guest");
        });
        cfg.ConfigureEndpoints(context);
    });
});

// 3. Đăng ký các Service (Dependency Injection)
builder.Services.AddScoped<IImageUploader, CloudinaryUploader>(); 

// Các cấu hình cơ bản của Web API
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var builderApp = builder.Build(); // Đổi tên biến tránh trùng lặp nếu có logic phức tạp sau này

// 4. Pipeline
if (builderApp.Environment.IsDevelopment())
{
    builderApp.UseSwagger();
    builderApp.UseSwaggerUI();
}

builderApp.UseHttpsRedirection();
builderApp.UseAuthorization();
builderApp.MapControllers();

// Tự động Migrate DB khi khởi chạy
using (var scope = builderApp.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<ImagingDbContext>();
    db.Database.Migrate();
}

builderApp.Run();