using Microsoft.Extensions.DependencyInjection;
using System.Reflection;

namespace AURA.Services.Identity.Application
{
    public static class DependencyInjection
    {
        public static IServiceCollection AddApplication(this IServiceCollection services)
        {
            // Đăng ký MediatR (để xử lý các lệnh Command/Query sau này)
            services.AddMediatR(cfg => cfg.RegisterServicesFromAssembly(Assembly.GetExecutingAssembly()));

            // Sau này nếu có AutoMapper hay Validators thì đăng ký thêm ở đây
            
            return services;
        }
    }
}