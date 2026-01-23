using AURA.Services.MedicalRecord.Application.DTOs;
using AURA.Services.MedicalRecord.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.OpenApi.Models;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using FluentValidation;
using FluentValidation.AspNetCore;
using AURA.Services.MedicalRecord.Application.Validators;

var builder = WebApplication.CreateBuilder(args);

// ====================================================
// 1. ĐĂNG KÝ DỊCH VỤ (REGISTER SERVICES)
// ====================================================

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();

// A. Kết nối Database (PostgreSQL)
builder.Services.AddDbContext<MedicalDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

// B. Cấu hình CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowReactApp",
        policy =>
        {
            policy.WithOrigins("http://localhost:3000") 
                  .AllowAnyHeader()
                  .AllowAnyMethod();
        });
});

// C. Cấu hình Authentication (Đã sửa lỗi đồng bộ JWT)
var jwtSettings = builder.Configuration.GetSection("JwtSettings");
var secretKey = jwtSettings["SecretKey"] ?? "Day_La_Key_Bi_Mat_Cua_AURA_Project_2024_!!!";
var key = Encoding.UTF8.GetBytes(secretKey);

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.RequireHttpsMetadata = false;
    options.SaveToken = true;
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = jwtSettings["Issuer"],
        ValidAudience = jwtSettings["Audience"],
        IssuerSigningKey = new SymmetricSecurityKey(key),
        ClockSkew = TimeSpan.Zero 
    };
});

// D. Validator
builder.Services.AddScoped<IValidator<UpdatePatientProfileRequest>, UpdatePatientProfileValidator>();
builder.Services.AddFluentValidationAutoValidation();
try {
    builder.Services.AddValidatorsFromAssemblyContaining<UpdatePatientProfileValidator>();
} catch { }

// E. Swagger
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo { Title = "AURA MedicalRecord API", Version = "v1" });
    
    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Description = "Nhập token theo định dạng: Bearer {token}",
        Name = "Authorization",
        In = ParameterLocation.Header,
        Type = SecuritySchemeType.ApiKey,
        Scheme = "Bearer"
    });

    c.AddSecurityRequirement(new OpenApiSecurityRequirement()
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id = "Bearer"
                },
                Scheme = "oauth2",
                Name = "Bearer",
                In = ParameterLocation.Header,
            },
            new List<string>()
        }
    });
});

var app = builder.Build();

// TỰ ĐỘNG TẠO BẢNG DATABASE
using (var scope = app.Services.CreateScope())
{
    var services = scope.ServiceProvider;
    try
    {
        var context = services.GetRequiredService<MedicalDbContext>();
        context.Database.Migrate();
        Console.WriteLine("--> [MedicalRecord] Đã tự động tạo bảng thành công!");
    }
    catch (Exception ex)
    {
        Console.WriteLine("--> [MedicalRecord] Lỗi tạo bảng: " + ex.Message);
    }
}

// ====================================================
// 2. MIDDLEWARE PIPELINE
// ====================================================

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors("AllowReactApp");
app.UseHttpsRedirection();

// QUAN TRỌNG: Authentication PHẢI đứng TRƯỚC Authorization
app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();