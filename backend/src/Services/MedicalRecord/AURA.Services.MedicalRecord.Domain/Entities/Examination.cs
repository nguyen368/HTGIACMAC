using AURA.Shared.Kernel.Primitives;

namespace AURA.Services.MedicalRecord.Domain.Entities;

public class Examination : Entity
{
    public Guid? PatientId { get; private set; } 
    public DateTime ExamDate { get; private set; }
    public string DiagnosisResult { get; private set; }
    public string DoctorNotes { get; private set; }
    public string ImageUrl { get; private set; }
    public string Status { get; private set; } // Pending, Analyzed, Verified

    // --- [QUAN TRỌNG] Thêm dòng này để lệnh .Include(e => e.Patient) hoạt động ---
    public virtual Patient? Patient { get; set; } 

    // Constructor rỗng (Bắt buộc cho EF Core)
    private Examination() { }

    // Constructor dùng để tạo data giả
    public Examination(Guid patientId, string imageUrl)
    {
        Id = Guid.NewGuid();
        PatientId = patientId;
        ImageUrl = imageUrl;
        ExamDate = DateTime.UtcNow;
        Status = "Pending"; // Mặc định là Đang chờ
        DiagnosisResult = "";
        DoctorNotes = "";
    }
}