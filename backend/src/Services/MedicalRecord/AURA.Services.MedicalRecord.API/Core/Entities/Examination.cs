namespace AURA.Services.MedicalRecord.Core.Entities
{
    public class Examination
    {
        public Guid Id { get; set; }
        public Guid PatientId { get; set; }
        public string DoctorId { get; set; } = string.Empty; // ID của bác sĩ lấy từ Identity
        public string ClinicId { get; set; } = string.Empty;
        
        public DateTime ExamDate { get; set; } = DateTime.UtcNow;
        public string ImageUrl { get; set; } = string.Empty;
        
        // Kết quả AI
        public string PredictionResult { get; set; } = string.Empty;
        public double ConfidenceScore { get; set; }
        public string HeatmapUrl { get; set; } = string.Empty;

        // Kết luận bác sĩ
        public string DiagnosisResult { get; set; } = string.Empty;
        public string DoctorNotes { get; set; } = string.Empty;
        
        // Trạng thái: Pending (0), Processed (1), Verified (2)
        public string Status { get; set; } = "Pending";
        
        // Navigation Property (nếu cần join bảng)
        public Patient? Patient { get; set; }
    }
}