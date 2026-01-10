using AURA.Shared.Kernel.Wrapper;
using MediatR;

namespace AURA.Services.Identity.Application.Users.Commands.RegisterUser
{
    public class RegisterUserCommand : IRequest<Result<Guid>>
    {
        public string Username { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string? FullName { get; set; }
        
        // Thêm dòng này (cho phép null để mặc định là Patient):
        public string? Role { get; set; } 
    }
}