using AURA.Services.MedicalRecord.Application.Interfaces;
using AURA.Services.MedicalRecord.Domain.Entities;
using AURA.Services.MedicalRecord.Infrastructure.Data; // Trỏ đúng Data
using Microsoft.EntityFrameworkCore;

namespace AURA.Services.MedicalRecord.Infrastructure.Repositories
{
    public class PatientRepository : IPatientRepository
    {
        private readonly MedicalDbContext _context; // Đã sửa tên Context

        public PatientRepository(MedicalDbContext context)
        {
            _context = context;
        }

        // [FIX] Khớp return type với Interface
        public async Task<Patient> AddAsync(Patient patient)
        {
            await _context.Patients.AddAsync(patient);
            await _context.SaveChangesAsync();
            return patient;
        }

        public async Task<Patient?> GetByUserIdAsync(Guid userId)
        {
            return await _context.Patients
                .Include(p => p.MedicalHistories)
                .FirstOrDefaultAsync(p => p.UserId == userId);
        }

        public async Task<Patient?> GetByIdAsync(Guid id)
        {
            return await _context.Patients
                .Include(p => p.MedicalHistories)
                .FirstOrDefaultAsync(p => p.Id == id);
        }

        // [FIX] Implement hàm còn thiếu
        public async Task<Patient?> GetByEmailAsync(string email)
        {
            return await _context.Patients
                .FirstOrDefaultAsync(p => p.Email == email);
        }

        public async Task UpdateAsync(Patient patient)
        {
            _context.Patients.Update(patient);
            await _context.SaveChangesAsync();
        }
    }
}