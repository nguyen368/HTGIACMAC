using Aura.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace Aura.Infrastructure.Persistence
{
    public class AuraDbContext : DbContext
    {
        public AuraDbContext(DbContextOptions<AuraDbContext> options) : base(options)
        {
        }

        public DbSet<User> Users { get; set; }
        public DbSet<Upload> Uploads { get; set; }
        public DbSet<AIResult> AIResults { get; set; }

        public DbSet<Clinic> Clinics { get; set; }
        public DbSet<Doctor> Doctors { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // 1. Cấu hình User 
            modelBuilder.Entity<User>()
                .HasIndex(u => u.Email)
                .IsUnique();

            // 2. Cấu hình Clinic (Phòng khám)
            modelBuilder.Entity<Clinic>(entity =>
            {
                entity.ToTable("Clinics"); // Đặt tên bảng rõ ràng
                entity.HasKey(c => c.Id);
                
                entity.Property(c => c.Name)
                    .IsRequired()
                    .HasMaxLength(200); // Giới hạn độ dài tên phòng khám

                // Thiết lập mối quan hệ 1-N: Một phòng khám có nhiều bác sĩ
                entity.HasMany(c => c.Doctors)
                      .WithOne(d => d.Clinic)
                      .HasForeignKey(d => d.ClinicId)
                      .OnDelete(DeleteBehavior.Cascade); // Xóa phòng khám -> Xóa luôn danh sách bác sĩ
            });

            // 3. Cấu hình Doctor (Bác sĩ)
            modelBuilder.Entity<Doctor>(entity =>
            {
                entity.ToTable("Doctors");
                entity.HasKey(d => d.Id);

                entity.Property(d => d.Specialization)
                    .HasMaxLength(100);

                // Cấu hình liên kết 1-1 hoặc 1-N với User (Tùy logic, ở đây map qua UserId)
                entity.HasOne(d => d.User)
                      .WithMany() // Giả định User không giữ list Doctor, nếu 1-1 thì sửa thành WithOne
                      .HasForeignKey(d => d.UserId)
                      .OnDelete(DeleteBehavior.Restrict); // Xóa bác sĩ không xóa User hệ thống
            });
        }
    }
}