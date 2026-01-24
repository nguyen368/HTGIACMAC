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

            // Khởi tạo Firebase App nếu chưa tồn tại
            if (FirebaseApp.DefaultInstance == null)
            {
                try 
                {
                    // Lưu ý: Trong môi trường thực tế, cần file firebase-service-account.json
                    // Ở chế độ demo, chúng ta sử dụng Default Credentials
                    FirebaseApp.Create(new AppOptions()
                    {
                        Credential = GoogleCredential.GetApplicationDefault(), 
                        ProjectId = "demo-aura" 
                    });
                }
                catch (Exception ex)
                {
                    _logger.LogWarning($"Firebase App Init (Dự kiến lỗi nếu thiếu file JSON): {ex.Message}");
                }
            }
        }

        /// <summary>
        /// Xác thực Token từ Frontend gửi lên và trả về Firebase UID
        /// </summary>
        public async Task<string> VerifyTokenAsync(string idToken)
        {
            if (string.IsNullOrEmpty(idToken)) return null;

            try
            {
                // Nếu đang dùng Emulator hoặc không có Firebase cấu hình, trả về ID giả để demo tiếp
                if (FirebaseApp.DefaultInstance == null) return "fake-firebase-id-for-demo";

                var decodedToken = await FirebaseAdmin.Auth.FirebaseAuth.DefaultInstance.VerifyIdTokenAsync(idToken);
                return decodedToken.Uid;
            }
            catch (Exception ex)
            {
                _logger.LogError($"Firebase Token Error: {ex.Message}");
                // Trong trường hợp lỗi do chưa cấu hình Firebase, trả về null để AuthController xử lý
                return null; 
            }
        }
    }
}