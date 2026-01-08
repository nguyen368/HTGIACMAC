using Microsoft.EntityFrameworkCore;
using AURA.Services.Identity.Domain.Entities;

namespace AURA.Services.Identity.Infrastructure.Data;

public class AppIdentityDbContext : DbContext
{
    public AppIdentityDbContext(DbContextOptions<AppIdentityDbContext> options) : base(options) { }

    public DbSet<User> Users { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<User>().HasIndex(u => u.Email).IsUnique();
        base.OnModelCreating(modelBuilder);
    }
}