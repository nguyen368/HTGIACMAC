using AURA.Shared.Kernel.Primitives;

namespace AURA.Services.MedicalRecord.Domain.Entities;

public class Patient : AggregateRoot
{
    // --- 1. Properties ---
    public Guid UserId { get; private set; } 
    public Guid ClinicId { get; private set; } // [BỔ SUNG] Để lọc theo phòng khám
    public string FullName { get; private set; }
    public DateTime DateOfBirth { get; private set; }
    public string Gender { get; private set; }
    public string PhoneNumber { get; private set; }
    public string Address { get; private set; }

    // --- 2. Relationships ---
    private readonly List<MedicalHistory> _medicalHistories = new();
    public IReadOnlyCollection<MedicalHistory> MedicalHistories => _medicalHistories.AsReadOnly();

    // --- 3. Constructors ---
    public Patient(Guid userId, Guid clinicId, string fullName, DateTime dob, string gender, string phoneNumber, string address)
    {
        Id = Guid.NewGuid();
        UserId = userId;
        ClinicId = clinicId; // [CẬP NHẬT]
        FullName = fullName;
        DateOfBirth = dob;
        Gender = gender;
        PhoneNumber = phoneNumber;
        Address = address;
    }

    private Patient()
    {
        FullName = null!;
        Gender = null!;
        PhoneNumber = null!;
        Address = null!;
    }

    // --- 4. Methods ---
    public void UpdateInfo(string fullName, DateTime dob, string gender, string phone, string address)
    {
        FullName = fullName;
        DateOfBirth = dob;
        Gender = gender;
        PhoneNumber = phone;
        Address = address;
    }

    public void AddMedicalHistory(string condition, string description, DateTime diagnosedDate)
    {
        var history = new MedicalHistory(Id, condition, description, diagnosedDate);
        _medicalHistories.Add(history);
    }
}