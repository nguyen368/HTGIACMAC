FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

COPY ["backend/src/BuildingBlocks/AURA.Shared.Kernel/AURA.Shared.Kernel.csproj", "BuildingBlocks/AURA.Shared.Kernel/"]
COPY ["backend/src/Services/Billing/AURA.Services.Billing.API/AURA.Services.Billing.API.csproj", "Services/Billing/API/"]
COPY ["backend/src/Services/Billing/AURA.Services.Billing.Application/AURA.Services.Billing.Application.csproj", "Services/Billing/Application/"]
COPY ["backend/src/Services/Billing/AURA.Services.Billing.Domain/AURA.Services.Billing.Domain.csproj", "Services/Billing/Domain/"]
COPY ["backend/src/Services/Billing/AURA.Services.Billing.Infrastructure/AURA.Services.Billing.Infrastructure.csproj", "Services/Billing/Infrastructure/"]

RUN dotnet restore "Services/Billing/API/AURA.Services.Billing.API.csproj"
COPY . .
WORKDIR "/src/backend/src/Services/Billing/AURA.Services.Billing.API"
RUN dotnet build -c Release -o /app/build

FROM build AS publish
RUN dotnet publish -c Release -o /app/publish

FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "AURA.Services.Billing.API.dll"]