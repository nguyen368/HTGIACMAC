using AURA.Shared.Kernel.Primitives;

namespace AURA.Services.MedicalRecord.Domain.Entities;

public class MedicalHistory : Entity
{
    public Guid PatientId { get; private set; } 
    public string Condition { get; private set; } = string.Empty; // [FIX WARNING]
    public string Description { get; private set; } = string.Empty; // [FIX WARNING]
    public DateTime DiagnosedDate { get; private set; } 

    private MedicalHistory() { }

    public MedicalHistory(Guid patientId, string condition, string description, DateTime diagnosedDate)
    {
        Id = Guid.NewGuid();
        PatientId = patientId;
        Condition = condition;
        Description = description;
        DiagnosedDate = diagnosedDate;
    }

    // [MỚI] Phương thức hỗ trợ cập nhật mô tả (được gọi từ Controller)
    public void UpdateDescription(string description)
    {
        Description = description;
    }
}