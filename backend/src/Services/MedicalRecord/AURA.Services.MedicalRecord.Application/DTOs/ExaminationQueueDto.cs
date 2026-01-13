namespace AURA.Services.MedicalRecord.Application.DTOs;

public class ExaminationQueueDto
{
    public Guid Id { get; set; }              // Mã phiếu khám
    public Guid PatientId { get; set; }       // Mã bệnh nhân
    public string PatientName { get; set; }   // Tên bệnh nhân (Quan trọng)
    public string ImageUrl { get; set; }      // Ảnh mắt
    public DateTime ExamDate { get; set; }    // Giờ gửi yêu cầu
    public string Status { get; set; }        // Trạng thái (Pending)
}