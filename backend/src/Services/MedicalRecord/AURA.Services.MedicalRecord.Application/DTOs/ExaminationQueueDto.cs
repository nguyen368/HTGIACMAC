namespace AURA.Services.MedicalRecord.Application.DTOs;

public class ExaminationQueueDto
{
    public Guid Id { get; set; }              
    public Guid PatientId { get; set; }       
    public string PatientName { get; set; } = string.Empty;   
    public string ImageUrl { get; set; } = string.Empty;      
    public DateTime ExamDate { get; set; }    
    public string Status { get; set; } = "Pending";

    // [BỔ SUNG CÁC TRƯỜNG AI ĐỂ FIX LỖI BUILD]
    public string AiDiagnosis { get; set; } = string.Empty;
    public string AiRiskLevel { get; set; } = "Low";
    public double AiRiskScore { get; set; }
}