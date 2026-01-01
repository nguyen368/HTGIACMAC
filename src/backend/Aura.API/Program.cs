using Aura.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using CloudinaryDotNet;
using Aura.Application;
// using Aura.Application; // Bỏ comment dòng này nếu bạn có file DependencyInjection trong Application Layer

var builder = WebApplication.CreateBuilder(args);

// ====================================================
// 1. Kết nối Database (Giữ nguyên code của bạn)
// ====================================================
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");
builder.Services.AddDbContext<AuraDbContext>(options =>
    options.UseNpgsql(connectionString));

// ====================================================
// 2. Cấu hình Cloudinary (Giữ nguyên code của bạn)
// ====================================================
var cloudName = builder.Configuration["Cloudinary:CloudName"];
var apiKey = builder.Configuration["Cloudinary:ApiKey"];
var apiSecret = builder.Configuration["Cloudinary:ApiSecret"];

if (!string.IsNullOrEmpty(cloudName))
{
    var account = new Account(cloudName, apiKey, apiSecret);
    var cloudinary = new Cloudinary(account);
    builder.Services.AddSingleton(cloudinary);
}

// ====================================================
// 3. Cấu hình CORS & Services (Kết hợp code mới)
// ====================================================
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// Thêm CORS: Cấu hình cụ thể cho Frontend React (An toàn & Chuẩn hơn AllowAll)
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowReactApp",
        policy =>
        {
            policy.WithOrigins("http://localhost:5173", "http://localhost:5174") // Port mặc định của Vite
                  .AllowAnyHeader()
                  .AllowAnyMethod();
        });
});


var app = builder.Build();

// ====================================================
// 4. Pipeline (Thứ tự rất quan trọng!)
// ====================================================

// Swagger (Giữ logic luôn bật của bạn)
app.UseSwagger();
app.UseSwaggerUI();

// Kích hoạt CORS (Phải đặt TRƯỚC Authentication/Authorization)
app.UseCors("AllowReactApp");

// app.UseHttpsRedirection(); // Giữ comment theo ý bạn

// Kích hoạt xác thực & phân quyền
app.UseAuthentication(); // <--- MỚI: Bắt buộc có để API đọc được Token JWT
app.UseAuthorization();

app.MapControllers();

app.Run();