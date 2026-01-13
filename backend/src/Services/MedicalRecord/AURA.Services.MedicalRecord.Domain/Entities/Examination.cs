using AURA.Shared.Kernel.Primitives;

namespace AURA.Services.MedicalRecord.Domain.Entities;

public class Examination : Entity
{
    public Guid PatientId { get; private set; }
    public DateTime ExamDate { get; private set; }
    public string DiagnosisResult { get; private set; }
    public string DoctorNotes { get; private set; }
    public string ImageUrl { get; private set; }
    public string Status { get; private set; } // Pending, Analyzed, Verified

    // Constructor rỗng cho EF Core
    private Examination() { }

    public Examination(Guid patientId, string imageUrl)
    {
        Id = Guid.NewGuid();
        PatientId = patientId;
        ImageUrl = imageUrl;
        ExamDate = DateTime.UtcNow;
        Status = "Pending";
        DiagnosisResult = "";
        DoctorNotes = "";
    }

    public void CompleteExamination(string result, string notes)
    {
        DiagnosisResult = result;
        DoctorNotes = notes;
        Status = "Verified";
    }
}