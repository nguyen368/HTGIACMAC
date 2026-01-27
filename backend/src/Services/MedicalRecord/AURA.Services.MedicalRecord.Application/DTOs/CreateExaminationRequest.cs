namespace AURA.Services.MedicalRecord.Application.DTOs
{
    public class CreateExaminationRequest
    {
        public Guid PatientId { get; set; }
        public Guid ImageId { get; set; }
        public Guid ClinicId { get; set; } // Đảm bảo có cả ClinicId
        public string? ImageUrl { get; set; } // THÊM DÒNG NÀY ĐỂ HẾT LỖI CS1061
        public string? Diagnosis { get; set; }
        public string? DoctorNotes { get; set; }
        public Guid DoctorId { get; set; }
    }
}