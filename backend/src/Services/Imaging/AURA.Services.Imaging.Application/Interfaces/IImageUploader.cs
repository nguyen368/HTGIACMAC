using Microsoft.AspNetCore.Http;
using System.IO;
using System.Threading.Tasks;

namespace AURA.Services.Imaging.Application.Interfaces;

public interface IImageUploader
{
    Task<(string Url, string PublicId)> UploadAsync(IFormFile file);
    
    Task<(string Url, string PublicId)> UploadStreamAsync(Stream stream, string fileName);
}