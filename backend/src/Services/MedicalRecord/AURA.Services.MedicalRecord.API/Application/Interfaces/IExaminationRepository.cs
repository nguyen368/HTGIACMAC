using AURA.Services.MedicalRecord.Domain.Entities;

namespace AURA.Services.MedicalRecord.Application.Interfaces
{
    public interface IExaminationRepository
    {
        Task<Examination?> GetByIdAsync(Guid id);
        Task<IEnumerable<Examination>> GetByPatientIdAsync(Guid patientId);
        Task<IEnumerable<Examination>> GetByClinicIdAsync(Guid clinicId);
        
        // [FIX] Đổi Task -> Task<Examination>
        Task<Examination> AddAsync(Examination exam);
        
        Task UpdateAsync(Examination exam);
    }
}