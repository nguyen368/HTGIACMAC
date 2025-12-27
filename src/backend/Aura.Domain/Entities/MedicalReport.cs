using Aura.Domain.Common;

namespace Aura.Domain.Entities
{
    // Báo cáo y tế chính thức do bác sĩ xác nhận
    public class MedicalReport : BaseEntity
    {
        public Guid AIResultId { get; set; }
        public virtual AIResult AIResult { get; set; } // Foreign Key

        public Guid DoctorId { get; set; }
        public virtual User Doctor { get; set; }

        public string FinalRiskLevel { get; set; } // "Low", "Medium", "High"
        public string DoctorNotes { get; set; }    // Lời dặn dò
        public DateTime VerifiedAt { get; set; } = DateTime.UtcNow;
    }
}