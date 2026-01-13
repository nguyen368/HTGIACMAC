using AURA.Services.Imaging.Application.Interfaces;
using AURA.Services.Imaging.Infrastructure.Data;
using AURA.Services.Imaging.Infrastructure.Services;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

// 1. Đăng ký Database (PostgreSQL)
builder.Services.AddDbContext<ImagingDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

// --- [THÊM MỚI] CẤU HÌNH CORS (Để Frontend gọi được) ---
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowReactApp",
        policy =>
        {
            policy.WithOrigins("http://localhost:3000") // Cho phép React App
                  .AllowAnyMethod()
                  .AllowAnyHeader();
        });
});
// ------------------------------------------------------

// 2. Đăng ký Cloudinary Service (DI)
builder.Services.AddScoped<IImageUploader, CloudinaryUploader>();

// 3. Các dịch vụ cơ bản API
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

// 4. Middleware
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

// --- [QUAN TRỌNG] TẮT HTTPS REDIRECTION (Tránh lỗi Network Error) ---
// app.UseHttpsRedirection(); 
// (Mình đã comment dòng trên lại để code chạy ổn định ở môi trường dev)
// --------------------------------------------------------------------

// --- [THÊM MỚI] KÍCH HOẠT CORS (Phải đặt trước Auth/MapControllers) ---
app.UseCors("AllowReactApp");
// ---------------------------------------------------------------------

app.UseAuthorization();
app.MapControllers();

app.Run();