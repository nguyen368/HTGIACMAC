using AURA.Services.Imaging.Application.Interfaces;
using AURA.Services.Imaging.Infrastructure.Data;
using AURA.Services.Imaging.Infrastructure.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using System.Text;

var builder = WebApplication.CreateBuilder(args);

// 1. Đăng ký Database (PostgreSQL)
builder.Services.AddDbContext<ImagingDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

// 2. Đăng ký HttpClient (Để gọi sang service AI Core Python)
builder.Services.AddHttpClient();

// 3. Cấu hình Authentication (JWT) - MỚI THÊM
var jwtSettings = builder.Configuration.GetSection("JwtSettings");
var secretKey = jwtSettings["SecretKey"] ?? "Key_Mac_Dinh_Du_Phong_Cho_Dev_Moi_123456789";
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

// 4. Cấu hình CORS
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

// 5. Đăng ký Cloudinary Service
builder.Services.AddScoped<IImageUploader, CloudinaryUploader>();

// 6. Các dịch vụ API & Swagger
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo { Title = "AURA Imaging API", Version = "v1" });
    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Description = "JWT Authorization header using the Bearer scheme.",
        Name = "Authorization",
        In = ParameterLocation.Header,
        Type = SecuritySchemeType.Http,
        Scheme = "bearer"
    });
    c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference { Type = ReferenceType.SecurityScheme, Id = "Bearer" }
            },
            new List<string>()
        }
    });
});

var app = builder.Build();

// =========================================================================
// 👇👇👇 [ĐOẠN CODE MỚI THÊM] TỰ ĐỘNG TẠO BẢNG DATABASE 👇👇👇
// =========================================================================
using (var scope = app.Services.CreateScope())
{
    var services = scope.ServiceProvider;
    try
    {
        var context = services.GetRequiredService<ImagingDbContext>();
        context.Database.Migrate(); // Tự động chạy lệnh update-database
        Console.WriteLine("--> [Imaging] Đã tự động tạo bảng thành công!");
    }
    catch (Exception ex)
    {
        Console.WriteLine("--> [Imaging] Lỗi tạo bảng: " + ex.Message);
    }
}
// 👆👆👆 [KẾT THÚC ĐOẠN CODE MỚI] 👆👆👆
// =========================================================================


// 7. Middleware Pipeline
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

// app.UseHttpsRedirection(); // Tắt HTTPS ở môi trường dev docker

app.UseCors("AllowReactApp");

// QUAN TRỌNG: Thứ tự phải đúng (Auth -> Autho)
app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();