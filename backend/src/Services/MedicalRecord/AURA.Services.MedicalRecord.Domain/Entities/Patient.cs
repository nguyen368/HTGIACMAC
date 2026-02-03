using AURA.Shared.Kernel.Primitives;
using System;
using System.Collections.Generic;
using System.Linq;

namespace AURA.Services.MedicalRecord.Domain.Entities;

public class Patient : AggregateRoot
{
    public Guid UserId { get; private set; }
    public Guid ClinicId { get; private set; } 
    public string FullName { get; private set; } = string.Empty;
    public string Email { get; private set; } = string.Empty; // [FIX] Đã thêm lại Email
    public DateTime DateOfBirth { get; private set; }
    public string Gender { get; private set; } = string.Empty;
    public string PhoneNumber { get; private set; } = string.Empty;
    public string Address { get; private set; } = string.Empty;
    
    // Thuộc tính AvatarUrl mới
    public string? AvatarUrl { get; private set; }

    private readonly List<MedicalHistory> _medicalHistories = new();
    public IReadOnlyCollection<MedicalHistory> MedicalHistories => _medicalHistories.AsReadOnly();

    // Constructor rỗng cho EF Core
    private Patient() { } 

    // Constructor chính
    public Patient(Guid userId, Guid clinicId, string fullName, DateTime dateOfBirth, string gender, string phoneNumber, string address, string email = "")
    {
        Id = Guid.NewGuid();
        UserId = userId;
        ClinicId = clinicId;
        FullName = fullName;
        DateOfBirth = dateOfBirth;
        Gender = gender;
        PhoneNumber = phoneNumber;
        Address = address;
        Email = email; // Gán email (mặc định rỗng nếu không truyền)
    }

    public void UpdateInfo(string fullName, DateTime dateOfBirth, string gender, string phoneNumber, string address)
    {
        FullName = fullName;
        DateOfBirth = dateOfBirth;
        Gender = gender;
        PhoneNumber = phoneNumber;
        Address = address;
    }

    // Phương thức cập nhật Avatar
    public void UpdateAvatar(string avatarUrl)
    {
        AvatarUrl = avatarUrl;
    }

    // Phương thức thêm lịch sử bệnh
    public void AddMedicalHistory(string condition, string description, DateTime diagnosedDate)
    {
        var history = new MedicalHistory(Id, condition, description, diagnosedDate);
        _medicalHistories.Add(history);
    }
}