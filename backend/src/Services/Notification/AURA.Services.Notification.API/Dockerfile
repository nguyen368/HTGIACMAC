FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# [BỔ SUNG] Copy BuildingBlocks cần thiết trước khi restore
COPY ["backend/src/BuildingBlocks/AURA.Shared.Messaging/AURA.Shared.Messaging.csproj", "BuildingBlocks/AURA.Shared.Messaging/"]
COPY ["backend/src/Services/Notification/AURA.Services.Notification.API/AURA.Services.Notification.API.csproj", "Services/Notification/API/"]

RUN dotnet restore "Services/Notification/API/AURA.Services.Notification.API.csproj"

COPY . .
WORKDIR "/src/backend/src/Services/Notification/AURA.Services.Notification.API"
RUN dotnet build "AURA.Services.Notification.API.csproj" -c Release -o /app/build

FROM build AS publish
RUN dotnet publish "AURA.Services.Notification.API.csproj" -c Release -o /app/publish

FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "AURA.Services.Notification.API.dll"]