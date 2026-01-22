using System.Text.Json.Serialization;
using System.Collections.Generic;

namespace AURA.Services.Imaging.API.DTOs;

public class AiAnalysisResultDto
{
    [JsonPropertyName("diagnosis")]
    public string Diagnosis { get; set; }

    [JsonPropertyName("risk_score")] 
    public double RiskScore { get; set; }

    [JsonPropertyName("risk_level")]
    public string RiskLevel { get; set; }

    [JsonPropertyName("heatmap_url")]
    public string HeatmapUrl { get; set; }

    [JsonPropertyName("status")]
    public string Status { get; set; }

    // --- GIỮ NGUYÊN CÁC TRƯỜNG CŨ CỦA BẠN ---
    public double ConfidenceScore { get; set; } 
    public List<string> HeatmapCoordinates { get; set; } 
    public string DoctorNotes { get; set; } 
}