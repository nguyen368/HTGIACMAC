using AURA.Services.MedicalRecord.Domain.Entities;

namespace AURA.Services.MedicalRecord.Domain.States;

public class AnalyzedState : ExaminationState
{
    public override void VerifyByDoctor(Examination context, string doctorNotes, string finalDiagnosis)
    {
        // Logic: Bác sĩ chốt -> Chuyển sang Verified
        context.DoctorNotes = doctorNotes;
        context.DiagnosisResult = finalDiagnosis; // Bác sĩ có quyền sửa lại kết quả AI nếu thấy sai
        context.TransitionTo(new VerifiedState());
    }
}