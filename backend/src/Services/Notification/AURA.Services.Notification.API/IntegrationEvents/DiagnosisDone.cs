namespace AURA.Services.Notification.API.IntegrationEvents
{
    public class DiagnosisDone
    {
        public Guid PatientId { get; set; }
        public string DoctorName { get; set; }
        public string Result { get; set; }
        public DateTime CompletedAt { get; set; }
    }
}