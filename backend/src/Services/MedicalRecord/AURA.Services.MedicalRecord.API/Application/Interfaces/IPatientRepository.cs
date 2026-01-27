using AURA.Services.MedicalRecord.Domain.Entities;

namespace AURA.Services.MedicalRecord.Application.Interfaces
{
    public interface IPatientRepository
    {
        Task<Patient?> GetByIdAsync(Guid id);
        Task<Patient?> GetByUserIdAsync(Guid userId);
        Task<Patient?> GetByEmailAsync(string email);
        
        // [FIX] Đổi Task -> Task<Patient> để khớp với Repository implementation
        Task<Patient> AddAsync(Patient patient);
        
        Task UpdateAsync(Patient patient);
    }
}