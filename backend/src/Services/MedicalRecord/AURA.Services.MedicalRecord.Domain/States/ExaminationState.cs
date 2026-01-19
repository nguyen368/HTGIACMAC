using AURA.Services.MedicalRecord.Domain.Entities;

namespace AURA.Services.MedicalRecord.Domain.States;

public abstract class ExaminationState
{
    // Hành động 1: AI trả kết quả
    public virtual void ProcessAiResult(Examination context, string aiResult)
    {
        throw new InvalidOperationException($"Không thể cập nhật kết quả AI khi đang ở trạng thái {this.GetType().Name}");
    }

    // Hành động 2: Bác sĩ duyệt
    public virtual void VerifyByDoctor(Examination context, string doctorNotes, string finalDiagnosis)
    {
        throw new InvalidOperationException($"Không thể duyệt hồ sơ khi đang ở trạng thái {this.GetType().Name}");
    }
}