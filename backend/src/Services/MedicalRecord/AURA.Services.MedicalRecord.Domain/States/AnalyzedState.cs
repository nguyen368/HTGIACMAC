using AURA.Services.MedicalRecord.Domain.Entities;

namespace AURA.Services.MedicalRecord.Domain.States
{
    public class AnalyzedState : ExaminationState
    {
        public override void ProcessAiResult(Examination context, string aiResult)
        {
            context.Diagnosis = aiResult; // SỬA
        }

        public override void VerifyByDoctor(Examination context, string notes, string finalResult)
        {
            context.DoctorNotes = notes;
            context.Diagnosis = finalResult; // SỬA
            context.TransitionTo(new VerifiedState());
        }
    }
}