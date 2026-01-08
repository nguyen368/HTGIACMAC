# Stage 1: Build
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# 1. Copy BuildingBlocks (Vì Imaging có dùng Shared.Kernel)
COPY ["backend/src/BuildingBlocks/AURA.Shared.Kernel/AURA.Shared.Kernel.csproj", "BuildingBlocks/AURA.Shared.Kernel/"]
COPY ["backend/src/BuildingBlocks/AURA.Shared.Infra/AURA.Shared.Infra.csproj", "BuildingBlocks/AURA.Shared.Infra/"]
COPY ["backend/src/BuildingBlocks/AURA.Shared.Messaging/AURA.Shared.Messaging.csproj", "BuildingBlocks/AURA.Shared.Messaging/"]

# 2. Copy Imaging Layers
COPY ["backend/src/Services/Imaging/AURA.Services.Imaging.API/AURA.Services.Imaging.API.csproj", "Services/Imaging/API/"]
COPY ["backend/src/Services/Imaging/AURA.Services.Imaging.Application/AURA.Services.Imaging.Application.csproj", "Services/Imaging/Application/"]
COPY ["backend/src/Services/Imaging/AURA.Services.Imaging.Domain/AURA.Services.Imaging.Domain.csproj", "Services/Imaging/Domain/"]
COPY ["backend/src/Services/Imaging/AURA.Services.Imaging.Infrastructure/AURA.Services.Imaging.Infrastructure.csproj", "Services/Imaging/Infrastructure/"]

# 3. Restore & Build
RUN dotnet restore "Services/Imaging/API/AURA.Services.Imaging.API.csproj"
COPY . .
WORKDIR "/src/backend/src/Services/Imaging/AURA.Services.Imaging.API"
RUN dotnet build -c Release -o /app/build

# Stage 2: Publish
FROM build AS publish
RUN dotnet publish -c Release -o /app/publish

# Stage 3: Final
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "AURA.Services.Imaging.API.dll"]