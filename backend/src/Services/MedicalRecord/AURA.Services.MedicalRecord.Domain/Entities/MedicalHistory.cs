using AURA.Shared.Kernel.Primitives;

namespace AURA.Services.MedicalRecord.Domain.Entities;

public class MedicalHistory : Entity
{
    public Guid PatientId { get; private set; } // Foreign Key
    public string Condition { get; private set; } // Tên bệnh (VD: Tiểu đường)
    public string Description { get; private set; } // Mô tả chi tiết/Thuốc đang dùng
    public DateTime DiagnosedDate { get; private set; } // Ngày phát hiện

    // Constructor dùng cho EF Core
    private MedicalHistory() { }

    public MedicalHistory(Guid patientId, string condition, string description, DateTime diagnosedDate)
    {
        Id = Guid.NewGuid();
        PatientId = patientId;
        Condition = condition;
        Description = description;
        DiagnosedDate = diagnosedDate;
    }
}