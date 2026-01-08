FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

COPY ["backend/src/BuildingBlocks/AURA.Shared.Kernel/AURA.Shared.Kernel.csproj", "BuildingBlocks/AURA.Shared.Kernel/"]
COPY ["backend/src/Services/MedicalRecord/AURA.Services.MedicalRecord.API/AURA.Services.MedicalRecord.API.csproj", "Services/MedicalRecord/API/"]
COPY ["backend/src/Services/MedicalRecord/AURA.Services.MedicalRecord.Application/AURA.Services.MedicalRecord.Application.csproj", "Services/MedicalRecord/Application/"]
COPY ["backend/src/Services/MedicalRecord/AURA.Services.MedicalRecord.Domain/AURA.Services.MedicalRecord.Domain.csproj", "Services/MedicalRecord/Domain/"]
COPY ["backend/src/Services/MedicalRecord/AURA.Services.MedicalRecord.Infrastructure/AURA.Services.MedicalRecord.Infrastructure.csproj", "Services/MedicalRecord/Infrastructure/"]

RUN dotnet restore "Services/MedicalRecord/API/AURA.Services.MedicalRecord.API.csproj"
COPY . .
WORKDIR "/src/backend/src/Services/MedicalRecord/AURA.Services.MedicalRecord.API"
RUN dotnet build -c Release -o /app/build

FROM build AS publish
RUN dotnet publish -c Release -o /app/publish

FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "AURA.Services.MedicalRecord.API.dll"]