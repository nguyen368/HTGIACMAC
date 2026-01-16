using AURA.Services.MedicalRecord.Domain.Entities;

namespace AURA.Services.MedicalRecord.Domain.States;

public class PendingState : ExaminationState
{
    public override void ProcessAiResult(Examination context, string aiResult)
    {
        // Logic: Cập nhật kết quả AI -> Chuyển sang trạng thái Analyzed
        context.DiagnosisResult = aiResult;
        context.TransitionTo(new AnalyzedState());
    }
}