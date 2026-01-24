namespace AURA.Services.MedicalRecord.Application.DTOs
{
    public class UpdatePatientProfileRequest
    {
        public string FullName { get; set; } = string.Empty;
        public DateTime DateOfBirth { get; set; }
        public string Gender { get; set; } = string.Empty;
        public string PhoneNumber { get; set; } = string.Empty;
        public string Address { get; set; } = string.Empty;
        
        // [BỔ SUNG] Cần thêm ClinicId để khớp với constructor của Patient
        public Guid ClinicId { get; set; } 
    }
}