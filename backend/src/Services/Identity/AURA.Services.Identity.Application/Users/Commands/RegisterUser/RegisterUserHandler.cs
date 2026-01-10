using AURA.Services.Identity.Application.Interfaces; // <-- Đã thêm dòng này
using AURA.Services.Identity.Domain.Entities;
using AURA.Services.Identity.Domain.Repositories;
using AURA.Shared.Kernel.Wrapper;
using MediatR;

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
            var existingUser = await _userRepository.GetByUsernameAsync(request.Username, cancellationToken);
            if (existingUser != null)
            {
                return Result<Guid>.Failure("Username already exists.");
            }

            var passwordHash = _passwordHasher.Hash(request.Password);

            string role = "Patient";
            if (!string.IsNullOrEmpty(request.Role) && (request.Role == "Admin" || request.Role == "Doctor"))
            {
                role = request.Role;
            }

            // Entity đã có Id, Constructor sẽ gán vào property của lớp cha
            var newUser = new User(
                Guid.NewGuid(),
                request.Username,
                passwordHash,
                request.Email,
                request.FullName ?? "",
                role
            );

            await _userRepository.AddAsync(newUser);
            
            return Result<Guid>.Success(newUser.Id);
        }
    }
}