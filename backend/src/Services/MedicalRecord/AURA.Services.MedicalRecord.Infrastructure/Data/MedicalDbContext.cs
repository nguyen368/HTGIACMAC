using AURA.Services.MedicalRecord.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace AURA.Services.MedicalRecord.Infrastructure.Data;

public class MedicalDbContext : DbContext
{
    public MedicalDbContext(DbContextOptions<MedicalDbContext> options) : base(options)
    {
    }

    // --- 1. Khai báo các bảng (DbSet) ---
    public DbSet<Patient> Patients { get; set; }
    public DbSet<MedicalHistory> MedicalHistories { get; set; } // [NEW] Bảng tiền sử bệnh
    public DbSet<Examination> Examinations { get; set; }        // Bảng lượt khám (giữ nguyên)

    // --- 2. Cấu hình Fluent API ---
    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // === Cấu hình Patient ===
        modelBuilder.Entity<Patient>(entity =>
        {
            entity.HasKey(e => e.Id);
            
            // UserId phải là duy nhất (1 tài khoản chỉ có 1 hồ sơ bệnh nhân)
            entity.HasIndex(e => e.UserId).IsUnique(); 

            entity.Property(e => e.FullName).IsRequired().HasMaxLength(100);
            entity.Property(e => e.PhoneNumber).HasMaxLength(20);

            // [QUAN TRỌNG] Cấu hình quan hệ 1-N: Patient -> MedicalHistory
            entity.HasMany(p => p.MedicalHistories)
                  .WithOne()                       // MedicalHistory không cần navigation property ngược lại Patient
                  .HasForeignKey(m => m.PatientId) // Khóa ngoại bên bảng MedicalHistory
                  .OnDelete(DeleteBehavior.Cascade); // Xóa Patient -> Xóa hết tiền sử bệnh
        });

        // === Cấu hình MedicalHistory ===
        modelBuilder.Entity<MedicalHistory>(entity =>
        {
            entity.HasKey(e => e.Id);

            entity.Property(e => e.Condition)
                  .IsRequired()
                  .HasMaxLength(200); // Tên bệnh không quá 200 ký tự

            entity.Property(e => e.Description)
                  .HasMaxLength(1000); // Mô tả tối đa 1000 ký tự
        });

        // === Cấu hình Examination (Giữ nguyên để không lỗi code cũ) ===
        modelBuilder.Entity<Examination>(entity =>
        {
            entity.HasKey(e => e.Id);
            // Các cấu hình khác cho Examination nếu cần
        });
    }
}