using AURA.Services.Identity.Infrastructure;
using AURA.Services.Identity.Application;
using AURA.Services.Identity.Infrastructure.Data; // Cần dòng này để gọi DbContext
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;              // Cần dòng này để gọi .Migrate()
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using System.Text;

var builder = WebApplication.CreateBuilder(args);

// ==================================================================
// 1. ĐĂNG KÝ SERVICES (DEPENDENCY INJECTION)
// ==================================================================

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();

// --- [FIX 1] CẤU HÌNH CORS (CHO PHÉP REACT GỌI API) ---
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowReactApp",
        policy => policy.WithOrigins("http://localhost:3000") // Chỉ cho phép Frontend Port 3000
                        .AllowAnyMethod()
                        .AllowAnyHeader());
});
// --------------------------------------------------------

// --- CẤU HÌNH SWAGGER (CÓ NÚT AUTHORIZE) ---
builder.Services.AddSwaggerGen(option =>
{
    option.SwaggerDoc("v1", new OpenApiInfo { Title = "AURA Identity API", Version = "v1" });
    
    // Cấu hình nút nhập Token (Bearer)
    option.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        In = ParameterLocation.Header,
        Description = "Nhập 'Bearer {token}' vào ô bên dưới",
        Name = "Authorization",
        Type = SecuritySchemeType.Http,
        BearerFormat = "JWT",
        Scheme = "Bearer"
    });

    option.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference { Type=ReferenceType.SecurityScheme, Id="Bearer" }
            },
            new string[]{}
        }
    });
});

// Load các lớp từ Application & Infrastructure Layer
builder.Services.AddApplication();
builder.Services.AddInfrastructure(builder.Configuration);

// --- CẤU HÌNH XÁC THỰC (JWT) ---
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

// ==================================================================
// 2. MIDDLEWARE (THỨ TỰ RẤT QUAN TRỌNG)
// ==================================================================

// --- [FIX 2] TỰ ĐỘNG CHẠY MIGRATION (TẠO DATABASE) ---
using (var scope = app.Services.CreateScope())
{
    var services = scope.ServiceProvider;
    try
    {
        var context = services.GetRequiredService<AppIdentityDbContext>();
        // Lệnh này sẽ tự động tạo bảng nếu chưa có
        if (context.Database.GetPendingMigrations().Any())
        {
            context.Database.Migrate();
        }
        Console.WriteLine("--> [Identity] Database Migration thành công!");
    }
    catch (Exception ex)
    {
        Console.WriteLine($"--> [Identity] Lỗi Migration: {ex.Message}");
    }
}
// -----------------------------------------------------

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

// --- [FIX 3] TẮT HTTPS REDIRECTION TRONG DOCKER ---
// app.UseHttpsRedirection(); // <--- Comment dòng này để tránh lỗi SSL
// --------------------------------------------------

// Kích hoạt CORS (Phải đặt trước Auth)
app.UseCors("AllowReactApp");

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();