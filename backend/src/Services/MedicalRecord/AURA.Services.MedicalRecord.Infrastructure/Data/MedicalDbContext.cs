using AURA.Services.MedicalRecord.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace AURA.Services.MedicalRecord.Infrastructure.Data;

public class MedicalDbContext : DbContext
{
    public MedicalDbContext(DbContextOptions<MedicalDbContext> options) : base(options) { }

    public DbSet<Patient> Patients { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);
        // Cấu hình khóa chính
        modelBuilder.Entity<Patient>().HasKey(x => x.Id);
    }
}