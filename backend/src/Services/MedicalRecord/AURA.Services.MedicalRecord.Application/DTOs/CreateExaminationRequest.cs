namespace AURA.Services.MedicalRecord.Application.DTOs
{
    public class CreateExaminationRequest
    {
        public Guid PatientId { get; set; }
        public Guid ImageId { get; set; } // Liên kết với ảnh bên Imaging Service
        public string Diagnosis { get; set; } // Kết luận bệnh (Bình thường, Viêm loét...)
        public string DoctorNotes { get; set; } // Ghi chú chi tiết
        public Guid DoctorId { get; set; } // ID bác sĩ thực hiện
    }
}