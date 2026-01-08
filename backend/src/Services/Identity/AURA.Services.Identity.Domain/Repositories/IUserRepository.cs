using AURA.Services.Identity.Domain.Entities;

namespace AURA.Services.Identity.Domain.Repositories;

public interface IUserRepository
{
    Task<User?> GetByEmailAsync(string email);
    Task AddAsync(User user);
    Task<bool> ExistsAsync(string email);
}