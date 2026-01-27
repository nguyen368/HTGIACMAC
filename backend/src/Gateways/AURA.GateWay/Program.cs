using Ocelot.DependencyInjection;
using Ocelot.Middleware;

var builder = WebApplication.CreateBuilder(args);

builder.Configuration
    .SetBasePath(builder.Environment.ContentRootPath)
    .AddJsonFile("appsettings.json", true, true)
    .AddJsonFile("Ocelot.json", optional: false, reloadOnChange: true)
    .AddEnvironmentVariables();

builder.Services.AddOcelot(builder.Configuration);

builder.Services.AddCors(options => {
    options.AddPolicy("CorsPolicy", policy => policy.AllowAnyOrigin().AllowAnyMethod().AllowAnyHeader());
});

var app = builder.Build();

app.UseCors("CorsPolicy");

// [CỰC KỲ QUAN TRỌNG]: Phải có dòng này để SignalR Handshake không bị hủy
app.UseWebSockets();

await app.UseOcelot();

app.Run();