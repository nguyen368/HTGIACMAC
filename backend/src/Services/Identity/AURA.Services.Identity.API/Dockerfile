# Stage 1: Build
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# 1. Copy BuildingBlocks (Rất quan trọng để tránh lỗi thiếu project reference)
COPY ["backend/src/BuildingBlocks/AURA.Shared.Kernel/AURA.Shared.Kernel.csproj", "BuildingBlocks/AURA.Shared.Kernel/"]
COPY ["backend/src/BuildingBlocks/AURA.Shared.Infra/AURA.Shared.Infra.csproj", "BuildingBlocks/AURA.Shared.Infra/"]
COPY ["backend/src/BuildingBlocks/AURA.Shared.Messaging/AURA.Shared.Messaging.csproj", "BuildingBlocks/AURA.Shared.Messaging/"]

# 2. Copy Identity Layers
COPY ["backend/src/Services/Identity/AURA.Services.Identity.API/AURA.Services.Identity.API.csproj", "Services/Identity/API/"]
COPY ["backend/src/Services/Identity/AURA.Services.Identity.Application/AURA.Services.Identity.Application.csproj", "Services/Identity/Application/"]
COPY ["backend/src/Services/Identity/AURA.Services.Identity.Domain/AURA.Services.Identity.Domain.csproj", "Services/Identity/Domain/"]
COPY ["backend/src/Services/Identity/AURA.Services.Identity.Infrastructure/AURA.Services.Identity.Infrastructure.csproj", "Services/Identity/Infrastructure/"]

# 3. Restore & Build
RUN dotnet restore "Services/Identity/API/AURA.Services.Identity.API.csproj"
COPY . .

WORKDIR "/src/backend/src/Services/Identity/AURA.Services.Identity.API"
RUN dotnet build -c Release -o /app/build

# Stage 2: Publish
FROM build AS publish
RUN dotnet publish -c Release -o /app/publish /p:UseAppHost=false

# Stage 3: Final
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "AURA.Services.Identity.API.dll"]