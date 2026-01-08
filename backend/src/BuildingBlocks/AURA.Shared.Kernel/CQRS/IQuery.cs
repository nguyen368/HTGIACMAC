using MediatR;
namespace AURA.Shared.Kernel.CQRS;

public interface IQuery<out TResponse> : IRequest<TResponse> { }