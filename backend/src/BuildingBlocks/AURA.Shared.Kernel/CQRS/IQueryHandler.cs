using MediatR;
namespace AURA.Shared.Kernel.CQRS;

public interface IQueryHandler<in TQuery, TResponse> : IRequestHandler<TQuery, TResponse> 
    where TQuery : IQuery<TResponse> { }