using Aura.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using CloudinaryDotNet;

var builder = WebApplication.CreateBuilder(args);

// 1. Kết nối Database
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");
builder.Services.AddDbContext<AuraDbContext>(options =>
    options.UseNpgsql(connectionString));

// 2. Cấu hình Cloudinary
var cloudName = builder.Configuration["Cloudinary:CloudName"]; // Sửa lại key cho khớp appsettings
var apiKey = builder.Configuration["Cloudinary:ApiKey"];
var apiSecret = builder.Configuration["Cloudinary:ApiSecret"];

if (!string.IsNullOrEmpty(cloudName))
{
    var account = new Account(cloudName, apiKey, apiSecret);
    var cloudinary = new Cloudinary(account);
    builder.Services.AddSingleton(cloudinary);
}

// 3. THÊM CORS (Rất quan trọng để Frontend gọi được Backend)
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll",
        policy =>
        {
            policy.AllowAnyOrigin()
                  .AllowAnyMethod()
                  .AllowAnyHeader();
        });
});

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

// 4. Bật Swagger ở MỌI MÔI TRƯỜNG (Bỏ điều kiện if Development)
app.UseSwagger();
app.UseSwaggerUI();

// 5. Sử dụng CORS
app.UseCors("AllowAll");

// app.UseHttpsRedirection(); // Comment dòng này khi chạy Docker để tránh lỗi SSL certificate nếu chưa cấu hình
app.UseAuthorization();
app.MapControllers();

app.Run();