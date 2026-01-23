using MassTransit;
using AURA.Services.MedicalRecord.Domain.Entities;
using AURA.Services.MedicalRecord.Infrastructure.Data;
using System.Net.Http.Json;
using System.Text.Json.Serialization;
using Microsoft.EntityFrameworkCore;

namespace AURA.Services.MedicalRecord.API.Consumers
{
    // [FIX] Cập nhật tên Event để khớp với Imaging Service
    public record ImageUploadedIntegrationEvent(Guid ImageId, string ImageUrl, Guid PatientId, Guid ClinicId, DateTime Timestamp);

    public record AnalysisCompletedEvent(Guid ExaminationId, Guid ClinicId, Guid PatientId, string RiskLevel, double RiskScore);

    public class AiResponse
    {
        [JsonPropertyName("status")] public string Status { get; set; }
        [JsonPropertyName("diagnosis")] public string Diagnosis { get; set; }
        [JsonPropertyName("risk_score")] public double RiskScore { get; set; }
        [JsonPropertyName("risk_level")] public string RiskLevel { get; set; }
        [JsonPropertyName("heatmap_url")] public string HeatmapUrl { get; set; }
    }

    // [FIX] Cập nhật interface IConsumer nhận đúng Event mới
    public class ImageUploadedConsumer : IConsumer<ImageUploadedIntegrationEvent>
    {
        private readonly MedicalDbContext _context;
        private readonly IHttpClientFactory _httpClientFactory;
        private readonly ILogger<ImageUploadedConsumer> _logger;
        private readonly IPublishEndpoint _publishEndpoint;

        public ImageUploadedConsumer(MedicalDbContext context, IHttpClientFactory httpClientFactory, ILogger<ImageUploadedConsumer> logger, IPublishEndpoint publishEndpoint)
        {
            _context = context;
            _httpClientFactory = httpClientFactory;
            _logger = logger;
            _publishEndpoint = publishEndpoint;
        }

        public async Task Consume(ConsumeContext<ImageUploadedIntegrationEvent> context)
        {
            var msg = context.Message;
            _logger.LogInformation($"[WORKFLOW START] Nhận ảnh {msg.ImageId}");

            try
            {
                var examination = new Examination(msg.PatientId, msg.ImageUrl);
                examination.ImageId = msg.ImageId;
                
                _context.Examinations.Add(examination);
                await _context.SaveChangesAsync();

                var client = _httpClientFactory.CreateClient();
                var aiUrl = "http://ai-core-service:8000/api/ai/auto-diagnosis";
                var payload = new { file_name = $"{msg.ImageId}.jpg", image_url = msg.ImageUrl, patient_id = msg.PatientId.ToString() };
                
                var response = await client.PostAsJsonAsync(aiUrl, payload);
                if (response.IsSuccessStatusCode)
                {
                    var result = await response.Content.ReadFromJsonAsync<AiResponse>();
                    if (result != null)
                    {
                        examination.UpdateAiResult(result.RiskLevel, result.Diagnosis, result.RiskScore, result.HeatmapUrl);
                        await _context.SaveChangesAsync();

                        await _publishEndpoint.Publish(new AnalysisCompletedEvent(examination.Id, msg.ClinicId, msg.PatientId, result.RiskLevel, result.RiskScore));
                    }
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error processing");
            }
        }
    }
}