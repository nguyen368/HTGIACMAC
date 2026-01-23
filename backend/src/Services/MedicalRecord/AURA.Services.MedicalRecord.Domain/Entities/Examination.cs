using AURA.Services.MedicalRecord.Domain.States;
using AURA.Shared.Kernel.Primitives;
using System.ComponentModel.DataAnnotations.Schema;

namespace AURA.Services.MedicalRecord.Domain.Entities
{
    public class Examination : Entity
    {
        // --- Properties ---
        public Guid PatientId { get; private set; }
        public Guid? DoctorId { get; set; }
        public Guid ImageId { get; set; }
        public DateTime ExamDate { get; private set; }
        
        public string Diagnosis { get; set; } = string.Empty;
        public string DoctorNotes { get; set; } = string.Empty;
        public string ImageUrl { get; private set; } = string.Empty;
        public string Status { get; private set; } = "Pending"; 

        // --- AI Fields ---
        public double? AiRiskScore { get; set; }
        public string? AiRiskLevel { get; set; } 
        public string? HeatmapUrl { get; set; }
        public string? AiDiagnosis { get; set; }

        public virtual Patient? Patient { get; set; }

        [NotMapped]
        private ExaminationState _state = new PendingState();

        // --- Constructors ---
        public Examination() { }

        // [QUAN TRỌNG] Constructor 5 tham số để Controller gọi khi tạo thủ công
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
            
            // Nếu tạo thủ công kèm chẩn đoán thì coi như Verified luôn
            if (!string.IsNullOrEmpty(diagnosis))
            {
                TransitionTo(new VerifiedState());
            }
            else
            {
                TransitionTo(new PendingState());
            }
        }

        // Constructor cho luồng upload tự động (2 tham số)
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

        // --- Methods ---
        public void TransitionTo(ExaminationState newState)
        {
            _state = newState;
            if (newState is PendingState) Status = "Pending";
            else if (newState is AnalyzedState) Status = "Analyzed";
            else if (newState is VerifiedState) Status = "Verified";
            else if (Status == "Rejected") { } 
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

        // Overload 1: Cập nhật đầy đủ (Dùng cho Consumer khi AI trả về full)
        public void UpdateAiResult(string riskLevel, string diagnosis, double score, string heatmapUrl)
        {
            this.AiRiskLevel = riskLevel;
            this.AiDiagnosis = diagnosis;
            this.AiRiskScore = score;
            this.HeatmapUrl = heatmapUrl;

            if (_state == null) LoadState();
            _state.ProcessAiResult(this, diagnosis);
        }

        // [MỚI] Overload 2: Cập nhật đơn giản (Dùng cho Controller UpdateAiResult 1 tham số)
        public void UpdateAiResult(string aiResult)
        {
            this.AiDiagnosis = aiResult;
            this.AiRiskLevel = "Unknown"; // Giá trị mặc định
            
            if (_state == null) LoadState();
            _state.ProcessAiResult(this, aiResult);
        }

        public void RejectAiResult(string reason)
        {
            this.Status = "Rejected";
            this.Diagnosis = reason;
            this.AiDiagnosis = reason;
        }

        public void ConfirmDiagnosis(string doctorNotes, string finalResult, Guid doctorId)
        {
            this.DoctorId = doctorId; // Cập nhật bác sĩ
            if (_state == null) LoadState();
            _state.VerifyByDoctor(this, doctorNotes, finalResult);
        }
    }
}