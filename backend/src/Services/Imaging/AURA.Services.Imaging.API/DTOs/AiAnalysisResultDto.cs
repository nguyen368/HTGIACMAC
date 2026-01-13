namespace AURA.Services.Imaging.API.DTOs;

// Đây là cấu trúc JSON giả định mà AI sau này sẽ trả về
public class AiAnalysisResultDto
{
    public string Diagnosis { get; set; }       // Chẩn đoán (VD: Glaucoma, Bình thường)
    public double ConfidenceScore { get; set; } // Độ tin cậy (0.0 - 1.0)
    public string RiskLevel { get; set; }       // Mức độ nguy hiểm (High, Medium, Low)
    public List<string> HeatmapCoordinates { get; set; } // Tọa độ vùng bệnh (để vẽ lên ảnh)
    public string DoctorNotes { get; set; }     // Gợi ý của AI cho bác sĩ
}