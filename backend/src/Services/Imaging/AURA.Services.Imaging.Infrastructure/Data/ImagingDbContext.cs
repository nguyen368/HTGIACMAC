using AURA.Services.Imaging.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace AURA.Services.Imaging.Infrastructure.Data;

public class ImagingDbContext : DbContext
{
    public ImagingDbContext(DbContextOptions<ImagingDbContext> options) : base(options) { }

    public DbSet<ImageMetadata> Images { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);
        modelBuilder.Entity<ImageMetadata>().HasKey(x => x.Id);
    }
}