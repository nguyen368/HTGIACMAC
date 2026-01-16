using AURA.Services.Imaging.Application.Interfaces;
using AURA.Services.Imaging.Infrastructure.Data;
using AURA.Services.Imaging.Infrastructure.Services;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

// 1. Đăng ký Database (PostgreSQL)
builder.Services.AddDbContext<ImagingDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

// --- [QUAN TRỌNG] Đăng ký HttpClient (Để gọi sang service AI Core Python) ---
builder.Services.AddHttpClient();
// ----------------------------------------------------------------------------

// --- [QUAN TRỌNG] Cấu hình CORS (Cho phép Frontend gọi vào) ---
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowReactApp",
        policy =>
        {
            policy.WithOrigins("http://localhost:3000") // Cho phép Frontend React
                  .AllowAnyMethod()
                  .AllowAnyHeader();
        });
});
// --------------------------------------------------------------

// 2. Đăng ký Cloudinary Service (Dependency Injection)
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

// --- [CHÚ Ý] Tắt HTTPS Redirection để tránh lỗi SSL ở môi trường dev ---
// app.UseHttpsRedirection(); 
// ----------------------------------------------------------------------

// --- [QUAN TRỌNG] Kích hoạt CORS (Đặt trước Auth/MapControllers) ---
app.UseCors("AllowReactApp");
// -------------------------------------------------------------------

app.UseAuthorization();
app.MapControllers();

app.Run();