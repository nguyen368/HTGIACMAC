namespace Aura.Application.DTOs
{
    public class DashboardStatsDto
    {
        public int TotalPatients { get; set; }
        public int TotalScans { get; set; }
        public int HighRiskCount { get; set; }
        public double AverageAccuracy { get; set; }
    }

    public class HistoryRecordDto
    {
        public Guid ReportId { get; set; }
        public string PatientName { get; set; } = string.Empty;
        public DateTime DiagnosisDate { get; set; }
        public string RiskLevel { get; set; } = string.Empty;
        public string ImageUrl { get; set; } = string.Empty;
        public string DoctorName { get; set; } = string.Empty;
    }
}