using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Configuration;
using Microsoft.EntityFrameworkCore;
using AURA.Services.Identity.Domain.Repositories;
using AURA.Services.Identity.Infrastructure.Data;
using AURA.Services.Identity.Infrastructure.Repositories;
// Thêm các using mới này để nhận diện Service và Interface
using AURA.Services.Identity.Application.Interfaces; 
using AURA.Services.Identity.Infrastructure.Services; 

namespace AURA.Services.Identity.Infrastructure
{
    public static class DependencyInjection
    {
        public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration configuration)
        {
            // 1. Đăng ký DbContext
            var connectionString = configuration.GetConnectionString("DefaultConnection");
            
            services.AddDbContext<AppIdentityDbContext>(options =>
                options.UseNpgsql(connectionString));

            // 2. Đăng ký Repository
            services.AddScoped<IUserRepository, UserRepository>();

            // 3. ĐĂNG KÝ CÁC SERVICE KHÁC (FIX LỖI CỦA BẠN TẠI ĐÂY)
            // Đăng ký PasswordHasher
            services.AddScoped<IPasswordHasher, PasswordHasher>();

            // Đăng ký JwtTokenService (Khả năng cao bạn cũng sẽ cần cái này cho Login)
            // Nếu bạn đặt tên class là JwtTokenGenerator hay tên khác thì sửa lại cho khớp nhé
            services.AddScoped<IJwtTokenService, JwtTokenService>(); 

            return services;
        }
    }
}