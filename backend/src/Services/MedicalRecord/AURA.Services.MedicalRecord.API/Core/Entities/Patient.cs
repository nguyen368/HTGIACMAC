namespace AURA.Services.MedicalRecord.Core.Entities
{
    public class Patient
    {
        public Guid Id { get; set; }
        public string FullName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty; // Để liên kết với Identity
        public DateTime DateOfBirth { get; set; }
        public string Gender { get; set; } = string.Empty;
        public string PhoneNumber { get; set; } = string.Empty;
        public string Address { get; set; } = string.Empty;
        public string ClinicId { get; set; } = string.Empty;
        
        // Thông tin tiền sử bệnh (Lưu dạng JSONB trong PostgreSQL)
        public string MedicalHistoryJson { get; set; } = "{}"; 
    }
}