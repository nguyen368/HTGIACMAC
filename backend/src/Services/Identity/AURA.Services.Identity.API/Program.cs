using AURA.Services.Identity.Application.Interfaces;
using AURA.Services.Identity.Domain.Repositories;
using AURA.Services.Identity.Infrastructure.Data;
using AURA.Services.Identity.Infrastructure.Repositories;
using AURA.Services.Identity.Infrastructure.Services;
using Microsoft.EntityFrameworkCore;
using System.Reflection;

var builder = WebApplication.CreateBuilder(args);

// 1. Database Context
builder.Services.AddDbContext<AppIdentityDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

// 2. Đăng ký MediatR (Xử lý Command/Query)
// Quét toàn bộ assembly của tầng Application để tìm Handler
var applicationAssembly = typeof(AURA.Services.Identity.Application.Users.Commands.RegisterUser.RegisterUserCommand).Assembly;
builder.Services.AddMediatR(cfg => cfg.RegisterServicesFromAssembly(applicationAssembly));

// 3. Đăng ký các Services hạ tầng (QUAN TRỌNG)
builder.Services.AddScoped<IUserRepository, UserRepository>();
builder.Services.AddScoped<IPasswordHasher, PasswordHasher>();
builder.Services.AddScoped<IJwtTokenService, JwtTokenService>();

// 4. API Controllers & Swagger
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

// 5. Middleware Pipeline
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();
app.UseAuthorization();
app.MapControllers();

app.Run();