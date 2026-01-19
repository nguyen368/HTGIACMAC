using AURA.Shared.Kernel.Primitives;

namespace AURA.Services.MedicalRecord.Domain.Entities;

public class Patient : AggregateRoot
{
    // --- 1. Properties (Thuộc tính cơ bản) ---
    public Guid UserId { get; private set; } // Link tới Identity Service
    public string FullName { get; private set; }
    public DateTime DateOfBirth { get; private set; }
    public string Gender { get; private set; }
    public string PhoneNumber { get; private set; }
    public string Address { get; private set; }

    // --- 2. Relationships (Quan hệ 1-N với Tiền sử bệnh) ---
    private readonly List<MedicalHistory> _medicalHistories = new();
    public IReadOnlyCollection<MedicalHistory> MedicalHistories => _medicalHistories.AsReadOnly();

    // --- 3. Constructor (Hàm khởi tạo) ---
    public Patient(Guid userId, string fullName, DateTime dob, string gender, string phoneNumber, string address)
    {
        Id = Guid.NewGuid();
        UserId = userId;     
        FullName = fullName;
        DateOfBirth = dob;
        Gender = gender;
        PhoneNumber = phoneNumber;
        Address = address;
    }

    // Constructor rỗng (QUAN TRỌNG: Để EF Core hoạt động)
    private Patient()
    {
        FullName = null!;
        Gender = null!;
        PhoneNumber = null!;
        Address = null!;
    }

    // --- 4. Domain Methods (Các hành vi nghiệp vụ) ---

    // Hành vi 1: Cập nhật thông tin cá nhân
    public void UpdateInfo(string fullName, DateTime dob, string gender, string phone, string address)
    {
        FullName = fullName;
        DateOfBirth = dob;
        Gender = gender;
        PhoneNumber = phone;
        Address = address;
    }

    // Hành vi 2: Thêm tiền sử bệnh mới
    public void AddMedicalHistory(string condition, string description, DateTime diagnosedDate)
    {
        var history = new MedicalHistory(Id, condition, description, diagnosedDate);
        _medicalHistories.Add(history);
    }
}