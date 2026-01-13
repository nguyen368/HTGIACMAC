using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AURA.Services.Imaging.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class UpdateImageStatus : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "AiAnalysisResultJson",
                table: "Images",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Status",
                table: "Images",
                type: "text",
                nullable: false,
                defaultValue: "");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "AiAnalysisResultJson",
                table: "Images");

            migrationBuilder.DropColumn(
                name: "Status",
                table: "Images");
        }
    }
}
