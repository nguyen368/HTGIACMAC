using Aura.Domain.Common;
using System.ComponentModel.DataAnnotations.Schema;

namespace Aura.Domain.Entities
{
    public class Doctor : BaseEntity
    {
        public string Specialization { get; set; } = string.Empty;
        public string LicenseNumber { get; set; } = string.Empty;

        // Liên kết với User
        public Guid UserId { get; set; }
        [ForeignKey("UserId")]
        public User? User { get; set; }

        // Liên kết với Clinic (Thêm phần này cho khớp logic)
        public Guid? ClinicId { get; set; }
        [ForeignKey("ClinicId")]
        public Clinic? Clinic { get; set; }
    }
}