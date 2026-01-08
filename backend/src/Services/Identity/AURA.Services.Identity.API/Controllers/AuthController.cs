using MediatR;
using Microsoft.AspNetCore.Mvc;
using AURA.Services.Identity.Application.Users.Commands.RegisterUser;
using AURA.Services.Identity.Application.Users.Queries.Login;

namespace AURA.Services.Identity.API.Controllers;

[ApiController]
[Route("api/identity/auth")]
public class AuthController : ControllerBase
{
    private readonly ISender _sender;
    public AuthController(ISender sender) => _sender = sender;

    [HttpPost("register")]
    public async Task<IActionResult> Register(RegisterUserCommand command)
    {
        var result = await _sender.Send(command);
        return result.IsSuccess ? Ok(result) : BadRequest(result.Error);
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login(LoginQuery query)
    {
        var result = await _sender.Send(query);
        return result.IsSuccess ? Ok(result) : Unauthorized(result.Error);
    }
}