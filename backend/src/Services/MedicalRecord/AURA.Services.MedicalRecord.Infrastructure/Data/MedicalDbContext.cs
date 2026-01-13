using AURA.Services.MedicalRecord.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace AURA.Services.MedicalRecord.Infrastructure.Data;

public class MedicalDbContext : DbContext
{
    public MedicalDbContext(DbContextOptions<MedicalDbContext> options) : base(options) { }

    public DbSet<Patient> Patients { get; set; }
    public DbSet<Examination> Examinations { get; set; }
    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);
        // Cấu hình khóa chính
        modelBuilder.Entity<Patient>().HasKey(x => x.Id);
        modelBuilder.Entity<Examination>().HasKey(x => x.Id);
        // Định nghĩa: Một Examination bắt buộc phải có PatientId
    modelBuilder.Entity<Examination>()
        .HasOne<Patient>()      // Nó liên quan đến Patient
        .WithMany()             // Một Patient có nhiều Exam (nhưng ta không khai báo List<Exam> trong Patient nên để trống)
        .HasForeignKey(x => x.PatientId) // Khóa ngoại là PatientId
        .OnDelete(DeleteBehavior.Cascade); // Nếu xóa Patient -> Xóa luôn lịch sử khám
    }
}