using AURA.Services.Identity.Domain.Entities;

namespace AURA.Services.Identity.Application.Interfaces;

public interface IJwtTokenService
{
    string GenerateToken(User user);
}