namespace AURA.Services.Notification.API.IntegrationEvents
{
    public class DiagnosisDone
    {
        public Guid PatientId { get; set; }
        public string DoctorName { get; set; } = string.Empty;
        public string Result { get; set; } = string.Empty;
        public DateTime CompletedAt { get; set; }
    }
}