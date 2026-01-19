using AURA.Services.MedicalRecord.Domain.Entities;

namespace AURA.Services.MedicalRecord.Domain.States
{
    public class VerifiedState : ExaminationState
    {
        public override void ProcessAiResult(Examination context, string aiResult)
        {
            // Đã xác thực rồi thì không cho AI ghi đè nữa, hoặc tùy logic
        }

        public override void VerifyByDoctor(Examination context, string notes, string finalResult)
        {
            // Cho phép bác sĩ sửa lại kết quả
            context.DoctorNotes = notes;
            context.Diagnosis = finalResult; // SỬA
        }
    }
}