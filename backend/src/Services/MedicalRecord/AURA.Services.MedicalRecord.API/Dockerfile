# Sử dụng base image cho runtime
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS base
WORKDIR /app
EXPOSE 8080

# Sử dụng SDK image để build
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# 1. Copy các file Project dùng chung (BuildingBlocks)
COPY ["backend/src/BuildingBlocks/AURA.Shared.Kernel/AURA.Shared.Kernel.csproj", "BuildingBlocks/AURA.Shared.Kernel/"]
COPY ["backend/src/BuildingBlocks/AURA.Shared.Messaging/AURA.Shared.Messaging.csproj", "BuildingBlocks/AURA.Shared.Messaging/"]

# 2. Copy các file Project của Service Medical Record
COPY ["backend/src/Services/MedicalRecord/AURA.Services.MedicalRecord.API/AURA.Services.MedicalRecord.API.csproj", "Services/MedicalRecord/API/"]
COPY ["backend/src/Services/MedicalRecord/AURA.Services.MedicalRecord.Application/AURA.Services.MedicalRecord.Application.csproj", "Services/MedicalRecord/Application/"]
COPY ["backend/src/Services/MedicalRecord/AURA.Services.MedicalRecord.Domain/AURA.Services.MedicalRecord.Domain.csproj", "Services/MedicalRecord/Domain/"]
COPY ["backend/src/Services/MedicalRecord/AURA.Services.MedicalRecord.Infrastructure/AURA.Services.MedicalRecord.Infrastructure.csproj", "Services/MedicalRecord/Infrastructure/"]

# 3. Khôi phục (Restore) các gói NuGet
RUN dotnet restore "Services/MedicalRecord/API/AURA.Services.MedicalRecord.API.csproj"

# 4. Copy toàn bộ mã nguồn và thực hiện Build
COPY . .
WORKDIR "/src/backend/src/Services/MedicalRecord/AURA.Services.MedicalRecord.API"
RUN dotnet build "AURA.Services.MedicalRecord.API.csproj" -c Release -o /app/build

# 5. Publish ứng dụng
FROM build AS publish
RUN dotnet publish "AURA.Services.MedicalRecord.API.csproj" -c Release -o /app/publish /p:UseAppHost=false

# 6. Final stage: Copy dữ liệu đã build vào runtime image
FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "AURA.Services.MedicalRecord.API.dll"]