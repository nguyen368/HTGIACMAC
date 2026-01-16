using AURA.Services.MedicalRecord.Application.DTOs;
using FluentValidation;

// Namespace chuẩn:
namespace AURA.Services.MedicalRecord.Application.Validators;

public class UpdatePatientProfileValidator : AbstractValidator<UpdatePatientProfileRequest>
{
    public UpdatePatientProfileValidator()
    {
        RuleFor(x => x.FullName).NotEmpty().WithMessage("Tên không được để trống");
        RuleFor(x => x.DateOfBirth).LessThan(DateTime.UtcNow).WithMessage("Ngày sinh không hợp lệ");
        RuleFor(x => x.PhoneNumber).Matches(@"^0\d{9}$").WithMessage("SĐT không đúng định dạng");
        RuleFor(x => x.Gender)
    .NotEmpty().WithMessage("Giới tính không được để trống")
    .Must(g => g == "Nam" || g == "Nữ" || g == "Khác")
    .WithMessage("Giới tính chỉ chấp nhận: 'Nam', 'Nữ', hoặc 'Khác'");
    RuleFor(x => x.Address)
    .MaximumLength(500).WithMessage("Địa chỉ không được quá 500 ký tự");
    }

    private bool BeAValidAge(DateTime dob)
    {
        var age = DateTime.UtcNow.Year - dob.Year;
        return age <= 150 && age >= 0;
    }
}