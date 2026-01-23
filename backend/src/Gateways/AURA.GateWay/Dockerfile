# Stage 1: Build & Publish
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /app

# 1. Copy toàn bộ source code vào
COPY . ./src/

# 2. Chuyển vào thư mục dự án Gateway
WORKDIR /app/src/backend/src/Gateways/AURA.GateWay

# [TẠO FILE] Tự tạo file ocelot.json ngay tại chỗ
RUN echo '{ \
  "Routes": [ \
    { \
      "DownstreamPathTemplate": "/api/imaging/{everything}", \
      "DownstreamScheme": "http", \
      "DownstreamHostAndPorts": [ { "Host": "imaging-service", "Port": 8080 } ], \
      "UpstreamPathTemplate": "/api/imaging/{everything}", \
      "UpstreamHttpMethod": [ "GET", "POST", "DELETE" ] \
    }, \
    { \
      "DownstreamPathTemplate": "/api/hardware/{everything}", \
      "DownstreamScheme": "http", \
      "DownstreamHostAndPorts": [ { "Host": "imaging-service", "Port": 8080 } ], \
      "UpstreamPathTemplate": "/api/hardware/{everything}", \
      "UpstreamHttpMethod": [ "POST" ] \
    }, \
    { \
      "DownstreamPathTemplate": "/api/medical-records/{everything}", \
      "DownstreamScheme": "http", \
      "DownstreamHostAndPorts": [ { "Host": "medical-record-service", "Port": 8080 } ], \
      "UpstreamPathTemplate": "/api/medical-records/{everything}", \
      "UpstreamHttpMethod": [ "GET", "POST", "PUT" ] \
    }, \
    { \
      "DownstreamPathTemplate": "/api/data-sync/{everything}", \
      "DownstreamScheme": "http", \
      "DownstreamHostAndPorts": [ { "Host": "medical-record-service", "Port": 8080 } ], \
      "UpstreamPathTemplate": "/api/data-sync/{everything}", \
      "UpstreamHttpMethod": [ "POST" ] \
    }, \
    { \
      "DownstreamPathTemplate": "/api/auth/{everything}", \
      "DownstreamScheme": "http", \
      "DownstreamHostAndPorts": [ { "Host": "identity-service", "Port": 8080 } ], \
      "UpstreamPathTemplate": "/api/auth/{everything}", \
      "UpstreamHttpMethod": [ "POST", "GET", "PUT" ] \
    }, \
    { \
      "DownstreamPathTemplate": "/api/admin/{everything}", \
      "DownstreamScheme": "http", \
      "DownstreamHostAndPorts": [ { "Host": "identity-service", "Port": 8080 } ], \
      "UpstreamPathTemplate": "/api/admin/{everything}", \
      "UpstreamHttpMethod": [ "GET", "POST", "PUT", "DELETE" ] \
    }, \
    { \
      "DownstreamPathTemplate": "/api/billing/{everything}", \
      "DownstreamScheme": "http", \
      "DownstreamHostAndPorts": [ { "Host": "billing-service", "Port": 8080 } ], \
      "UpstreamPathTemplate": "/api/billing/{everything}", \
      "UpstreamHttpMethod": [ "GET", "POST" ] \
    }, \
    { \
      "DownstreamPathTemplate": "/hubs/notifications", \
      "DownstreamScheme": "ws", \
      "DownstreamHostAndPorts": [ { "Host": "notification-service", "Port": 8080 } ], \
      "UpstreamPathTemplate": "/hubs/notifications", \
      "UpstreamHttpMethod": [ "GET", "POST", "PUT", "DELETE", "OPTIONS" ] \
    } \
  ], \
  "GlobalConfiguration": { \
    "BaseUrl": "http://localhost:8000" \
  } \
}' > ocelot.json

# 3. Publish
RUN dotnet publish "AURA.GateWay.csproj" -c Release -o /app/publish

# [FIX QUAN TRỌNG NHẤT] Copy file ocelot.json vừa tạo vào thư mục publish
# Nếu không có dòng này, file sẽ bị bỏ lại, không sang được Stage 2
RUN cp ocelot.json /app/publish/

# Stage 2: Run
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS final
WORKDIR /app
# Copy toàn bộ nội dung từ thư mục publish (đã bao gồm ocelot.json nhờ lệnh cp ở trên)
COPY --from=build /app/publish .
ENTRYPOINT ["dotnet", "AURA.GateWay.dll"]