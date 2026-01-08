using AURA.Shared.Kernel.CQRS;
using AURA.Shared.Kernel.Wrapper;

namespace AURA.Services.Identity.Application.Users.Commands.RegisterUser;

public record RegisterUserCommand(string Email, string Password, string FullName, string Role) 
    : ICommand<Result<Guid>>;