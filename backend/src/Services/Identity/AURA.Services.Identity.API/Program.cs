using AURA.Services.Identity.Infrastructure;
using AURA.Services.Identity.Application;
using AURA.Services.Identity.Infrastructure.Data;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using System.Text;

var builder = WebApplication.CreateBuilder(args);

// 1. ĐĂNG KÝ SERVICES
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();

// CẤU HÌNH CORS (CHO PHÉP FRONTEND GỌI API)
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowReactApp",
        policy => policy.WithOrigins("http://localhost:3000")
                        .AllowAnyMethod()
                        .AllowAnyHeader());
});

// CẤU HÌNH SWAGGER
builder.Services.AddSwaggerGen(option =>
{
    option.SwaggerDoc("v1", new OpenApiInfo { Title = "AURA Identity API", Version = "v1" });
    option.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        In = ParameterLocation.Header,
        Description = "Nhập 'Bearer {token}'",
        Name = "Authorization",
        Type = SecuritySchemeType.Http,
        BearerFormat = "JWT",
        Scheme = "Bearer"
    });
    option.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        { new OpenApiSecurityScheme { Reference = new OpenApiReference { Type=ReferenceType.SecurityScheme, Id="Bearer" } }, new string[]{} }
    });
});

builder.Services.AddApplication();
builder.Services.AddInfrastructure(builder.Configuration);

// CẤU HÌNH JWT
builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    var secretKey = builder.Configuration["JwtSettings:SecretKey"] 
                    ?? throw new InvalidOperationException("JwtSettings:SecretKey is missing");

    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = builder.Configuration["JwtSettings:Issuer"],
        ValidAudience = builder.Configuration["JwtSettings:Audience"],
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey))
    };
});

builder.Services.AddAuthorization();

var app = builder.Build();

// 2. MIDDLEWARE & MIGRATION & SEEDING (QUAN TRỌNG)
using (var scope = app.Services.CreateScope())
{
    var services = scope.ServiceProvider;
    try
    {
        var context = services.GetRequiredService<AppIdentityDbContext>();
        
        // Gọi hàm Seed Data từ file DbInitializer
        // Hàm này sẽ tự động Migrate DB và thêm Admin/Bác sĩ mẫu
        await DbInitializer.SeedDataAsync(context); 
        
        Console.WriteLine("--> [Identity] Database Inited & Seeded Successfully!");
    }
    catch (Exception ex)
    {
        Console.WriteLine($"--> [Identity] Lỗi khởi tạo DB: {ex.Message}");
    }
}

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

// Bật CORS TRƯỚC Authentication
app.UseCors("AllowReactApp");
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

app.Run();