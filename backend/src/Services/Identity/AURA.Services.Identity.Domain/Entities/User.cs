using AURA.Shared.Kernel.Primitives;

namespace AURA.Services.Identity.Domain.Entities;

public class User : AggregateRoot
{
    public string Email { get; private set; } = string.Empty;
    public string PasswordHash { get; private set; } = string.Empty;
    public string FullName { get; private set; } = string.Empty;
    public string Role { get; private set; } = string.Empty;
    public bool IsActive { get; private set; }

    public User(string email, string passwordHash, string fullName, string role)
    {
        Id = Guid.NewGuid();
        Email = email;
        PasswordHash = passwordHash;
        FullName = fullName;
        Role = role;
        IsActive = true;
    }

    private User() { } 
}