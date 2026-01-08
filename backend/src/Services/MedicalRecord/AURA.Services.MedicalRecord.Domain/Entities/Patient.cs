using AURA.Shared.Kernel.Primitives;

namespace AURA.Services.MedicalRecord.Domain.Entities;

public class Patient : AggregateRoot
{
    public string FullName { get; private set; }
    public DateTime DateOfBirth { get; private set; }
    public string Gender { get; private set; }
    public string PhoneNumber { get; private set; }
    public string Address { get; private set; }

    public Patient(string fullName, DateTime dob, string gender, string phoneNumber, string address)
    {
        Id = Guid.NewGuid();
        FullName = fullName;
        DateOfBirth = dob;
        Gender = gender;
        PhoneNumber = phoneNumber;
        Address = address;
    }
    
    // Constructor r?ng (B?t bu?c cho EF Core)
    private Patient() { }
}
