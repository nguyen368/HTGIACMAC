using AURA.Services.Identity.Application.Interfaces;
using AURA.Services.Identity.Domain.Entities;
using AURA.Services.Identity.Domain.Repositories;
using AURA.Shared.Kernel.Wrapper;
using MediatR;
using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

namespace AURA.Services.Identity.Application.Users.Commands.RegisterUser
{
    public class RegisterUserHandler : IRequestHandler<RegisterUserCommand, Result<Guid>>
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
            // 1. Kiểm tra Tên đăng nhập
            var existingUserByUsername = await _userRepository.GetByUsernameAsync(request.Username, cancellationToken);
            if (existingUserByUsername != null)
            {
                return Result<Guid>.Failure("Tên đăng nhập này đã được sử dụng.");
            }

            // 2. Kiểm tra Email (Đã sửa lỗi CS1501: Xóa cancellationToken ở đây)
            var existingUserByEmail = await _userRepository.GetByEmailAsync(request.Email);
            if (existingUserByEmail != null)
            {
                return Result<Guid>.Failure("Địa chỉ Email này đã được đăng ký tài khoản.");
            }

            // 3. Mã hóa mật khẩu
            var passwordHash = _passwordHasher.Hash(request.Password);

            // 4. Xác định quyền hạn (Role)
            string role = "Patient";
            string[] validRoles = { "Admin", "Doctor", "Patient", "ClinicAdmin" };
            
            if (!string.IsNullOrEmpty(request.Role) && validRoles.Contains(request.Role))
            {
                role = request.Role;
            }

            // 5. Tạo User mới
            var newUser = new User(
                Guid.NewGuid(),
                request.Username,
                passwordHash,
                request.Email,
                request.FullName ?? "",
                role
            );

            // 6. Lưu vào DB
            await _userRepository.AddAsync(newUser);
            
            return Result<Guid>.Success(newUser.Id);
        }
    }
}