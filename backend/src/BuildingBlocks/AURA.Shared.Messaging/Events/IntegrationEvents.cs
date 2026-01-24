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
    public record UserRegisteredIntegrationEvent(
        Guid UserId, 
        string Email, 
        string FullName, 
        string Role, 
        Guid? ClinicId);
}