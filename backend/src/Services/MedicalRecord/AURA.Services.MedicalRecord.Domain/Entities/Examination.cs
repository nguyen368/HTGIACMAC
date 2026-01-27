using AURA.Services.MedicalRecord.Domain.States;
using AURA.Shared.Kernel.Primitives;
using System.ComponentModel.DataAnnotations.Schema;

namespace AURA.Services.MedicalRecord.Domain.Entities
{
    public class Examination : Entity
    {
        // Chuyển sang public set để cho phép gán dữ liệu từ Controller/Imaging Service
        public Guid PatientId { get; set; } 
        public Guid ClinicId { get; set; }
        public Guid? DoctorId { get; set; }
        public Guid ImageId { get; set; }
        public DateTime ExamDate { get; set; }
        
        public string Diagnosis { get; set; } = string.Empty;
        public string DoctorNotes { get; set; } = string.Empty;
        
        // Mở khóa set để dứt điểm lỗi CS0272
        public string ImageUrl { get; set; } = string.Empty;
        public string Status { get; set; } = "Pending"; 

        public double? AiRiskScore { get; set; }
        public string? AiRiskLevel { get; set; } 
        public string? HeatmapUrl { get; set; }
        public string? AiDiagnosis { get; set; }

        public virtual Patient? Patient { get; set; }

        [NotMapped]
        private ExaminationState _state = new PendingState();

        public Examination() { }

        // Giữ nguyên Constructor 1 của bạn
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
            
            if (!string.IsNullOrEmpty(diagnosis)) TransitionTo(new VerifiedState());
            else TransitionTo(new PendingState());
        }

        // Giữ nguyên Constructor 2 của bạn
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

        // --- GIỮ NGUYÊN TOÀN BỘ LOGIC NGHIỆP VỤ (STATE PATTERN) CỦA BẠN ---

        public void TransitionTo(ExaminationState newState)
        {
            _state = newState;
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

        public void UpdateAiResult(string riskLevel, string diagnosis, double score, string heatmapUrl)
        {
            this.AiRiskLevel = riskLevel;
            this.AiDiagnosis = diagnosis;
            this.AiRiskScore = score;
            this.HeatmapUrl = heatmapUrl;
            if (_state == null) LoadState();
            _state.ProcessAiResult(this, diagnosis);
        }

        public void UpdateAiResult(string aiResult)
        {
            this.AiDiagnosis = aiResult;
            this.AiRiskLevel = "Unknown"; 
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
            this.DoctorId = doctorId;
            if (_state == null) LoadState();
            _state.VerifyByDoctor(this, doctorNotes, finalResult);
        }
    }
}