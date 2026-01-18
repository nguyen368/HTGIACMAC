using AURA.Services.Identity.Domain.Entities;

namespace AURA.Services.Identity.Domain.Repositories;

public interface IUserRepository
{
    Task<User?> GetByEmailAsync(string email);
    Task AddAsync(User user);
    Task<bool> ExistsAsync(string email);
    Task<User?> GetByUsernameAsync(string username, CancellationToken cancellationToken = default);
    
    // --- HÀM MỚI: Cho phép lấy danh sách toàn bộ người dùng ---
    Task<IEnumerable<User>> GetAllAsync(CancellationToken cancellationToken = default);
}