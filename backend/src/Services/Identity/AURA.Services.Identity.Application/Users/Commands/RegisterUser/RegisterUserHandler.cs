using AURA.Services.Identity.Application.Interfaces;
using AURA.Services.Identity.Domain.Entities;
using AURA.Services.Identity.Domain.Repositories;
using AURA.Shared.Kernel.CQRS;
using AURA.Shared.Kernel.Wrapper;

namespace AURA.Services.Identity.Application.Users.Commands.RegisterUser;

public class RegisterUserHandler : ICommandHandler<RegisterUserCommand, Result<Guid>>
{
    private readonly IUserRepository _userRepository;
    private readonly IPasswordHasher _passwordHasher;

    public RegisterUserHandler(IUserRepository userRepository, IPasswordHasher passwordHasher)
    {
        _userRepository = userRepository;
        _passwordHasher = passwordHasher;
    }

    public async Task<Result<Guid>> Handle(RegisterUserCommand request, CancellationToken cancellationToken)
    {
        // 1. Kiểm tra Email đã tồn tại trong hệ thống chưa
        var emailExists = await _userRepository.ExistsAsync(request.Email);
        if (emailExists)
        {
            return Result<Guid>.Failure("Email này đã được đăng ký trong hệ thống.");
        }

        // 2. Kiểm tra vai trò (Role) có hợp lệ không
        var validRoles = new[] { "Admin", "Clinic", "Doctor", "Patient" };
        if (!validRoles.Contains(request.Role))
        {
            return Result<Guid>.Failure("Vai trò người dùng không hợp lệ.");
        }

        // 3. Mã hóa mật khẩu trước khi lưu vào Database (NFR-12: Security)
        var passwordHash = _passwordHasher.Hash(request.Password);

        // 4. Khởi tạo thực thể User từ Domain
        var user = new User(
            request.Email,
            passwordHash,
            request.FullName,
            request.Role
        );

        // 5. Lưu vào cơ sở dữ liệu qua Repository
        try 
        {
            await _userRepository.AddAsync(user);
            // Lưu ý: UnitOfWork.SaveChangesAsync() thường được gọi bên trong Repository.AddAsync 
            // hoặc ở cuối Handler tùy vào cách bạn thiết lập Repository.
            
            return Result<Guid>.Success(user.Id);
        }
        catch (Exception ex)
        {
            // Log lỗi tại đây nếu cần
            return Result<Guid>.Failure($"Có lỗi xảy ra khi tạo tài khoản: {ex.Message}");
        }
    }
}