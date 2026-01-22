using AURA.Services.Imaging.Application.Interfaces;
using AURA.Services.Imaging.Infrastructure.Data;
using AURA.Services.Imaging.Infrastructure.Services;
using Microsoft.EntityFrameworkCore;
// --- CÁC THƯ VIỆN CẦN THIẾT (PHẢI CÓ) ---
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using System.Text;
using MassTransit;
using Prometheus;

var builder = WebApplication.CreateBuilder(args);

// =========================================================================
// 1. ĐĂNG KÝ CÁC DỊCH VỤ (SERVICES)
// =========================================================================

// A. Database (PostgreSQL)
builder.Services.AddDbContext<ImagingDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

// B. HttpClient & CORS
builder.Services.AddHttpClient();
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowReactApp",
        policy =>
        {
            policy.WithOrigins("http://localhost:3000")
                  .AllowAnyMethod()
                  .AllowAnyHeader();
        });
});

// C. Cloudinary Service
builder.Services.AddScoped<IImageUploader, CloudinaryUploader>();

// D. Cấu hình MassTransit RabbitMQ (QUAN TRỌNG: Để RabbitMQ nhảy số)
builder.Services.AddMassTransit(x => {
    x.UsingRabbitMq((context, cfg) => {
        cfg.Host("aura-rabbitmq", "/", h => { 
            h.Username("guest");
            h.Password("guest");
        });
    });
});

// E. Cấu hình JWT Authentication (Để nút Authorize hoạt động)
var jwtKey = builder.Configuration["Jwt:Key"] ?? "AuraSystem_Super_Secret_Key_2025"; 
builder.Services.AddAuthentication(options => {
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options => {
    options.TokenValidationParameters = new TokenValidationParameters {
        ValidateIssuer = false,
        ValidateAudience = false,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey))
    };
});

// F. Swagger với nút Authorize (Ổ khóa)
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c => {
    c.SwaggerDoc("v1", new OpenApiInfo { Title = "AURA Imaging API", Version = "v1" });
    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme {
        Description = "Nhập Token: Bearer {your_token}",
        Name = "Authorization",
        In = ParameterLocation.Header,
        Type = SecuritySchemeType.ApiKey,
        Scheme = "Bearer"
    });
    c.AddSecurityRequirement(new OpenApiSecurityRequirement {
        { new OpenApiSecurityScheme { Reference = new OpenApiReference { Type = ReferenceType.SecurityScheme, Id = "Bearer" } }, new string[] { } }
    });
});

var app = builder.Build();

// =========================================================================
// 2. MIGRATION & MIDDLEWARE
// =========================================================================

using (var scope = app.Services.CreateScope()) {
    var services = scope.ServiceProvider;
    try {
        var context = services.GetRequiredService<ImagingDbContext>();
        if (context.Database.GetPendingMigrations().Any()) context.Database.Migrate();
    } catch (Exception ex) { Console.WriteLine($"--> Migration failed: {ex.Message}"); }
}

if (app.Environment.IsDevelopment()) {
    app.UseSwagger();
    app.UseSwaggerUI();
}

// Prometheus Metrics (Phải đặt TRƯỚC các middleware khác)
app.UseHttpMetrics(); 

app.UseCors("AllowReactApp");

// THỨ TỰ QUAN TRỌNG: Authentication trước Authorization
app.UseAuthentication(); 
app.UseAuthorization();

app.MapControllers();
app.MapMetrics(); // Endpoint cho Prometheus lấy dữ liệu

app.Run();