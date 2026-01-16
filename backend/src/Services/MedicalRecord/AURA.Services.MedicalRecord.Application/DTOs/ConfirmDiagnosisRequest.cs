namespace AURA.Services.MedicalRecord.Application.DTOs;

public class ConfirmDiagnosisRequest
{
    public string DoctorNotes { get; set; }
    public string FinalDiagnosis { get; set; } // Kết luận cuối (có thể khác AI)
}