using AURA.Services.Imaging.Application.Interfaces;
using AURA.Services.Imaging.Infrastructure.Data;
using AURA.Services.Imaging.Infrastructure.Services;
using Microsoft.EntityFrameworkCore;
using Prometheus;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using System.Text;
using MassTransit; // THÊM THƯ VIỆN NÀY

var builder = WebApplication.CreateBuilder(args);

// =========================================================================
// 1. ĐĂNG KÝ CÁC DỊCH VỤ (SERVICES)
// =========================================================================

// A. Đăng ký Database (PostgreSQL)
builder.Services.AddDbContext<ImagingDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

// B. Đăng ký HttpClient (Để gọi sang service AI Core Python)
builder.Services.AddHttpClient();

// C. Cấu hình CORS (GIỮ NGUYÊN)
builder.Services.AddCors(options => {
    options.AddPolicy("AllowReactApp", policy => {
        policy.AllowAnyOrigin().AllowAnyMethod().AllowAnyHeader();
    });
});

// D. Đăng ký Service Upload (GIỮ NGUYÊN)
builder.Services.AddScoped<IImageUploader, CloudinaryUploader>(); 

// G. Cấu hình MassTransit RabbitMQ (MỚI THÊM)
builder.Services.AddMassTransit(x => {
    x.UsingRabbitMq((context, cfg) => {
        // Nếu chạy Docker, đổi 'localhost' thành 'aura-rabbitmq'
        cfg.Host("localhost", "/", h => {
            h.Username("guest");
            h.Password("guest");
        });
    });
});

// E. Cấu hình JWT Authentication (GIỮ NGUYÊN)
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

// F. Các dịch vụ API & Swagger (GIỮ NGUYÊN CẤU HÌNH AUTHORIZE)
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c => {
    c.SwaggerDoc("v1", new OpenApiInfo { Title = "AURA Imaging API", Version = "v1" });
    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme {
        Description = "Nhập Token theo định dạng: Bearer {your_token}",
        Name = "Authorization",
        In = ParameterLocation.Header,
        Type = SecuritySchemeType.ApiKey,
        Scheme = "Bearer"
    });
    c.AddSecurityRequirement(new OpenApiSecurityRequirement {
        {
            new OpenApiSecurityScheme {
                Reference = new OpenApiReference { Type = ReferenceType.SecurityScheme, Id = "Bearer" }
            },
            new string[] { }
        }
    });
});

var app = builder.Build();

// =========================================================================
// 2. TỰ ĐỘNG TẠO BẢNG DATABASE (GIỮ NGUYÊN)
// =========================================================================
using (var scope = app.Services.CreateScope()) {
    var services = scope.ServiceProvider;
    try {
        var context = services.GetRequiredService<ImagingDbContext>();
        if (context.Database.GetPendingMigrations().Any()) context.Database.Migrate();
    } catch (Exception ex) { Console.WriteLine($"--> Migration failed: {ex.Message}"); }
}

// =========================================================================
// 3. PIPELINE (MIDDLEWARE) (GIỮ NGUYÊN THỨ TỰ)
// =========================================================================
if (app.Environment.IsDevelopment()) {
    app.UseSwagger();
    app.UseSwaggerUI();
}
app.UseHttpMetrics(); // Prometheus
app.UseCors("AllowReactApp");
app.UseAuthentication(); 
app.UseAuthorization();
app.MapControllers();
app.MapMetrics(); // Prometheus Endpoint
app.Run();