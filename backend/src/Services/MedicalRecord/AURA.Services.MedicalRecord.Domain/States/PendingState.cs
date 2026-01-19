using AURA.Services.MedicalRecord.Domain.Entities;

namespace AURA.Services.MedicalRecord.Domain.States
{
    public class PendingState : ExaminationState
    {
        public override void ProcessAiResult(Examination context, string aiResult)
        {
            // SỬA: DiagnosisResult -> Diagnosis
            context.Diagnosis = aiResult; 
            context.TransitionTo(new AnalyzedState());
        }

        public override void VerifyByDoctor(Examination context, string notes, string finalResult)
        {
            context.DoctorNotes = notes;
            context.Diagnosis = finalResult; // SỬA: DiagnosisResult -> Diagnosis
            context.TransitionTo(new VerifiedState());
        }
    }
}