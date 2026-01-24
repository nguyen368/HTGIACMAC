using System.ComponentModel.DataAnnotations;

namespace AURA.Services.MedicalRecord.Application.DTOs;

public class AddMedicalHistoryRequest
{
    [Required(ErrorMessage = "Tên bệnh hoặc tình trạng y tế là bắt buộc")]
    public string Condition { get; set; } = string.Empty; 

    public string Description { get; set; } = string.Empty; 

    [Required(ErrorMessage = "Ngày chẩn đoán là bắt buộc")]
    public DateTime DiagnosedDate { get; set; } 
}