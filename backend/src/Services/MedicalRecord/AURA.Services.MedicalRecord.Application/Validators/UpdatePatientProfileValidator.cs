using AURA.Services.MedicalRecord.Application.DTOs;
using FluentValidation;

namespace AURA.Services.MedicalRecord.Application.Validators;

public class UpdatePatientProfileValidator : AbstractValidator<UpdatePatientProfileRequest>
{
    public UpdatePatientProfileValidator()
    {
        // Tên: Bắt buộc, tối thiểu 2 ký tự
        RuleFor(x => x.FullName)
            .NotEmpty().WithMessage("Vui lòng nhập họ và tên.")
            .MinimumLength(2).WithMessage("Tên quá ngắn (tối thiểu 2 ký tự).")
            .MaximumLength(100).WithMessage("Họ tên quá dài.");

        // Ngày sinh: Bắt buộc, nhỏ hơn hiện tại
        RuleFor(x => x.DateOfBirth)
            .NotEmpty().WithMessage("Vui lòng chọn ngày sinh.")
            .LessThan(DateTime.UtcNow).WithMessage("Ngày sinh không hợp lệ.");

        // SĐT: Bắt buộc, đúng định dạng VN
        RuleFor(x => x.PhoneNumber)
            .NotEmpty().WithMessage("Vui lòng nhập số điện thoại.")
            .Matches(@"^(03|05|07|08|09|01[2|6|8|9])+([0-9]{8})$")
            .WithMessage("SĐT không đúng định dạng (10 số).");

        RuleFor(x => x.Gender)
            .NotEmpty().WithMessage("Vui lòng chọn giới tính.");
    }
}