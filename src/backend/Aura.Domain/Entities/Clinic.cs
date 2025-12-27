using Aura.Domain.Common;
using System.Collections.Generic; // Cần dòng này cho ICollection

namespace Aura.Domain.Entities
{
    public class Clinic : BaseEntity
    {
        public string Name { get; set; } = string.Empty;
        public string Address { get; set; } = string.Empty;
        public string Phone { get; set; } = string.Empty;

       
        // Thêm quan hệ: 1 Phòng khám có nhiều Bác sĩ
        public ICollection<Doctor> Doctors { get; set; } = new List<Doctor>();
    }
}