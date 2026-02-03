using Ocelot.DependencyInjection;
using Ocelot.Middleware;
using Prometheus;

var builder = WebApplication.CreateBuilder(args);

// 1. Cấu hình Configuration (Load file Ocelot.json)
builder.Configuration
    .SetBasePath(builder.Environment.ContentRootPath)
    .AddJsonFile("appsettings.json", true, true)
    .AddJsonFile("Ocelot.json", optional: false, reloadOnChange: true)
    .AddEnvironmentVariables();

// 2. Đăng ký dịch vụ Ocelot
builder.Services.AddOcelot(builder.Configuration);

// 3. Cấu hình CORS (Cho phép Frontend truy cập)
builder.Services.AddCors(options => {
    options.AddPolicy("CorsPolicy", policy => 
        policy.AllowAnyOrigin()
              .AllowAnyMethod()
              .AllowAnyHeader());
});

// [Option] Nếu muốn đo metrics của HttpClient bên trong Gateway (để xem Gateway gọi Service khác mất bao lâu)
// builder.Services.UseHttpClientMetrics(); 

var app = builder.Build();

// =================================================================================
// CẤU HÌNH PIPELINE (MIDDLEWARE) - THỨ TỰ CỰC KỲ QUAN TRỌNG
// =================================================================================

app.UseCors("CorsPolicy");

// [QUAN TRỌNG 1] Hỗ trợ WebSocket cho SignalR (Notification Service)
app.UseWebSockets();

// [QUAN TRỌNG 2] Prometheus Metrics
// Kích hoạt thu thập số liệu HTTP (Request count, duration...)
app.UseHttpMetrics(); 

// Mở endpoint /metrics để Prometheus cào dữ liệu
app.MapMetrics(); 

// [FIX LỖI 404 TRIỆT ĐỂ CHO GATEWAY]
// Thay vì gọi thẳng "await app.UseOcelot();", ta dùng MapWhen để lọc.
// Ý nghĩa: "Nếu đường dẫn request KHÔNG BẮT ĐẦU bằng /metrics thì mới chạy Ocelot".
// Điều này giúp request /metrics được Prometheus xử lý (ở dòng app.MapMetrics trên) 
// mà không bị Ocelot chặn lại báo lỗi 404.
app.MapWhen(ctx => !ctx.Request.Path.StartsWithSegments("/metrics"), appBuilder =>
{
    // Ocelot là middleware bất đồng bộ, trong MapWhen ta dùng Wait() để đảm bảo nó chạy xong
    appBuilder.UseOcelot().Wait();
});

app.Run();