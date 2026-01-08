using AURA.Services.Imaging.Application.Interfaces;
using AURA.Services.Imaging.Infrastructure.Data;
using AURA.Services.Imaging.Infrastructure.Services;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

// 1. Đăng ký Database (PostgreSQL)
builder.Services.AddDbContext<ImagingDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

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

app.UseHttpsRedirection();
app.UseAuthorization();
app.MapControllers();

app.Run();