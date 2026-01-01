// File: src/backend/Aura.Application/DTOs/PatientQueueDto.cs
namespace Aura.Application.DTOs
{
    public class PatientQueueDto
    {
        public Guid ReportId { get; set; }      // ID phiếu khám
        public string PatientName { get; set; } // Tên bệnh nhân
        public DateTime CreatedAt { get; set; } // Ngày gửi yêu cầu
        public string Status { get; set; }      // Trạng thái (Pending/Analyzed)
        public string RiskLevel { get; set; }   // Mức độ rủi ro từ AI (nếu có)
    }
}