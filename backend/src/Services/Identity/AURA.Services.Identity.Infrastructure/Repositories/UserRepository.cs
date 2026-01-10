using System.Threading; // Cần thêm dòng này cho CancellationToken
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using AURA.Services.Identity.Domain.Entities;
using AURA.Services.Identity.Domain.Repositories;
using AURA.Services.Identity.Infrastructure.Data;

namespace AURA.Services.Identity.Infrastructure.Repositories
{
    public class UserRepository : IUserRepository
    {
        private readonly AppIdentityDbContext _context;

        public UserRepository(AppIdentityDbContext context)
        {
            _context = context;
        }

        // --- Các hàm cũ ---
        public async Task<User?> GetByEmailAsync(string email)
        {
            return await _context.Users
                .FirstOrDefaultAsync(u => u.Email == email);
        }

        public async Task<bool> ExistsAsync(string email)
        {
            return await _context.Users
                .AnyAsync(u => u.Email == email);
        }

        // --- CÁC HÀM MỚI BỔ SUNG ĐỂ SỬA LỖI ---

        // 1. Hàm thêm User mới
        public async Task AddAsync(User user)
        {
            await _context.Users.AddAsync(user);
            await _context.SaveChangesAsync();
        }

        // 2. Hàm tìm User theo Username (có CancellationToken)
        public async Task<User?> GetByUsernameAsync(string username, CancellationToken cancellationToken)
        {
            // LƯU Ý: Nếu biến 'u.Username' báo lỗi đỏ, hãy thử đổi thành 'u.UserName' (chữ N viết hoa)
            // tùy thuộc vào cách bạn đặt tên trong Entity User.
            return await _context.Users
                .FirstOrDefaultAsync(u => u.Username == username, cancellationToken);
        }
    }
}