using AURA.Services.Billing.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

//Đăng ký dịch vụ CORS  
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll",
        policy => policy.AllowAnyOrigin()
                        .AllowAnyMethod()
                        .AllowAnyHeader());
});
// Cấu hình kết nối DB
builder.Services.AddDbContext<BillingDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

// =========================================================================
// 👇👇👇 [ĐOẠN CODE MỚI THÊM] TỰ ĐỘNG TẠO BẢNG DATABASE 👇👇👇
// =========================================================================
using (var scope = app.Services.CreateScope())
{
    var services = scope.ServiceProvider;
    try
    {
        var context = services.GetRequiredService<BillingDbContext>();
        context.Database.Migrate(); // Tự động chạy lệnh update-database
        Console.WriteLine("--> [Billing] Đã tự động tạo bảng thành công!");
    }
    catch (Exception ex)
    {
        Console.WriteLine("--> [Billing] Lỗi tạo bảng: " + ex.Message);
    }
}
// 👆👆👆 [KẾT THÚC ĐOẠN CODE MỚI] 👆👆👆
// =========================================================================

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();
//Kích hoạt CORS
app.UseCors("AllowAll");
app.UseAuthorization();
app.MapControllers();

app.Run();