using System;

namespace AURA.Shared.Messaging.Events
{
    // 1. Sự kiện khi ảnh được tải lên
    public record ImageUploadedIntegrationEvent(
        Guid ImageId, 
        string ImageUrl, 
        Guid PatientId, 
        Guid ClinicId, 
        DateTime Timestamp);

    // 2. Sự kiện khi AI hoàn tất phân tích
    public record AnalysisCompletedEvent(
        Guid ExaminationId, 
        Guid ClinicId, 
        Guid PatientId, 
        string RiskLevel, 
        double RiskScore);
        
    // 3. Sự kiện khi người dùng đăng ký tài khoản mới
    // [FIX LỖI 1]: Đã thêm PhoneNumber vào đây để Consumer không bị lỗi CS1061
    public record UserRegisteredIntegrationEvent(
        Guid UserId, 
        string Email, 
        string FullName, 
        string? PhoneNumber, // Thêm trường này
        string Role, 
        Guid? ClinicId);

    // 4. Sự kiện khi Bác sĩ xác nhận kết quả
    // [FIX LỖI 2]: Định nghĩa sự kiện này để ExaminationsController không bị lỗi CS0246
    public record DiagnosisVerifiedEvent(
        Guid ExaminationId, 
        Guid PatientId, 
        string FinalDiagnosis, 
        string DoctorNotes, 
        DateTime VerifiedAt);
}