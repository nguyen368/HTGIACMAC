using AURA.Services.MedicalRecord.Infrastructure.Data;
using AURA.Services.MedicalRecord.API.Consumers;
using Microsoft.EntityFrameworkCore;
using MassTransit;
using FluentValidation;
using FluentValidation.AspNetCore;
using AURA.Services.MedicalRecord.Application.DTOs;
using AURA.Services.MedicalRecord.Application.Validators;
using Microsoft.IdentityModel.Tokens; // [BẮT BUỘC] Thêm dòng này để dùng SymmetricSecurityKey
using System.Text; // [BẮT BUỘC] Thêm dòng này để dùng Encoding

var builder = WebApplication.CreateBuilder(args);

// 1. Database
builder.Services.AddDbContext<MedicalDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

// 2. HttpClient
builder.Services.AddHttpClient();

// 3. MassTransit (RabbitMQ)
builder.Services.AddMassTransit(x =>
{
    x.AddConsumer<UserRegisteredConsumer>();
    x.AddConsumer<ImageUploadedConsumer>();

    x.UsingRabbitMq((context, cfg) =>
    {
        cfg.Host("rabbitmq", "/", h => {
            h.Username("guest");
            h.Password("guest");
        });

        cfg.ReceiveEndpoint("medical-record-service", e =>
        {
            e.ConfigureConsumer<UserRegisteredConsumer>(context);
            e.ConfigureConsumer<ImageUploadedConsumer>(context);
        });
    });
});

// 4. Controllers
builder.Services.AddControllers();

// 5. FluentValidation
builder.Services.AddValidatorsFromAssemblyContaining<UpdatePatientProfileValidator>();

// 6. Swagger
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// --- [FIX 401] CẤU HÌNH AUTHENTICATION MẠNH MẼ HƠN ---
// Thay vì phụ thuộc vào Authority (dễ lỗi trong Docker), ta dùng trực tiếp Secret Key để xác thực.
var jwtSettings = builder.Configuration.GetSection("JwtSettings");
var secretKey = jwtSettings["Key"]; // Lấy key từ appsettings.json

builder.Services.AddAuthentication("Bearer")
    .AddJwtBearer("Bearer", options =>
    {
        options.RequireHttpsMetadata = false;
        options.SaveToken = true;
        options.TokenValidationParameters = new TokenValidationParameters
        {
            // Tự kiểm tra chữ ký bằng Key chung
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey)),

            // Tắt kiểm tra Issuer/Audience để tránh lỗi lệch URL (localhost vs docker-container)
            ValidateIssuer = false,
            ValidateAudience = false,
            
            // Chấp nhận độ lệch thời gian nhỏ (tránh lỗi nếu giờ server bị lệch vài giây)
            ClockSkew = TimeSpan.Zero 
        };
    });

var app = builder.Build();

// Auto-migrate
using (var scope = app.Services.CreateScope())
{
    var dbContext = scope.ServiceProvider.GetRequiredService<MedicalDbContext>();
    dbContext.Database.Migrate();
}

app.UseSwagger();
app.UseSwaggerUI();

app.UseAuthentication(); // Xác thực (Kiểm tra Token)
app.UseAuthorization();  // Phân quyền (Kiểm tra Role)

app.MapControllers();

app.Run();