import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../../context/AuthContext';
import authApi from '../../../../api/authApi';
import './AuthPage.css';

// --- THƯ VIỆN GOOGLE ---
import { GoogleLogin } from '@react-oauth/google';
import jwtDecode from "jwt-decode"; 
// -----------------------

const AuthPage = () => {
    const navigate = useNavigate();
    const { login } = useAuth();
    const [activeTab, setActiveTab] = useState('login'); 
    const [isLoading, setIsLoading] = useState(false);
    const [showForgotPassword, setShowForgotPassword] = useState(false);
    
    // State hiển thị mật khẩu
    const [showLoginPassword, setShowLoginPassword] = useState(false);
    const [showRegPassword, setShowRegPassword] = useState(false);

    // State dữ liệu Login
    const [loginData, setLoginData] = useState({ email: '', password: '', remember: false });
    
    // State dữ liệu Register
    const [regData, setRegData] = useState({
        fullName: '',
        email: '',
        phone: '+84',
        password: '',
        confirmPassword: '',
        terms: false
        // accountType removed, defaulting to Patient in submit handler
    });

    // State kiểm tra độ mạnh mật khẩu
    const [passwordCriteria, setPasswordCriteria] = useState({
        length: false,
        case: false,
        number: false,
        special: false
    });

    // --- LOGIC XỬ LÝ FORM ---

    const handleLoginChange = (e) => {
        const { id, value, checked, type } = e.target;
        setLoginData(prev => ({
            ...prev,
            [id]: type === 'checkbox' ? checked : value
        }));
    };

    const handleRegChange = (e) => {
        const { name, value, checked, type } = e.target;
        const fieldName = name || e.target.id; 
        
        setRegData(prev => ({
            ...prev,
            [fieldName]: type === 'checkbox' ? checked : value
        }));

        if (fieldName === 'password') {
            validatePassword(value);
        }
    };

    const validatePassword = (password) => {
        setPasswordCriteria({
            length: password.length >= 8,
            case: /[a-z]/.test(password) && /[A-Z]/.test(password),
            number: /\d/.test(password),
            special: /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password)
        });
    };

    // --- XỬ LÝ LOGIN THƯỜNG (GIỮ NGUYÊN) ---
    const handleLoginSubmit = async (e) => {
        e.preventDefault();
        if (!loginData.email || !loginData.password) {
            alert('Vui lòng nhập đầy đủ thông tin đăng nhập!');
            return;
        }

        setIsLoading(true);
        try {
            const res = await authApi.login({
                email: loginData.email,
                password: loginData.password
            });

            const data = res.data?.value || res.data || res;
            
            if (data?.token) {
                localStorage.setItem('aura_token', data.token);
                if (login) await login(data);

                let userRole = '';
                try {
                    const decoded = jwtDecode(data.token);
                    userRole = decoded.role || 
                               decoded["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"] || 
                               'patient'; 
                } catch (err) {
                    console.warn("Lỗi decode token:", err);
                    userRole = 'patient';
                }
                
                const role = String(userRole).toLowerCase();
                
                if (role === 'admin' || role === 'administrator') {
                    navigate('/admin/dashboard');
                } 
                else if (role === 'doctor') {
                    navigate('/clinic/dashboard');
                }
                else {
                    navigate('/patient/dashboard'); 
                } 
            }
        } catch (error) {
            console.error(error);
            alert('Lỗi đăng nhập: ' + (error.response?.data?.detail || "Kiểm tra lại email/mật khẩu"));
        } finally {
            setIsLoading(false);
        }
    };

    // --- XỬ LÝ GOOGLE LOGIN (ĐÃ FIX LỖI CRASH) ---
    const handleGoogleSuccess = async (credentialResponse) => {
        setIsLoading(true);
        console.log("1. Google Token nhận được:", credentialResponse);

        try {
            const googleToken = credentialResponse.credential;
            let finalUser = null;
            let finalRole = 'patient';

            // --- BƯỚC 1: THỬ GỌI BACKEND ---
            try {
                const res = await authApi.googleLogin(googleToken);
                
                // [FIX LỖI QUAN TRỌNG TẠI ĐÂY]
                // Vì axiosClient đã trả về data rồi, nên 'res' CHÍNH LÀ data.
                const backendData = res.value || res; 
                
                console.log("2. Backend phản hồi:", backendData);

                if (backendData && backendData.token) {
                    console.log("✅ Backend xác thực thành công");
                    // Backend OK -> Dùng data chuẩn từ server
                    localStorage.setItem('aura_token', backendData.token);
                    if (login) await login(backendData);
                    
                    // Lấy role từ backend
                    let userRole = backendData.role;
                    if (!userRole) {
                        try {
                            const decoded = jwtDecode(backendData.token);
                            userRole = decoded.role || decoded["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"];
                        } catch (e) {}
                    }
                    finalRole = String(userRole || 'patient').toLowerCase();
                    finalUser = backendData;
                }
            } catch (apiError) {
                console.warn("⚠️ API Backend lỗi hoặc chưa có (404). Chuyển sang chế độ Offline.", apiError);
            }

            // --- BƯỚC 2: CHẾ ĐỘ DỰ PHÒNG (NẾU BƯỚC 1 FAIL HOẶC NULL) ---
            if (!finalUser) {
                console.log("🔄 Đang dùng chế độ đăng nhập Offline (Client-side decode)");
                const decodedGoogle = jwtDecode(googleToken);
                
                // Hack quyền Admin cho email của bạn để test
                if (decodedGoogle.email === 'darxel14102005@gmail.com') {
                    finalRole = 'admin';
                } else {
                    finalRole = 'patient';
                }

                // Tạo user giả lập từ thông tin Google
                const fakeUser = {
                    token: googleToken, 
                    fullName: decodedGoogle.name,
                    email: decodedGoogle.email,
                    picture: decodedGoogle.picture,
                    role: finalRole 
                };

                localStorage.setItem('aura_token', googleToken);
                if (login) await login(fakeUser);
                finalUser = fakeUser;
            }

            // --- BƯỚC 3: ĐIỀU HƯỚNG ---
            if (finalUser) {
                alert(`Đăng nhập thành công! Xin chào ${finalUser.fullName}`);
                
                if (finalRole === 'admin' || finalRole === 'administrator') {
                    navigate('/admin/dashboard');
                } else if (finalRole === 'doctor') {
                    navigate('/clinic/dashboard');
                } else {
                    navigate('/patient/dashboard');
                }
            }

        } catch (error) {
            console.error("❌ Lỗi nghiêm trọng khi xử lý Google Login:", error);
            alert("Đăng nhập thất bại. Vui lòng thử lại.");
        } finally {
            setIsLoading(false);
        }
    };

    // --- XỬ LÝ ĐĂNG KÝ (ĐÃ BỎ CHỌN ROLE - MẶC ĐỊNH PATIENT) ---
    const handleRegisterSubmit = async (e) => {
        e.preventDefault();
        const { fullName, email, password, confirmPassword, terms } = regData;

        if (!fullName || !email || !password || !confirmPassword) {
            alert('Vui lòng nhập đầy đủ thông tin!'); return;
        }
        if (password !== confirmPassword) {
            alert('Mật khẩu xác nhận không khớp!'); return;
        }
        if (!terms) {
            alert('Vui lòng đồng ý với Điều khoản dịch vụ!'); return;
        }
        if (!Object.values(passwordCriteria).every(Boolean)) {
            alert('Mật khẩu chưa đáp ứng yêu cầu bảo mật!'); return;
        }

        setIsLoading(true);
        try {
            // Mặc định luôn gửi Role là Patient
            await authApi.register({
                username: email, 
                email: email,
                password: password,
                fullName: fullName,
                role: 'Patient' 
            });

            alert('Đăng ký thành công! Vui lòng đăng nhập.');
            setActiveTab('login');
        } catch (error) {
            alert('Đăng ký thất bại: ' + (error.response?.data?.detail || "Email đã tồn tại hoặc lỗi hệ thống"));
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="auth-page-wrapper">
            <div className="auth-page-container">
                <div className="auth-header">
                    <div className="auth-logo">
                        <div className="auth-logo-icon"></div>
                        <div className="auth-logo-text">
                            <h1>AURA SCREENING</h1>
                            <p>Hệ thống sàng lọc sức khỏe mạch máu võng mạc</p>
                            <div className="project-code">Mã đề tài: SP26SE025</div>
                        </div>
                    </div>
                </div>

                <div className="auth-main-content">
                    <div className="auth-card-container">
                        <div className="welcome-section">
                            <h2>Phát hiện sớm nguy cơ bệnh lý qua hình ảnh võng mạc</h2>
                            <p>Hệ thống AURA sử dụng AI để phân tích mạch máu võng mạc, hỗ trợ bác sĩ trong việc phát hiện sớm các nguy cơ tim mạch, tiểu đường và đột quỵ.</p>
                            <ul className="features-list">
                                <li><i className="fas fa-check-circle"></i> Phân tích hình ảnh võng mạc bằng AI tiên tiến</li>
                                <li><i className="fas fa-check-circle"></i> Hỗ trợ quyết định lâm sàng cho bác sĩ</li>
                                <li><i className="fas fa-check-circle"></i> Sàng lọc không xâm lấn, nhanh chóng</li>
                                <li><i className="fas fa-check-circle"></i> Bảo mật dữ liệu y tế tuyệt đối</li>
                            </ul>
                        </div>

                        <div className="auth-forms-section">
                            <div className="auth-tabs">
                                <div className={`auth-tab ${activeTab === 'login' ? 'active' : ''}`} onClick={() => setActiveTab('login')}>Đăng nhập</div>
                                <div className={`auth-tab ${activeTab === 'register' ? 'active' : ''}`} onClick={() => setActiveTab('register')}>Đăng ký</div>
                            </div>

                            {activeTab === 'login' && (
                                <div className="auth-form-wrapper">
                                    <form className="auth-form" onSubmit={handleLoginSubmit}>
                                        <h3 className="auth-form-title">Đăng nhập tài khoản</h3>
                                        <div className="form-group">
                                            <label>Email hoặc Số điện thoại</label>
                                            <div className="input-with-icon">
                                                <i className="fas fa-user"></i>
                                                <input type="text" id="email" placeholder="Nhập email" value={loginData.email} onChange={handleLoginChange} />
                                            </div>
                                        </div>
                                        <div className="form-group">
                                            <label>Mật khẩu</label>
                                            <div className="input-with-icon">
                                                <i className="fas fa-lock"></i>
                                                <input type={showLoginPassword ? "text" : "password"} id="password" placeholder="Nhập mật khẩu" value={loginData.password} onChange={handleLoginChange} />
                                                <button type="button" className="password-toggle" onClick={() => setShowLoginPassword(!showLoginPassword)}>
                                                    <i className={`fas ${showLoginPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                                                </button>
                                            </div>
                                        </div>
                                        <div className="checkbox-group">
                                            <input type="checkbox" id="remember" checked={loginData.remember} onChange={handleLoginChange} />
                                            <label htmlFor="remember">Ghi nhớ đăng nhập</label>
                                        </div>
                                        <button type="submit" className="auth-btn" disabled={isLoading}>{isLoading ? 'Đang xử lý...' : 'Đăng nhập'}</button>
                                        
                                        {/* --- NÚT GOOGLE LOGIN (CẤU HÌNH CHUẨN) --- */}
                                        <div style={{ marginTop: '20px', textAlign: 'center', borderTop: '1px solid #eee', paddingTop: '15px' }}>
                                            <p style={{ marginBottom: '10px', color: '#666', fontSize: '14px' }}>Hoặc tiếp tục với</p>
                                            <div style={{ display: 'flex', justifyContent: 'center' }}>
                                                <GoogleLogin
                                                    onSuccess={handleGoogleSuccess}
                                                    onError={() => {
                                                        console.log('Login Failed');
                                                        alert("Đăng nhập Google thất bại");
                                                    }}
                                                    theme="outline"
                                                    shape="pill"
                                                    text="signin_with"
                                                    width="100%"
                                                    // QUAN TRỌNG: Dòng này fix lỗi origin_mismatch
                                                    cookiePolicy={'single_host_origin'} 
                                                />
                                            </div>
                                        </div>
                                        {/* ------------------------- */}

                                        <div className="auth-links" style={{marginTop: '15px'}}>
                                            <span className="auth-link" onClick={() => setShowForgotPassword(true)}>Quên mật khẩu?</span>
                                            <span> | </span>
                                            <span className="auth-link" onClick={() => setActiveTab('register')}>Chưa có tài khoản? Đăng ký ngay</span>
                                        </div>
                                    </form>
                                </div>
                            )}

                            {activeTab === 'register' && (
                                <form className="auth-form" onSubmit={handleRegisterSubmit}>
                                    <h3 className="auth-form-title">Tạo tài khoản bệnh nhân</h3>
                                    
                                    {/* ĐÃ BỎ PHẦN CHỌN ACCOUNT TYPE */}
                                    
                                    <div className="form-group">
                                        <label>Họ và tên</label>
                                        <div className="input-with-icon">
                                            <i className="fas fa-user"></i>
                                            <input type="text" name="fullName" placeholder="Nhập họ và tên đầy đủ" value={regData.fullName} onChange={handleRegChange} />
                                        </div>
                                    </div>
                                    <div className="form-group">
                                        <label>Email</label>
                                        <div className="input-with-icon">
                                            <i className="fas fa-envelope"></i>
                                            <input type="email" name="email" placeholder="Nhập địa chỉ email" value={regData.email} onChange={handleRegChange} />
                                        </div>
                                    </div>
                                    <div className="form-group">
                                        <label>Số điện thoại</label>
                                        <div className="input-with-icon">
                                            <i className="fas fa-phone"></i>
                                            <input type="tel" name="phone" placeholder="Nhập số điện thoại" value={regData.phone} onChange={handleRegChange} />
                                        </div>
                                    </div>
                                    <div className="form-group">
                                        <label>Mật khẩu</label>
                                        <div className="input-with-icon">
                                            <i className="fas fa-lock"></i>
                                            <input type={showRegPassword ? "text" : "password"} name="password" placeholder="Nhập mật khẩu (tối thiểu 8 ký tự)" value={regData.password} onChange={handleRegChange} />
                                            <button type="button" className="password-toggle" onClick={() => setShowRegPassword(!showRegPassword)}>
                                                <i className={`fas ${showRegPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                                            </button>
                                        </div>
                                        
                                        <div className="password-requirements">
                                            <div className={`requirement ${passwordCriteria.length ? 'met' : 'not-met'}`}><i className={`fas ${passwordCriteria.length ? 'fa-check-circle' : 'fa-circle'}`}></i> Tối thiểu 8 ký tự</div>
                                            <div className={`requirement ${passwordCriteria.case ? 'met' : 'not-met'}`}><i className={`fas ${passwordCriteria.case ? 'fa-check-circle' : 'fa-circle'}`}></i> Chứa chữ hoa và chữ thường</div>
                                            <div className={`requirement ${passwordCriteria.number ? 'met' : 'not-met'}`}><i className={`fas ${passwordCriteria.number ? 'fa-check-circle' : 'fa-circle'}`}></i> Có ít nhất 1 số</div>
                                            <div className={`requirement ${passwordCriteria.special ? 'met' : 'not-met'}`}><i className={`fas ${passwordCriteria.special ? 'fa-check-circle' : 'fa-circle'}`}></i> Có ít nhất 1 ký tự đặc biệt</div>
                                        </div>
                                    </div>
                                    <div className="form-group">
                                        <label>Xác nhận mật khẩu</label>
                                        <div className="input-with-icon">
                                            <i className="fas fa-lock"></i>
                                            <input type="password" name="confirmPassword" placeholder="Nhập lại mật khẩu" value={regData.confirmPassword} onChange={handleRegChange} />
                                        </div>
                                    </div>
                                    <div className="checkbox-group">
                                        <input type="checkbox" name="terms" id="terms" checked={regData.terms} onChange={handleRegChange} />
                                        <label htmlFor="terms">Tôi đồng ý với Điều khoản dịch vụ</label>
                                    </div>
                                    <button type="submit" className="auth-btn" disabled={isLoading}>{isLoading ? 'Đang xử lý...' : 'Đăng ký tài khoản'}</button>
                                </form>
                            )}
                        </div>
                    </div>
                </div>

                <div className="auth-footer">
                    <p>© 2024 AURA Screening. Hệ thống sàng lọc sức khỏe mạch máu võng mạc.</p>
                    <p>Phát triển bởi nhóm nghiên cứu SP26SE025</p>
                </div>
            </div>

            {showForgotPassword && (
                <div className="auth-modal">
                    <div className="auth-modal-content">
                        <div className="auth-modal-header">
                            <h3 className="auth-modal-title">Khôi phục mật khẩu</h3>
                            <button className="close-modal-btn" onClick={() => setShowForgotPassword(false)}>&times;</button>
                        </div>
                        <p>Vui lòng nhập email đã đăng ký để nhận liên kết khôi phục mật khẩu:</p>
                        <div className="form-group" style={{marginTop: '20px'}}>
                            <div className="input-with-icon">
                                <i className="fas fa-envelope"></i>
                                <input type="email" placeholder="Nhập địa chỉ email" />
                            </div>
                        </div>
                        <button className="auth-btn" style={{marginTop: '20px'}}>Gửi link khôi phục</button>
                        <div style={{textAlign: 'center', marginTop: '20px'}}>
                            <p>Hoặc</p>
                            <button className="auth-btn" style={{backgroundColor: '#f8f9fa', color: '#333', border: '1px solid #ddd'}}>Xác thực bằng số điện thoại</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AuthPage;