using AURA.Services.Identity.Domain.Entities;
using AURA.Shared.Kernel.CQRS; 
using MediatR;
using AURA.Shared.Kernel.Wrapper; 

namespace AURA.Services.Identity.Application.Users.Commands.RegisterUser;

public class RegisterUserCommand : IRequest<Result<Guid>>
{
    // [FIX] Thêm trường Username để Handler không bị lỗi
    public string Username { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public string? PhoneNumber { get; set; }
    public string Role { get; set; } = "Patient";
    public Guid? ClinicId { get; set; }
}