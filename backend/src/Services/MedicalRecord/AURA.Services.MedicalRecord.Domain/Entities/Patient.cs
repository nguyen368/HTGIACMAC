using AURA.Shared.Kernel.Primitives;

namespace AURA.Services.MedicalRecord.Domain.Entities;

public class Patient : AggregateRoot
{
    // --- 1. Properties (Thuộc tính cơ bản) ---
    public Guid UserId { get; private set; } // Link tới Identity Service (Account ID)
    public string FullName { get; private set; }
    public DateTime DateOfBirth { get; private set; }
    public string Gender { get; private set; }
    public string PhoneNumber { get; private set; }
    public string Address { get; private set; }

    // --- 2. Relationships (Quan hệ 1-N với Tiền sử bệnh) ---
    // Sử dụng backing field private để đảm bảo tính đóng gói (Encapsulation)
    private readonly List<MedicalHistory> _medicalHistories = new();
    
    // Public ra ngoài dưới dạng IReadOnlyCollection để bên ngoài chỉ đọc, không sửa trực tiếp List được
    public IReadOnlyCollection<MedicalHistory> MedicalHistories => _medicalHistories.AsReadOnly();

    // --- 3. Constructor (Hàm khởi tạo) ---
    public Patient(Guid userId, string fullName, DateTime dob, string gender, string phoneNumber, string address)
    {
        Id = Guid.NewGuid(); // Tạo ID mới cho hồ sơ bệnh nhân
        UserId = userId;     
        FullName = fullName;
        DateOfBirth = dob;
        Gender = gender;
        PhoneNumber = phoneNumber;
        Address = address;
    }

    // Constructor rỗng (Bắt buộc phải có để Entity Framework Core hoạt động khi query DB)
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
        // Có thể thêm Validate dữ liệu ở đây nếu cần
        FullName = fullName;
        DateOfBirth = dob;
        Gender = gender;
        PhoneNumber = phone;
        Address = address;
    }

    // Hành vi 2: Thêm tiền sử bệnh mới
    public void AddMedicalHistory(string condition, string description, DateTime diagnosedDate)
    {
        // Tạo object MedicalHistory (logic này nằm bên MedicalHistory.cs)
        var history = new MedicalHistory(Id, condition, description, diagnosedDate);
        
        // Thêm vào list quản lý
        _medicalHistories.Add(history);
    }
}