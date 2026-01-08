FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

COPY ["src/Gateways/AURA.GateWay/AURA.GateWay.csproj", "Gateways/AURA.GateWay/"]
RUN dotnet restore "Gateways/AURA.GateWay/AURA.GateWay.csproj"

COPY . .
WORKDIR "/src/Gateways/AURA.GateWay"
RUN dotnet build -c Release -o /app/build

FROM build AS publish
RUN dotnet publish -c Release -o /app/publish

FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS final
WORKDIR /app
COPY --from=publish /app/publish .
# Copy thêm các file config quan trọng cho Gateway
COPY --from=publish /app/publish/Ocelot.json .
ENTRYPOINT ["dotnet", "AURA.GateWay.dll"]