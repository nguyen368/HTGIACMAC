using AURA.Services.MedicalRecord.Application.DTOs;
using AURA.Services.MedicalRecord.Infrastructure.Data;
using FluentValidation;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.Text;

var builder = WebApplication.CreateBuilder(args);

// ====================================================
// 1. ĐĂNG KÝ DỊCH VỤ (REGISTER SERVICES)
// ====================================================

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// A. Kết nối Database (PostgreSQL)
builder.Services.AddDbContext<MedicalDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

// B. Đăng ký Validator (FluentValidation)
// Lưu ý: Nếu dòng này báo lỗi đỏ, hãy đảm bảo bạn đã có class UpdatePatientProfileRequest
// Nếu chưa có, bạn có thể tạm thời comment dòng này lại.
try {
    builder.Services.AddValidatorsFromAssemblyContaining<UpdatePatientProfileRequest>();
} catch { /* Bỏ qua nếu chưa có validator */ }

// C. Cấu hình Authentication (JWT)
var jwtKey = builder.Configuration["Jwt:Key"] ?? "SuperSecretKey_AuraProject_2026_Minimum32Bytes";

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.RequireHttpsMetadata = false;
        options.SaveToken = true;
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey)),
            ValidateIssuer = false,
            ValidateAudience = false
        };
    });

// D. Cấu hình CORS (QUAN TRỌNG CHO FRONTEND)
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy => 
    {
        policy.AllowAnyOrigin()   // Chấp nhận mọi nguồn (React, Mobile...)
              .AllowAnyMethod()   // Chấp nhận GET, POST, PUT, DELETE
              .AllowAnyHeader();  // Chấp nhận mọi Header
    });
});

var app = builder.Build();

// ====================================================
// 2. MIDDLEWARE PIPELINE (Thứ tự cực kỳ quan trọng)
// ====================================================

// 1. Swagger
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

// 2. CORS (BẮT BUỘC PHẢI ĐỨNG TRƯỚC AUTH)
app.UseCors(); 

// 3. Auth
app.UseAuthentication();
app.UseAuthorization();

// 4. Controller
app.MapControllers();

app.Run();