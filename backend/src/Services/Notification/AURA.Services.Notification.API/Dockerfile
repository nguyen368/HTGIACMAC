FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src
COPY ["backend/src/Services/Notification/AURA.Services.Notification.API/AURA.Services.Notification.API.csproj", "Services/Notification/API/"]
RUN dotnet restore "Services/Notification/API/AURA.Services.Notification.API.csproj"
COPY . .
WORKDIR "/src/backend/src/Services/Notification/AURA.Services.Notification.API"
RUN dotnet build -c Release -o /app/build

FROM build AS publish
RUN dotnet publish -c Release -o /app/publish

FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "AURA.Services.Notification.API.dll"]