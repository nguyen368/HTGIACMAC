using AURA.Services.Identity.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace AURA.Services.Identity.Infrastructure.Data
{
    public static class DbInitializer
    {
        public static async Task SeedDataAsync(AppIdentityDbContext context)
        {
            // 1. Tự động chạy Migration để tạo bảng nếu chưa có
            await context.Database.MigrateAsync();

            // 2. Nếu đã có User thì không chạy nữa (Tránh duplicate dữ liệu)
            if (await context.Users.AnyAsync()) return;

            // 3. TẠO DỮ LIỆU MẪU
            
            // --- A. Tạo Phòng Khám ---
            var clinic = new Clinic("Phòng Khám Mắt AURA Sài Gòn", "123 Võ Văn Tần, Q3, TP.HCM", "LICENSE-AURA-001");
            clinic.Approve(); // Set trạng thái Active
            context.Clinics.Add(clinic);
            
            // Lưu ngay để clinic có ID
            await context.SaveChangesAsync(); 

            // Password Hash mẫu cho "Aura@123"
            // Đây là hash của BCrypt, dùng chung cho tất cả user mẫu
            string defaultPassHash = "$2a$11$Z5.z5.z5.z5.z5.z5.z5.z5.z5.z5.z5.z5.z5.z5.z5.z5.z5"; 

            // --- B. Tạo Các User ---
            var users = new[]
            {
                // System Admin (Quản trị toàn hệ thống)
                new User(Guid.NewGuid(), "admin", defaultPassHash, "admin@aura.com", "System Administrator", "SuperAdmin", null),
                
                // Clinic Admin (Quản lý phòng khám vừa tạo)
                new User(Guid.NewGuid(), "manager", defaultPassHash, "manager@clinic.com", "Trưởng Phòng Khám", "ClinicAdmin", clinic.Id),
                
                // Doctor (Bác sĩ thuộc phòng khám này)
                new User(Guid.NewGuid(), "doctor", defaultPassHash, "doctor@clinic.com", "BS. Nguyễn Văn A", "Doctor", clinic.Id),
                
                // Patient (Bệnh nhân demo)
                new User(Guid.NewGuid(), "patient", defaultPassHash, "patient@gmail.com", "Trần Văn Bệnh", "Patient", null)
            };

            context.Users.AddRange(users);
            await context.SaveChangesAsync();
        }
    }
}