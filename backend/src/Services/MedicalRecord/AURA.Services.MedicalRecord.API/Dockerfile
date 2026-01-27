# Sử dụng base image cho runtime
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS base
WORKDIR /app
EXPOSE 8080

# Sử dụng SDK image để build
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# 1. Copy các file Project theo cấu trúc thư mục THẬT (backend/src/...)
COPY ["backend/src/BuildingBlocks/AURA.Shared.Kernel/AURA.Shared.Kernel.csproj", "backend/src/BuildingBlocks/AURA.Shared.Kernel/"]
COPY ["backend/src/BuildingBlocks/AURA.Shared.Messaging/AURA.Shared.Messaging.csproj", "backend/src/BuildingBlocks/AURA.Shared.Messaging/"]

COPY ["backend/src/Services/MedicalRecord/AURA.Services.MedicalRecord.API/AURA.Services.MedicalRecord.API.csproj", "backend/src/Services/MedicalRecord/AURA.Services.MedicalRecord.API/"]
COPY ["backend/src/Services/MedicalRecord/AURA.Services.MedicalRecord.Application/AURA.Services.MedicalRecord.Application.csproj", "backend/src/Services/MedicalRecord/AURA.Services.MedicalRecord.Application/"]
COPY ["backend/src/Services/MedicalRecord/AURA.Services.MedicalRecord.Domain/AURA.Services.MedicalRecord.Domain.csproj", "backend/src/Services/MedicalRecord/AURA.Services.MedicalRecord.Domain/"]
COPY ["backend/src/Services/MedicalRecord/AURA.Services.MedicalRecord.Infrastructure/AURA.Services.MedicalRecord.Infrastructure.csproj", "backend/src/Services/MedicalRecord/AURA.Services.MedicalRecord.Infrastructure/"]

# 2. Restore (Sử dụng đường dẫn đầy đủ)
RUN dotnet restore "backend/src/Services/MedicalRecord/AURA.Services.MedicalRecord.API/AURA.Services.MedicalRecord.API.csproj"

# 3. Copy toàn bộ mã nguồn
COPY . .

# 4. Build
WORKDIR "/src/backend/src/Services/MedicalRecord/AURA.Services.MedicalRecord.API"
RUN dotnet build "AURA.Services.MedicalRecord.API.csproj" -c Release -o /app/build

# 5. Publish
FROM build AS publish
RUN dotnet publish "AURA.Services.MedicalRecord.API.csproj" -c Release -o /app/publish /p:UseAppHost=false

# 6. Final stage
FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "AURA.Services.MedicalRecord.API.dll"]