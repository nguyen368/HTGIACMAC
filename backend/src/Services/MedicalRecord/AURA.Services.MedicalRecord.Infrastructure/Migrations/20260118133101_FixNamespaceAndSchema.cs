using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AURA.Services.MedicalRecord.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class FixNamespaceAndSchema : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "DiagnosisResult",
                table: "Examinations",
                newName: "Diagnosis");

            migrationBuilder.AddColumn<Guid>(
                name: "DoctorId",
                table: "Examinations",
                type: "uuid",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"));

            migrationBuilder.AddColumn<Guid>(
                name: "ImageId",
                table: "Examinations",
                type: "uuid",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"));

            migrationBuilder.CreateIndex(
                name: "IX_Examinations_PatientId",
                table: "Examinations",
                column: "PatientId");

            migrationBuilder.AddForeignKey(
                name: "FK_Examinations_Patients_PatientId",
                table: "Examinations",
                column: "PatientId",
                principalTable: "Patients",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Examinations_Patients_PatientId",
                table: "Examinations");

            migrationBuilder.DropIndex(
                name: "IX_Examinations_PatientId",
                table: "Examinations");

            migrationBuilder.DropColumn(
                name: "DoctorId",
                table: "Examinations");

            migrationBuilder.DropColumn(
                name: "ImageId",
                table: "Examinations");

            migrationBuilder.RenameColumn(
                name: "Diagnosis",
                table: "Examinations",
                newName: "DiagnosisResult");
        }
    }
}
