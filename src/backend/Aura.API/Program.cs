using Aura.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using CloudinaryDotNet; // Thêm dòng này

var builder = WebApplication.CreateBuilder(args);

// 1. Kết nối Database
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");
builder.Services.AddDbContext<AuraDbContext>(options =>
    options.UseNpgsql(connectionString));

// --- THÊM ĐOẠN NÀY: Cấu hình Cloudinary ---
var cloudName = builder.Configuration["Cloudinary:CloudName"];
var apiKey = builder.Configuration["Cloudinary:ApiKey"];
var apiSecret = builder.Configuration["Cloudinary:ApiSecret"];

if (!string.IsNullOrEmpty(cloudName))
{
    var account = new Account(cloudName, apiKey, apiSecret);
    var cloudinary = new Cloudinary(account);
    builder.Services.AddSingleton(cloudinary); // Đăng ký dịch vụ để dùng ở Controller
}
// ------------------------------------------

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();
app.UseAuthorization();
app.MapControllers();

app.Run();