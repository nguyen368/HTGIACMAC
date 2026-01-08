using AURA.Shared.Kernel.Primitives;

namespace AURA.Services.Billing.Domain.Entities;

public class Bill : AggregateRoot
{
    public Guid PatientId { get; private set; }
    public decimal Amount { get; private set; }
    public string Status { get; private set; } // Pending, Paid
    public DateTime CreatedAt { get; private set; }

    public Bill(Guid patientId, decimal amount)
    {
        Id = Guid.NewGuid();
        PatientId = patientId;
        Amount = amount;
        Status = "Pending";
        CreatedAt = DateTime.UtcNow;
    }

    // Constructor rỗng cho EF Core
    private Bill() { }
}