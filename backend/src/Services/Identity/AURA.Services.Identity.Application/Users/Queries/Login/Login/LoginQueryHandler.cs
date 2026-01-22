using AURA.Services.Identity.Application.Interfaces;
using AURA.Services.Identity.Domain.Repositories;
using AURA.Shared.Kernel.CQRS;
using AURA.Shared.Kernel.Wrapper;

namespace AURA.Services.Identity.Application.Users.Queries.Login;

public class LoginQueryHandler : IQueryHandler<LoginQuery, Result<LoginResponse>>
{
    private readonly IUserRepository _userRepository;
    private readonly IPasswordHasher _passwordHasher;
    private readonly IJwtTokenService _jwtTokenService;

    public LoginQueryHandler(
        IUserRepository userRepository, 
        IPasswordHasher passwordHasher, 
        IJwtTokenService jwtTokenService)
    {
        _userRepository = userRepository;
        _passwordHasher = passwordHasher;
        _jwtTokenService = jwtTokenService;
    }

    public async Task<Result<LoginResponse>> Handle(LoginQuery request, CancellationToken cancellationToken)
    {
        // 1. Tìm người dùng theo Email
        var user = await _userRepository.GetByEmailAsync(request.Email);
        if (user == null)
        {
            return Result<LoginResponse>.Failure("Email hoặc mật khẩu không chính xác.");
        }

        // 2. Kiểm tra mật khẩu (Băm và so sánh)
        var isPasswordValid = _passwordHasher.Verify(request.Password, user.PasswordHash);
        if (!isPasswordValid)
        {
            return Result<LoginResponse>.Failure("Email hoặc mật khẩu không chính xác.");
        }

        // --- CODE MỚI: KIỂM TRA TRẠNG THÁI KÍCH HOẠT ---
        // Nếu tài khoản bị vô hiệu hóa (IsActive = false), từ chối đăng nhập
        if (!user.IsActive)
        {
            return Result<LoginResponse>.Failure("Tài khoản của bạn đang chờ quản trị viên hệ thống xác minh và phê duyệt.");
        }

        // 3. Tạo JWT Token chứa thông tin User và Role (Lúc này Token đã có ClinicId như bạn vừa sửa)
        var token = _jwtTokenService.GenerateToken(user);

        // 4. Trả về thông tin đăng nhập thành công
        return Result<LoginResponse>.Success(new LoginResponse(
            token,
            user.FullName,
            user.Role
        ));
    }
}