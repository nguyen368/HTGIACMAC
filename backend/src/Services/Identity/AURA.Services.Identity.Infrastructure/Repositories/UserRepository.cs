using AURA.Services.Identity.Domain.Entities;
using AURA.Services.Identity.Domain.Repositories;
using AURA.Services.Identity.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace AURA.Services.Identity.Infrastructure.Repositories;

public class UserRepository : IUserRepository
{
    private readonly AppIdentityDbContext _context;
    public UserRepository(AppIdentityDbContext context) => _context = context;

    public async Task<User?> GetByEmailAsync(string email) => 
        await _context.Users.FirstOrDefaultAsync(u => u.Email == email);

    public async Task AddAsync(User user)
    {
        await _context.Users.AddAsync(user);
        await _context.SaveChangesAsync();
    }

    public async Task<bool> ExistsAsync(string email) => 
        await _context.Users.AnyAsync(u => u.Email == email);
}