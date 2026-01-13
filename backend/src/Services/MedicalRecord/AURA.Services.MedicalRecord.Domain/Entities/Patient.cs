using AURA.Shared.Kernel.Primitives;

namespace AURA.Services.MedicalRecord.Domain.Entities;

public class Patient : AggregateRoot
{
    // Thêm UserId để map với Identity Service
    public Guid UserId { get; private set; } 
    public string FullName { get; private set; }
    public DateTime DateOfBirth { get; private set; }
    public string Gender { get; private set; }
    public string PhoneNumber { get; private set; }
    public string Address { get; private set; }

    // Constructor cập nhật
    public Patient(Guid userId, string fullName, DateTime dob, string gender, string phoneNumber, string address)
    {
        Id = Guid.NewGuid(); // Id của bản ghi hồ sơ
        UserId = userId;     // Id của tài khoản login
        FullName = fullName;
        DateOfBirth = dob;
        Gender = gender;
        PhoneNumber = phoneNumber;
        Address = address;
    }

    // Hàm cập nhật thông tin (Update)
    public void UpdateInfo(string fullName, DateTime dob, string gender, string phone, string address)
    {
        FullName = fullName;
        DateOfBirth = dob;
        Gender = gender;
        PhoneNumber = phone;
        Address = address;
    }

    private Patient() { }
}