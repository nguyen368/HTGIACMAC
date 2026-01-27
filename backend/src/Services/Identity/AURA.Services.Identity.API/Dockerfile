# Stage 1: Base
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS base
WORKDIR /app
EXPOSE 8080

# Stage 2: Build
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# --- 1. COPY FILE CSPROJ (GIỮ NGUYÊN CẤU TRÚC THƯ MỤC GỐC) ---
# Việc giữ nguyên đường dẫn "backend/src/..." là BẮT BUỘC để các file csproj tìm thấy nhau

# Copy Identity Projects
COPY ["backend/src/Services/Identity/AURA.Services.Identity.API/AURA.Services.Identity.API.csproj", "backend/src/Services/Identity/AURA.Services.Identity.API/"]
COPY ["backend/src/Services/Identity/AURA.Services.Identity.Application/AURA.Services.Identity.Application.csproj", "backend/src/Services/Identity/AURA.Services.Identity.Application/"]
COPY ["backend/src/Services/Identity/AURA.Services.Identity.Domain/AURA.Services.Identity.Domain.csproj", "backend/src/Services/Identity/AURA.Services.Identity.Domain/"]
COPY ["backend/src/Services/Identity/AURA.Services.Identity.Infrastructure/AURA.Services.Identity.Infrastructure.csproj", "backend/src/Services/Identity/AURA.Services.Identity.Infrastructure/"]

# Copy Building Blocks Projects
COPY ["backend/src/BuildingBlocks/AURA.Shared.Kernel/AURA.Shared.Kernel.csproj", "backend/src/BuildingBlocks/AURA.Shared.Kernel/"]
COPY ["backend/src/BuildingBlocks/AURA.Shared.Messaging/AURA.Shared.Messaging.csproj", "backend/src/BuildingBlocks/AURA.Shared.Messaging/"]
COPY ["backend/src/BuildingBlocks/AURA.Shared.Infra/AURA.Shared.Infra.csproj", "backend/src/BuildingBlocks/AURA.Shared.Infra/"]

# --- 2. RESTORE ---
# Chuyển vào đúng thư mục chứa API csproj để restore
WORKDIR "/src/backend/src/Services/Identity/AURA.Services.Identity.API"
RUN dotnet restore "AURA.Services.Identity.API.csproj"

# --- 3. COPY SOURCE CODE ---
WORKDIR "/src"
COPY ["backend/src/Services/Identity/", "backend/src/Services/Identity/"]
COPY ["backend/src/BuildingBlocks/", "backend/src/BuildingBlocks/"]

# --- 4. BUILD ---
WORKDIR "/src/backend/src/Services/Identity/AURA.Services.Identity.API"
RUN dotnet build "AURA.Services.Identity.API.csproj" -c Release -o /app/build

# Stage 3: Publish
FROM build AS publish
RUN dotnet publish "AURA.Services.Identity.API.csproj" -c Release -o /app/publish /p:UseAppHost=false

# Stage 4: Final
FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "AURA.Services.Identity.API.dll"]