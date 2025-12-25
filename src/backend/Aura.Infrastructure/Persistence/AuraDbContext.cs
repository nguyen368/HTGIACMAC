using Aura.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace Aura.Infrastructure.Persistence
{
    public class AuraDbContext : DbContext
    {
        public AuraDbContext(DbContextOptions<AuraDbContext> options) : base(options)
        {
        }

        // Khai báo 3 bảng chúng ta vừa tạo
        public DbSet<User> Users { get; set; }
        public DbSet<Upload> Uploads { get; set; }
        public DbSet<AIResult> AIResults { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // Cấu hình thêm: Email của User phải là duy nhất (không trùng nhau)
            modelBuilder.Entity<User>()
                .HasIndex(u => u.Email)
                .IsUnique();
        }
    }
}