namespace AURA.Services.MedicalRecord.Application.DTOs
{
    public class ConfirmDiagnosisRequest
    {
        public string DoctorNotes { get; set; } = string.Empty;
        public string FinalDiagnosis { get; set; } = string.Empty;
        public Guid DoctorId { get; set; } 
    }
}