using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AURA.Services.Billing.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class FixBillAmountColumn : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<decimal>(
                name: "Amount",
                table: "Bills",
                type: "numeric",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<Guid>(
                name: "ClinicId",
                table: "Bills",
                type: "uuid",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"));

            migrationBuilder.AddColumn<DateTime>(
                name: "PaidAt",
                table: "Bills",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "ReferenceId",
                table: "Bills",
                type: "uuid",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"));

            migrationBuilder.AddColumn<string>(
                name: "Type",
                table: "Bills",
                type: "text",
                nullable: false,
                defaultValue: "");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Amount",
                table: "Bills");

            migrationBuilder.DropColumn(
                name: "ClinicId",
                table: "Bills");

            migrationBuilder.DropColumn(
                name: "PaidAt",
                table: "Bills");

            migrationBuilder.DropColumn(
                name: "ReferenceId",
                table: "Bills");

            migrationBuilder.DropColumn(
                name: "Type",
                table: "Bills");
        }
    }
}
