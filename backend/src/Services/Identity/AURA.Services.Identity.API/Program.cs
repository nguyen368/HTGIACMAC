using AURA.Services.Identity.Infrastructure;
using AURA.Services.Identity.Application;
using AURA.Services.Identity.Infrastructure.Data;
using AURA.Services.Identity.API.Services; 
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using System.Text;
using MassTransit;
using Prometheus;

var builder = WebApplication.CreateBuilder(args);

// =================================================================================
// 1. ĐĂNG KÝ SERVICES
// =================================================================================

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();

// Đăng ký FirebaseAuthService
builder.Services.AddScoped<FirebaseAuthService>();

// [GIỮ NGUYÊN] CẤU HÌNH MASSTRANSIT (RABBITMQ)
builder.Services.AddMassTransit(x =>
{
    x.UsingRabbitMq((context, cfg) =>
    {
        cfg.Host(builder.Configuration["RabbitMq:Host"] ?? "rabbitmq", "/", h => {
            h.Username(builder.Configuration["RabbitMq:Username"] ?? "guest");
            h.Password(builder.Configuration["RabbitMq:Password"] ?? "guest");
        });
        cfg.ConfigureEndpoints(context);
    });
});

// [GIỮ NGUYÊN] CẤU HÌNH CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowReactApp",
        policy => policy.WithOrigins("http://localhost:3000")
                        .AllowAnyMethod()
                        .AllowAnyHeader());
});

// [GIỮ NGUYÊN] CẤU HÌNH SWAGGER CHI TIẾT
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
        { 
            new OpenApiSecurityScheme { 
                Reference = new OpenApiReference { Type=ReferenceType.SecurityScheme, Id="Bearer" } 
            }, 
            new string[]{} 
        }
    });
});

builder.Services.AddApplication();

// [CẬP NHẬT] ĐĂNG KÝ INFRASTRUCTURE VÀ FIX LỖI MIGRATION ASSEMBLY
// Đảm bảo trong hàm AddInfrastructure hoặc tại đây, UseNpgsql trỏ đúng về project Infrastructure
builder.Services.AddInfrastructure(builder.Configuration);

// CẤU HÌNH JWT - Đảm bảo Secret Key đồng bộ với các Service khác
builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    // Sử dụng Secret Key đồng bộ để các Service có thể giải mã Token của nhau
    var secretKey = builder.Configuration["JwtSettings:SecretKey"] 
                    ?? "Day_La_Key_Bi_Mat_Cua_AURA_Project_2024_!!!"; 

    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = builder.Configuration["JwtSettings:Issuer"] ?? "AURA.Identity",
        ValidAudience = builder.Configuration["JwtSettings:Audience"] ?? "AURA.Client",
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey)),
        ClockSkew = TimeSpan.Zero
    };
});

builder.Services.AddAuthorization();

var app = builder.Build();

// =================================================================================
// 2. MIDDLEWARE & AUTOMATIC MIGRATION
// =================================================================================

// [QUAN TRỌNG] Tự động cập nhật Database ngay khi Identity Service khởi động
using (var scope = app.Services.CreateScope())
{
    var services = scope.ServiceProvider;
    try
    {
        var context = services.GetRequiredService<AppIdentityDbContext>();
        
        Console.WriteLine("--> [Identity] Đang kiểm tra và thực hiện Migration...");
        await context.Database.MigrateAsync();
        
        await DbInitializer.SeedDataAsync(context); 
        Console.WriteLine("--> [Identity] Database Inited & Seeded Successfully!");
    }
    catch (Exception ex)
    {
        Console.WriteLine($"--> [Identity] LỖI KHỞI TẠO DB: {ex.Message}");
    }
}

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(c => {
        c.SwaggerEndpoint("/swagger/v1/swagger.json", "AURA Identity API V1");
        c.RoutePrefix = "swagger"; 
    });
}

app.UseHttpMetrics();
app.UseCors("AllowReactApp");
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();
app.MapMetrics();
app.Run();