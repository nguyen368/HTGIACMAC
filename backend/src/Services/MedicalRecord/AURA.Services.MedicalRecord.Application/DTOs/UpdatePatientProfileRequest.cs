using System;

namespace AURA.Services.MedicalRecord.Application.DTOs
{
    public class UpdatePatientProfileRequest
    {
        public string FullName { get; set; } = string.Empty;
        public DateTime DateOfBirth { get; set; }
        public string Gender { get; set; } = string.Empty;
        public string PhoneNumber { get; set; } = string.Empty;
        public string Address { get; set; } = string.Empty;
        
        // [BỔ SUNG] Cần thêm ClinicId để khớp với constructor của Patient
        public Guid ClinicId { get; set; } 

        // [MỚI] Thêm AvatarUrl để lưu link ảnh sau khi upload
        public string? AvatarUrl { get; set; }

        // [MỚI] Thêm MedicalHistory để nhận dữ liệu tiền sử bệnh từ Frontend
        public MedicalHistoryDto? MedicalHistory { get; set; }
    }

    // Class DTO phụ để hứng dữ liệu tiền sử bệnh (nếu chưa có file riêng)
    public class MedicalHistoryDto
    {
        public bool HasDiabetes { get; set; }
        public bool HasHypertension { get; set; }
        public string SmokingStatus { get; set; } = "never";
        public int YearsOfDiabetes { get; set; }
    }
}