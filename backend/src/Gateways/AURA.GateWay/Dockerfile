# Stage 1: Build & Publish
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /app

# 1. Copy toàn bộ source code vào container
COPY . ./src/

# 2. Chuyển vào thư mục dự án Gateway
WORKDIR /app/src/backend/src/Gateways/AURA.GateWay

# 3. Publish ra thư mục /app/publish
RUN dotnet publish "AURA.GateWay.csproj" -c Release -o /app/publish

# [FIX] Dùng lệnh cp để copy file Ocelot.json (đã có trong source code) sang thư mục publish
# Lệnh này thay thế cho lệnh RUN echo... gây lỗi cũ
RUN cp Ocelot.json /app/publish/

# Stage 2: Run
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS final
WORKDIR /app
COPY --from=build /app/publish .
ENTRYPOINT ["dotnet", "AURA.GateWay.dll"]