# Sử dụng SDK để build
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# Copy toàn bộ source code backend vào container
COPY . .

# Di chuyển vào thư mục chứa file chạy chính (Aura.API)
WORKDIR /src/Aura.API

# Restore và Build
RUN dotnet restore
RUN dotnet publish -c Release -o /app/out

# Sử dụng Runtime để chạy
FROM mcr.microsoft.com/dotnet/aspnet:8.0
WORKDIR /app
COPY --from=build /app/out .

EXPOSE 8080
ENTRYPOINT ["dotnet", "Aura.API.dll"]