using AURA.Services.Imaging.Application.Interfaces;
using AURA.Services.Imaging.Infrastructure.Data;
using AURA.Services.Imaging.Infrastructure.Services; 
using Microsoft.EntityFrameworkCore;
using MassTransit;
using System.Text.Json;
using Prometheus;

var builder = WebApplication.CreateBuilder(args);

// =================================================================================
// 1. CẤU HÌNH DỊCH VỤ (SERVICES)
// =================================================================================

// [FIX DỨT ĐIỂM LỖI MIGRATION]
// Khai báo rõ ràng MigrationsAssembly để EF Core tìm thấy các file trong Infrastructure
builder.Services.AddDbContext<ImagingDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection"),
    x => x.MigrationsAssembly("AURA.Services.Imaging.Infrastructure")));

// 2. Cấu hình MassTransit (RabbitMQ) - Giữ nguyên logic Publisher của bạn
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
// Giữ nguyên fix lỗi 500 thiếu IHttpClientFactory của bạn
builder.Services.AddHttpClient(); 
builder.Services.AddScoped<IImageUploader, CloudinaryUploader>(); 

// [SỬA LỖI INVALID DATE] - Giữ nguyên cấu hình camelCase chuẩn React
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.PropertyNamingPolicy = JsonNamingPolicy.CamelCase;
        options.JsonSerializerOptions.PropertyNameCaseInsensitive = true;
    });

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

// =================================================================================
// 2. CẤU HÌNH PIPELINE (MIDDLEWARE)
// =================================================================================

// [FIX 404 SWAGGER] Cấu hình RoutePrefix để khớp với port 5003
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(c => {
        c.SwaggerEndpoint("/swagger/v1/swagger.json", "AURA Imaging API V1");
        c.RoutePrefix = "swagger"; // Truy cập tại: http://localhost:5003/swagger/index.html
    });
}

// Bỏ UseHttpsRedirection nếu chạy trong Docker để tránh lỗi Certificate
// app.UseHttpsRedirection(); 

app.UseAuthorization();
app.MapControllers();

// [CẬP NHẬT LOG] Tự động Migrate DB khi khởi chạy
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<ImagingDbContext>();
    try 
    {
        Console.WriteLine("---- IMAGING SERVICE: Đang kiểm tra và cập nhật Database ----");
        db.Database.Migrate(); 
        Console.WriteLine("---- IMAGING SERVICE: Migration THÀNH CÔNG! ----");
    }
    catch (Exception ex)
    {
        Console.WriteLine($"---- IMAGING SERVICE LỖI MIGRATION: {ex.Message} ----");
    }
}

app.UseHttpMetrics();
app.MapMetrics();
app.Run();