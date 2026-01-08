using AURA.Shared.Kernel.CQRS;
using AURA.Shared.Kernel.Wrapper;

namespace AURA.Services.Identity.Application.Users.Queries.Login;

public record LoginResponse(string Token, string FullName, string Role);

// THÊM : IQuery<Result<LoginResponse>> VÀO ĐÂY
public record LoginQuery(string Email, string Password) : IQuery<Result<LoginResponse>>;