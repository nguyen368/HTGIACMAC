namespace AURA.Services.MedicalRecord.Domain.States;

public class VerifiedState : ExaminationState
{
    // Ở trạng thái này, mọi hành động đều bị chặn (Ném lỗi mặc định từ class cha)
    // Hồ sơ đã đóng băng.
}