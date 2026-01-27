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

        modelBuilder.Entity<Patient>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.UserId).IsUnique(); 
            entity.Property(e => e.FullName).IsRequired().HasMaxLength(100);
            entity.Property(e => e.PhoneNumber).HasMaxLength(20);
            entity.HasMany(p => p.MedicalHistories)
                  .WithOne()
                  .HasForeignKey(m => m.PatientId)
                  .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<MedicalHistory>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Condition).IsRequired().HasMaxLength(200);
            entity.Property(e => e.Description).HasMaxLength(1000);
        });

        modelBuilder.Entity<Examination>(entity =>
        {
            entity.HasKey(e => e.Id);
        });
    }
}