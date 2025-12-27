using Aura.Domain.Common;
using System.ComponentModel.DataAnnotations.Schema;

namespace Aura.Domain.Entities
{
    public class MedicalReport : BaseEntity
    {
        public Guid AIResultId { get; set; }
        
        [ForeignKey("AIResultId")]
        public AIResult? AIResult { get; set; } // Thêm ? cho phép null tạm thời

        public Guid DoctorId { get; set; }
        
        [ForeignKey("DoctorId")]
        public Doctor? Doctor { get; set; } // Thêm ?

        // Khởi tạo giá trị mặc định để tránh warning
        public string FinalRiskLevel { get; set; } = string.Empty; 
        public string DoctorNotes { get; set; } = string.Empty;
    }
}