using System.ComponentModel.DataAnnotations;

namespace AURA.Services.MedicalRecord.Application.DTOs;

public class AddMedicalHistoryRequest
{
    [Required]
    public string Condition { get; set; } = string.Empty; // Tên bệnh (VD: Dị ứng thuốc)

    public string Description { get; set; } = string.Empty; // Mô tả chi tiết

    [Required]
    public DateTime DiagnosedDate { get; set; } // Ngày phát hiện
}