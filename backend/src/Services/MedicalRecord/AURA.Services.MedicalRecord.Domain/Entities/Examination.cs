using AURA.Services.MedicalRecord.Domain.States;
using AURA.Shared.Kernel.Primitives;
using System.ComponentModel.DataAnnotations.Schema;

namespace AURA.Services.MedicalRecord.Domain.Entities;

public class Examination : Entity
{
    // --- 1. Properties (Dữ liệu lưu DB) ---
    public Guid PatientId { get; private set; }
    
    // ID Bác sĩ và ID Ảnh
    public Guid DoctorId { get; set; }
    public Guid ImageId { get; set; }

    public DateTime ExamDate { get; private set; }
    
    // [FIX] Khởi tạo giá trị mặc định để tránh Warning CS8618
    public string Diagnosis { get; set; } = string.Empty;
    public string DoctorNotes { get; set; } = string.Empty;
    
    public string ImageUrl { get; private set; } = string.Empty;
    
    // Mặc định trạng thái là Pending
    public string Status { get; private set; } = "Pending"; 

    // Navigation Property
    public virtual Patient? Patient { get; set; }

    // --- 2. State Pattern Logic ---
    
    // [FIX] Khởi tạo luôn state mặc định để tránh null
    [NotMapped]
    private ExaminationState _state = new PendingState();

    // --- 3. Constructors ---

    // Constructor rỗng (Bắt buộc cho EF Core)
    public Examination() { }

    // Constructor dùng cho API "Lưu Kết Quả" từ Clinic Web
    // Tạo ra một ca khám đã hoàn tất (Verified) ngay lập tức
    public Examination(Guid patientId, Guid imageId, string diagnosis, string notes, Guid doctorId)
    {
        Id = Guid.NewGuid();
        PatientId = patientId;
        ImageId = imageId;
        Diagnosis = diagnosis ?? string.Empty;
        DoctorNotes = notes ?? string.Empty;
        DoctorId = doctorId;
        ExamDate = DateTime.UtcNow;
        ImageUrl = ""; 

        // Thiết lập trạng thái là đã xác thực (Verified)
        // Lưu ý: Class VerifiedState phải tồn tại và đúng tên
        TransitionTo(new VerifiedState()); 
    }

    // Constructor cũ (Dùng cho luồng Check-in / Upload ảnh)
    public Examination(Guid patientId, string imageUrl)
    {
        Id = Guid.NewGuid();
        PatientId = patientId;
        ImageUrl = imageUrl ?? string.Empty;
        ExamDate = DateTime.UtcNow;
        Diagnosis = string.Empty;
        DoctorNotes = string.Empty;
        
        TransitionTo(new PendingState());
    }

    // --- 4. Methods hỗ trợ State ---

    public void TransitionTo(ExaminationState newState)
    {
        _state = newState;
        
        // Map ngược lại string để lưu DB
        if (newState is PendingState) Status = "Pending";
        else if (newState is AnalyzedState) Status = "Analyzed";
        else if (newState is VerifiedState) Status = "Verified";
        else Status = "Unknown";
    }

    public void LoadState()
    {
        switch (Status)
        {
            case "Pending": _state = new PendingState(); break;
            case "Analyzed": _state = new AnalyzedState(); break;
            case "Verified": _state = new VerifiedState(); break;
            default: _state = new PendingState(); break;
        }
    }

    // --- 5. Business Logic ---

    public void UpdateAiResult(string aiResult)
    {
        // Không cần check null _state nữa vì đã new ở trên
        _state.ProcessAiResult(this, aiResult);
    }

    // Cập nhật chẩn đoán của bác sĩ
    public void ConfirmDiagnosis(string doctorNotes, string finalResult)
    {
        _state.VerifyByDoctor(this, doctorNotes, finalResult);
    }
}