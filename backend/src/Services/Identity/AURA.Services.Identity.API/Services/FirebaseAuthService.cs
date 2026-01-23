using FirebaseAdmin;
using FirebaseAdmin.Auth;
using Google.Apis.Auth.OAuth2;

namespace AURA.Services.Identity.API.Services
{
    public class FirebaseAuthService
    {
        private readonly ILogger<FirebaseAuthService> _logger;

        public FirebaseAuthService(ILogger<FirebaseAuthService> logger)
        {
            _logger = logger;
            // Khởi tạo Firebase App (Singleton)
            if (FirebaseApp.DefaultInstance == null)
            {
                // Trong thực tế, bạn cần file json credential
                // Ở đây dùng code giả lập cho môi trường dev/emulator
                FirebaseApp.Create(new AppOptions()
                {
                    Credential = GoogleCredential.GetApplicationDefault(), 
                    ProjectId = "demo-aura" 
                });
            }
        }

        public async Task<string> VerifyTokenAsync(string idToken)
        {
            try
            {
                // Verify ID Token gửi từ Frontend
                var decodedToken = await FirebaseAdmin.Auth.FirebaseAuth.DefaultInstance.VerifyIdTokenAsync(idToken);
                return decodedToken.Uid; // Trả về Firebase User ID
            }
            catch (Exception ex)
            {
                _logger.LogError($"Firebase Token Error: {ex.Message}");
                return null;
            }
        }
    }
}