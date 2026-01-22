using AURA.Shared.Kernel.Primitives;

namespace AURA.Services.Identity.Domain.Entities
{
    public class Clinic : Entity
    {
        private Clinic() { }

        public Clinic(string name, string address, string licenseUrl)
        {
            Id = Guid.NewGuid();
            Name = name;
            Address = address;
            BusinessLicenseUrl = licenseUrl;
            Status = "Pending"; // Mặc định chờ duyệt
            CreatedAt = DateTime.UtcNow;
        }

        public string Name { get; private set; } = string.Empty;
        public string Address { get; private set; } = string.Empty;
        public string BusinessLicenseUrl { get; private set; } = string.Empty;
        public string Status { get; private set; } = "Pending"; 
        public DateTime CreatedAt { get; private set; }

        public void Approve() => Status = "Active";
        public void Reject() => Status = "Rejected";
    }
}