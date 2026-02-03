using System;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;
using MassTransit;
using AURA.Services.MedicalRecord.Application.Interfaces;
// [FIX]: Sử dụng Domain.Entities để đồng bộ với Repository
using AURA.Services.MedicalRecord.Domain.Entities;
using AURA.Shared.Messaging.Events;

namespace AURA.Services.MedicalRecord.API.Consumers
{
    public class AnalysisCompletedConsumer : IConsumer<AnalysisCompletedEvent> 
    {
        private readonly IExaminationRepository _repository;
        private readonly ILogger<AnalysisCompletedConsumer> _logger;

        public AnalysisCompletedConsumer(IExaminationRepository repository, ILogger<AnalysisCompletedConsumer> logger)
        {
            _repository = repository;
            _logger = logger;
        }

        public async Task Consume(ConsumeContext<AnalysisCompletedEvent> context)
        {
            var message = context.Message;
            _logger.LogInformation("Received Analysis Result for Exam: {ExaminationId}", message.ExaminationId);

            var exam = await _repository.GetByIdAsync(message.ExaminationId);

            if (exam != null)
            {
                // [GIỮ NGUYÊN]: Logic dynamic của bạn để bypass lỗi build DLL
                dynamic msgDynamic = message;

                try 
                {
                    // Lấy dữ liệu từ message
                    string diag = (string)msgDynamic.Diagnosis;
                    string heatmap = (string)msgDynamic.HeatmapUrl;

                    // [FIX]: Chỉ cập nhật nếu Diagnosis có dữ liệu thật. 
                    // Nếu rỗng, giữ nguyên kết quả cũ từ bước gọi HTTP để tránh hiện "Chưa có kết quả"
                    if (!string.IsNullOrEmpty(diag)) 
                    {
                        exam.AiDiagnosis = diag;
                    }
                    
                    if (!string.IsNullOrEmpty(heatmap)) 
                    {
                        exam.HeatmapUrl = heatmap;
                    }
                }
                catch 
                {
                    _logger.LogWarning("Không thể đọc Diagnosis/HeatmapUrl từ Event (Check version DLL)");
                }

                // Cập nhật mức độ rủi ro
                exam.AiRiskLevel = message.RiskLevel;

                // [FIX LỖI 4500.0%]: 
                // Nếu AI trả về dạng số nguyên (ví dụ 45 thay vì 0.45), ta chia cho 100.
                // Vì Frontend sẽ nhân 100 thêm lần nữa để hiển thị ký hiệu %.
                exam.AiRiskScore = message.RiskScore > 1 ? message.RiskScore / 100 : message.RiskScore;

                exam.Status = "Analyzed"; 

                // Lưu thay đổi vào Database
                await _repository.UpdateAsync(exam);
                _logger.LogInformation("✅ Successfully updated Examination {Id}. Result: {Result}", exam.Id, exam.AiDiagnosis);
            }
            else
            {
                _logger.LogError("❌ Examination {Id} not found in database to update AI results.", message.ExaminationId);
            }
        }
    }
}