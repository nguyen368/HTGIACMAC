using AURA.Services.Imaging.Application.Interfaces;
using AURA.Services.Imaging.Infrastructure.Data;
using AURA.Services.Imaging.Infrastructure.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using System.Text;
using MassTransit;
using Prometheus;
using Microsoft.AspNetCore.Http.Features; // Thêm thư viện này để chỉnh dung lượng file

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
            policy.WithOrigins("http://localhost:3000") // Cổng React của bạn
                  .AllowAnyMethod()
                  .AllowAnyHeader();
        });
});

// C. CẤU HÌNH CHO PHÉP UPLOAD FILE LỚN (Sửa lỗi Network Error)
builder.Services.Configure<FormOptions>(options =>
{
    options.MultipartBodyLengthLimit = 52428800; // Cho phép file lên tới 50MB
});

// D. Cloudinary Service
builder.Services.AddScoped<IImageUploader, CloudinaryUploader>();

// E. MassTransit RabbitMQ
builder.Services.AddMassTransit(x => {
    x.UsingRabbitMq((context, cfg) => {
        cfg.Host("aura-rabbitmq", "/", h => { 
            h.Username("guest");
            h.Password("guest");
        });
    });
});

// F. ĐỒNG BỘ JWT AUTHENTICATION (Khớp với Identity Service 2024)
// Sửa key này để khớp với file appsettings.json bạn đã gửi lúc trước
var jwtSettings = builder.Configuration.GetSection("JwtSettings");
var secretKey = jwtSettings["SecretKey"] ?? "Day_La_Key_Bi_Mat_Cua_AURA_Project_2024_!!!";
var key = Encoding.UTF8.GetBytes(secretKey);

builder.Services.AddAuthentication(options => {
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options => {
    options.TokenValidationParameters = new TokenValidationParameters {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = jwtSettings["Issuer"] ?? "AURA.Identity",
        ValidAudience = jwtSettings["Audience"] ?? "AURA.Client",
        IssuerSigningKey = new SymmetricSecurityKey(key),
        ClockSkew = TimeSpan.Zero
    };
});

// G. Swagger
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
// 2. MIGRATION & MIDDLEWARE (THỨ TỰ CỰC KỲ QUAN TRỌNG)
// =========================================================================

using (var scope = app.Services.CreateScope()) {
    var services = scope.ServiceProvider;
    try {
        var context = services.GetRequiredService<ImagingDbContext>();
        if (context.Database.GetPendingMigrations().Any()) context.Database.Migrate();
    } catch (Exception ex) { Console.WriteLine($"--> Migration failed: {ex.Message}"); }
}

// 1. Prometheus Metrics (Đặt đầu tiên để đo lường toàn bộ)
app.UseHttpMetrics(); 

if (app.Environment.IsDevelopment()) {
    app.UseSwagger();
    app.UseSwaggerUI();
}

// 2. KÍCH HOẠT CORS (BẮT BUỘC đặt trước Authentication)
// Để trình duyệt có thể hỏi thăm (Preflight) trước khi upload ảnh
app.UseCors("AllowReactApp");

app.UseRouting(); // Xác định luồng yêu cầu

// 3. XÁC THỰC & PHÂN QUYỀN
app.UseAuthentication(); 
app.UseAuthorization();

// 4. ĐỊNH TUYẾN CONTROLLER & METRICS
app.MapControllers();
app.MapMetrics(); 

app.Run();