using AURA.Services.MedicalRecord.Domain.States;
using AURA.Shared.Kernel.Primitives;
using System.ComponentModel.DataAnnotations.Schema;

namespace AURA.Services.MedicalRecord.Domain.Entities;

public class Examination : Entity
{
    // --- 1. Properties (Dữ liệu lưu DB) ---
    public Guid? PatientId { get; private set; }
    public DateTime ExamDate { get; private set; }
    
    // Cho phép set public để State Class có thể cập nhật kết quả
    public string DiagnosisResult { get; set; } 
    public string DoctorNotes { get; set; }
    
    public string ImageUrl { get; private set; }
    public string Status { get; private set; } // Lưu DB dạng string: "Pending", "Analyzed", "Verified"

    // Navigation Property (Để join bảng)
    public virtual Patient? Patient { get; set; }

    // --- 2. State Pattern Logic (Xử lý trạng thái) ---
    
    // Biến chứa State Object (Chỉ dùng trong code, KHÔNG lưu xuống DB)
    [NotMapped]
    private ExaminationState _state;

    // --- 3. Constructors ---

    // Constructor rỗng (Bắt buộc cho EF Core)
    private Examination() 
    { 
        // Khi EF Core load dữ liệu lên, ta cần mapping lại String -> State Object
        // Nhưng ta không gọi LoadState() ở đây để tránh lỗi circular reference
    }

    // Constructor tạo mới (Mặc định là Pending)
    public Examination(Guid patientId, string imageUrl)
    {
        Id = Guid.NewGuid();
        PatientId = patientId;
        ImageUrl = imageUrl;
        ExamDate = DateTime.UtcNow;
        DiagnosisResult = "";
        DoctorNotes = "";
        
        // Khởi tạo trạng thái ban đầu
        TransitionTo(new PendingState());
    }

    // --- 4. Methods hỗ trợ State ---

    // Hàm chuyển đổi trạng thái
    public void TransitionTo(ExaminationState newState)
    {
        _state = newState;
        
        // Đồng bộ hóa ngược lại vào biến Status (string) để lưu xuống DB
        if (newState is PendingState) Status = "Pending";
        else if (newState is AnalyzedState) Status = "Analyzed";
        else if (newState is VerifiedState) Status = "Verified";
    }

    // Hàm khôi phục State từ String (Dùng khi lấy dữ liệu từ DB lên)
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

    // --- 5. Business Logic (Ủy quyền cho State xử lý) ---

    // Hành động 1: AI trả kết quả
    public void UpdateAiResult(string aiResult)
    {
        if (_state == null) LoadState(); // Đảm bảo State đã được load
        _state.ProcessAiResult(this, aiResult);
    }

    // Hành động 2: Bác sĩ duyệt
    public void ConfirmDiagnosis(string doctorNotes, string finalResult)
    {
        if (_state == null) LoadState();
        _state.VerifyByDoctor(this, doctorNotes, finalResult);
    }
}