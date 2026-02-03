using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using AURA.Services.Imaging.Infrastructure.Data; // Import namespace chứa DbContext

#nullable disable

namespace AURA.Services.Imaging.Infrastructure.Migrations
{
    // [QUAN TRỌNG] Hai dòng này giúp EF Core nhận diện đây là Migration hợp lệ
    [DbContext(typeof(ImagingDbContext))]
    [Migration("20260129092849_AddRiskLevelColumn")] 
    public partial class AddRiskLevelColumn : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Tạo cột RiskLevel
            migrationBuilder.AddColumn<string>(
                name: "RiskLevel",
                table: "Images",
                type: "text",
                nullable: false,
                defaultValue: "");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // Xóa cột nếu rollback
            migrationBuilder.DropColumn(
                name: "RiskLevel",
                table: "Images");
        }
    }
}