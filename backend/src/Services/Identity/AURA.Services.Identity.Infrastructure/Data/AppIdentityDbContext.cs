using Microsoft.EntityFrameworkCore;
using AURA.Services.Identity.Domain.Entities;

namespace AURA.Services.Identity.Infrastructure.Data;

public class AppIdentityDbContext : DbContext
{
    public AppIdentityDbContext(DbContextOptions<AppIdentityDbContext> options) : base(options) { }

    // Bảng người dùng (Đã có sẵn)
    public DbSet<User> Users { get; set; }

    // --- CODE MỚI: Bảng Phòng khám ---
    public DbSet<Clinic> Clinics { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Cấu hình cho bảng User
        modelBuilder.Entity<User>(entity =>
        {
            entity.HasKey(u => u.Id);
            entity.HasIndex(u => u.Email).IsUnique();
            entity.Property(u => u.Username).IsRequired();
            // ClinicId là Guid? nên mặc định cho phép null (cho SuperAdmin/Patient)
        });

        // --- CODE MỚI: Cấu hình cho bảng Clinic ---
        modelBuilder.Entity<Clinic>(entity =>
        {
            entity.HasKey(c => c.Id);
            entity.Property(c => c.Name).IsRequired().HasMaxLength(255);
            entity.Property(c => c.Status).HasDefaultValue("Pending");
            entity.Property(c => c.CreatedAt).HasDefaultValueSql("CURRENT_TIMESTAMP");
        });
    }
}