using Microsoft.AspNetCore.Http;
using System;

namespace AURA.Services.Imaging.API.DTOs
{
    public class UploadImageRequest
    {
        public Guid PatientId { get; set; }
        
        // [TV5] Thêm trường này để Controller nhận được ClinicId
        public Guid ClinicId { get; set; } 

        public IFormFile File { get; set; }
    }
}