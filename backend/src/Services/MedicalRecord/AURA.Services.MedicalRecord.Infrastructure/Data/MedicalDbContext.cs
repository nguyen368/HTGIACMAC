using AURA.Services.MedicalRecord.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace AURA.Services.MedicalRecord.Infrastructure.Data;

// [QUAN TRỌNG] Tên class phải là MedicalDbContext để khớp với Program.cs
public class MedicalDbContext : DbContext 
{
    public MedicalDbContext(DbContextOptions<MedicalDbContext> options) : base(options)
    {
    }

    public DbSet<Patient> Patients { get; set; }
    public DbSet<MedicalHistory> MedicalHistories { get; set; } 
    public DbSet<Examination> Examinations { get; set; }        

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // --- CẤU HÌNH BỆNH NHÂN (Giữ nguyên code cũ + Bổ sung Address/Email) ---
        modelBuilder.Entity<Patient>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.UserId).IsUnique(); 
            entity.Property(e => e.FullName).IsRequired().HasMaxLength(100);
            
            // Cấu hình rõ ràng cho các trường mà bạn hay gặp lỗi NOT NULL
            entity.Property(e => e.PhoneNumber).HasMaxLength(20);
            entity.Property(e => e.Address).HasMaxLength(500); // Cho phép địa chỉ dài
            entity.Property(e => e.Email).HasMaxLength(150);

            entity.HasMany(p => p.MedicalHistories)
                  .WithOne()
                  .HasForeignKey(m => m.PatientId)
                  .OnDelete(DeleteBehavior.Cascade);
        });

        // --- CẤU HÌNH LỊCH SỬ BỆNH (Giữ nguyên code cũ) ---
        modelBuilder.Entity<MedicalHistory>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Condition).IsRequired().HasMaxLength(200);
            entity.Property(e => e.Description).HasMaxLength(1000);
        });

        // --- CẤU HÌNH CA KHÁM (Bổ sung Relationship) ---
        modelBuilder.Entity<Examination>(entity =>
        {
            entity.HasKey(e => e.Id);

            // [QUAN TRỌNG]: Bổ sung cấu hình khóa ngoại để EF Core hiểu mối quan hệ
            // Một Ca khám thuộc về Một Bệnh nhân
            entity.HasOne(e => e.Patient)
                  .WithMany() // Bệnh nhân có nhiều ca khám
                  .HasForeignKey(e => e.PatientId)
                  .OnDelete(DeleteBehavior.Restrict); // Xóa bệnh nhân không tự xóa ca khám (an toàn dữ liệu)
        });
    }
}