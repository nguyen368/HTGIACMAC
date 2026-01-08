using AURA.Services.Billing.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace AURA.Services.Billing.Infrastructure.Data;

public class BillingDbContext : DbContext
{
    public BillingDbContext(DbContextOptions<BillingDbContext> options) : base(options) { }

    public DbSet<Bill> Bills { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);
        modelBuilder.Entity<Bill>().HasKey(x => x.Id);
    }
}