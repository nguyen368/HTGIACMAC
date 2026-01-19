using AURA.Services.Identity.Domain.Repositories;
using AURA.Services.Identity.Domain.Entities;
using AURA.Shared.Kernel.Wrapper;
using MediatR;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

namespace AURA.Services.Identity.Application.Users.Queries.GetPatients;

// Data Transfer Object để gửi về Frontend
public class PatientDto
{
    public Guid Id { get; set; }
    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Username { get; set; } = string.Empty;
}

// Định nghĩa Query trả về Result chứa danh sách DTO
public record GetPatientsQuery : IRequest<Result<List<PatientDto>>>;

public class GetPatientsQueryHandler : IRequestHandler<GetPatientsQuery, Result<List<PatientDto>>>
{
    private readonly IUserRepository _userRepository;

    public GetPatientsQueryHandler(IUserRepository userRepository)
    {
        _userRepository = userRepository;
    }

    public async Task<Result<List<PatientDto>>> Handle(GetPatientsQuery request, CancellationToken cancellationToken)
    {
        // 1. Lấy tất cả user từ Repository
        var allUsers = await _userRepository.GetAllAsync(cancellationToken);

        // 2. Lọc ra những người có Role là "Patient"
        var patientList = allUsers
            .Where(u => u.Role == "Patient")
            .Select(u => new PatientDto
            {
                Id = u.Id,
                FullName = u.FullName ?? string.Empty,
                Email = u.Email ?? string.Empty,
                Username = u.Username ?? string.Empty
            }).ToList();

        // 3. Trả về kết quả thành công kèm danh sách
        return Result<List<PatientDto>>.Success(patientList);
    }
}