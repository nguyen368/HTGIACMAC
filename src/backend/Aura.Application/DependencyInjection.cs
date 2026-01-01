using Microsoft.Extensions.DependencyInjection;
using System.Reflection;

namespace Aura.Application
{
    public static class DependencyInjection
    {
        public static IServiceCollection AddApplication(this IServiceCollection services)
        {
            // Tự động đăng ký tất cả các MediatR handlers, Validators, AutoMapper trong project này
            // (Nếu sau này bạn cài MediatR hoặc AutoMapper thì code này sẽ tự nhận)
            
            // Ví dụ đăng ký AutoMapper (cần cài package AutoMapper.Extensions.Microsoft.DependencyInjection)
            // services.AddAutoMapper(Assembly.GetExecutingAssembly());

            // Ví dụ đăng ký MediatR (cần cài package MediatR)
            // services.AddMediatR(cfg => cfg.RegisterServicesFromAssembly(Assembly.GetExecutingAssembly()));

            return services;
        }
    }
}