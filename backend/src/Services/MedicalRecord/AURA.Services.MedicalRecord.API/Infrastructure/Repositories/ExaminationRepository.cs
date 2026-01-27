using AURA.Services.MedicalRecord.Application.Interfaces;
using AURA.Services.MedicalRecord.Domain.Entities;
using AURA.Services.MedicalRecord.Infrastructure.Data; // Trỏ đúng Data
using Microsoft.EntityFrameworkCore;

namespace AURA.Services.MedicalRecord.Infrastructure.Repositories
{
    public class ExaminationRepository : IExaminationRepository
    {
        private readonly MedicalDbContext _context;

        public ExaminationRepository(MedicalDbContext context)
        {
            _context = context;
        }

        public async Task<Examination> AddAsync(Examination examination)
        {
            await _context.Examinations.AddAsync(examination);
            await _context.SaveChangesAsync();
            return examination;
        }

        public async Task<Examination?> GetByIdAsync(Guid id)
        {
            return await _context.Examinations
                .Include(e => e.Patient)
                .FirstOrDefaultAsync(e => e.Id == id);
        }

        // [FIX] Implement hàm thiếu
        public async Task<IEnumerable<Examination>> GetByPatientIdAsync(Guid patientId)
        {
            return await _context.Examinations
                .Where(e => e.PatientId == patientId)
                .OrderByDescending(e => e.ExamDate)
                .ToListAsync();
        }

        // [FIX] Implement hàm thiếu
        public async Task<IEnumerable<Examination>> GetByClinicIdAsync(Guid clinicId)
        {
            return await _context.Examinations
                .Include(e => e.Patient)
                .Where(e => e.Patient != null && e.Patient.ClinicId == clinicId)
                .ToListAsync();
        }

        public async Task UpdateAsync(Examination examination)
        {
            _context.Examinations.Update(examination);
            await _context.SaveChangesAsync();
        }
    }
}