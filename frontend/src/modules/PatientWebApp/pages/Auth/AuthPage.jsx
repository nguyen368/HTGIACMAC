import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from "jwt-decode"; 
import authApi from '../../../../api/authApi';
import './AuthPage.css';
import { useAuth } from '../../../../context/AuthContext';

const AuthPage = () => {
    const navigate = useNavigate();
    const { login } = useAuth();
    const [activeTab, setActiveTab] = useState('login'); 
    const [isLoading, setIsLoading] = useState(false);
    const [showForgotPassword, setShowForgotPassword] = useState(false);
    
    const [showLoginPassword, setShowLoginPassword] = useState(false);
    const [showRegPassword, setShowRegPassword] = useState(false);

    const [loginData, setLoginData] = useState({ email: '', password: '', remember: false });
    
    const [regData, setRegData] = useState({
        fullName: '',
        email: '',
        phone: '+84',
        password: '',
        confirmPassword: '',
        terms: false
    });

    const [passwordCriteria, setPasswordCriteria] = useState({
        length: false, case: false, number: false, special: false
    });

    // --- LOGIC XỬ LÝ DỮ LIỆU ---

    const handleLoginChange = (e) => {
        const { id, value, checked, type } = e.target;
        setLoginData(prev => ({ ...prev, [id]: type === 'checkbox' ? checked : value }));
    };

    const handleRegChange = (e) => {
        const { name, value, checked, type } = e.target;
        const fieldName = name || e.target.id; 
        setRegData(prev => ({ ...prev, [fieldName]: type === 'checkbox' ? checked : value }));
        if (fieldName === 'password') validatePassword(value);
    };

    const validatePassword = (password) => {
        setPasswordCriteria({
            length: password.length >= 8,
            case: /[a-z]/.test(password) && /[A-Z]/.test(password),
            number: /\d/.test(password),
            special: /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password)
        });
    };

    // --- XỬ LÝ ĐĂNG NHẬP ---
    const handleLoginSubmit = async (e) => {
        e.preventDefault();
        if (!loginData.email || !loginData.password) {
            alert('Vui lòng nhập đầy đủ thông tin đăng nhập!');
            return;
        }
        setIsLoading(true);
        try {
            // res ở đây đã là data nhờ Interceptor trong axiosClient
            const res = await authApi.login({ 
                email: loginData.email, 
                password: loginData.password 
            });

            // Backend có thể trả về Token trực tiếp hoặc bọc trong object .value
            const data = res.value || res; 
            
            if (data?.token) {
                // Lưu token đồng bộ để Gateway (cổng 80) nhận diện được
                localStorage.setItem('aura_token', data.token);
                localStorage.setItem('token', data.token);
                
                if (login) await login(data);

                let userRole = 'patient';
                try {
                    const decoded = jwtDecode(data.token);
                    // Bóc tách Role từ JWT Claim tiêu chuẩn hoặc tùy chỉnh
                    userRole = (decoded.role || 
                               decoded["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"] || 
                               'patient').toLowerCase();
                } catch (err) { 
                    console.warn("Lỗi giải mã Token:", err); 
                }
                
                // Điều hướng người dùng dựa trên phân quyền
                if (userRole === 'admin' || userRole === 'administrator') navigate('/admin'); 
                else if (userRole === 'doctor') navigate('/clinic/dashboard'); 
                else navigate('/patient/dashboard'); 
            }
        } catch (error) {
            console.error("Auth Error:", error);
            // Hiển thị thông báo lỗi chi tiết từ Gateway/Backend
            const msg = error.response?.data?.detail || 
                        error.response?.data?.errors?.[0] || 
                        "Thông tin đăng nhập không chính xác hoặc lỗi hệ thống.";
            alert('Lỗi đăng nhập: ' + msg);
        } finally { 
            setIsLoading(false); 
        }
    };

    // --- XỬ LÝ ĐĂNG KÝ ---
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
            // Gửi dữ liệu đăng ký qua Gateway (api/auth/register)
            await authApi.register({
                username: email, 
                email: email,
                password: password,
                fullName: fullName,
                role: 'Patient' 
            });

            alert('Đăng ký thành công! Hệ thống đang chuyển về trang Đăng nhập.');
            setActiveTab('login');
        } catch (error) {
            const msg = error.response?.data?.detail || "Email đã tồn tại hoặc lỗi kết nối Gateway";
            alert('Đăng ký thất bại: ' + msg);
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
                            <p>Hệ thống AURA sử dụng AI để phân tích mạch máu võng mạc...</p>
                            <ul className="features-list">
                                <li><i className="fas fa-check-circle"></i> Phân tích hình ảnh võng mạc bằng AI</li>
                                <li><i className="fas fa-check-circle"></i> Hỗ trợ quyết định lâm sàng</li>
                                <li><i className="fas fa-check-circle"></i> Sàng lọc không xâm lấn</li>
                                <li><i className="fas fa-check-circle"></i> Bảo mật dữ liệu y tế</li>
                            </ul>
                        </div>

                        <div className="auth-forms-section">
                            <div className="auth-tabs">
                                <div className={`auth-tab ${activeTab === 'login' ? 'active' : ''}`} onClick={() => setActiveTab('login')}>Đăng nhập</div>
                                <div className={`auth-tab ${activeTab === 'register' ? 'active' : ''}`} onClick={() => setActiveTab('register')}>Đăng ký</div>
                            </div>

                            {activeTab === 'login' && (
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
                                    <div className="auth-links">
                                        <span className="auth-link" onClick={() => setShowForgotPassword(true)}>Quên mật khẩu?</span>
                                        <span> | </span>
                                        <span className="auth-link" onClick={() => setActiveTab('register')}>Chưa có tài khoản? Đăng ký ngay</span>
                                    </div>
                                </form>
                            )}

                            {activeTab === 'register' && (
                                <form className="auth-form" onSubmit={handleRegisterSubmit}>
                                    <h3 className="auth-form-title">Tạo tài khoản mới</h3>
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
                                            <input type={showRegPassword ? "text" : "password"} name="password" placeholder="Nhập mật khẩu" value={regData.password} onChange={handleRegChange} />
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
                    <p>© 2026 AURA Screening.</p>
                </div>
            </div>

            {showForgotPassword && ( 
                <div className="auth-modal"> 
                    <div className="auth-modal-content"> 
                        <div className="auth-modal-header"> 
                            <h3 className="auth-modal-title">Khôi phục mật khẩu</h3> 
                            <button className="close-modal-btn" onClick={() => setShowForgotPassword(false)}>&times;</button> 
                        </div> 
                        <p>Vui lòng nhập email đã đăng ký:</p> 
                        <div className="form-group" style={{marginTop: '20px'}}> 
                            <div className="input-with-icon"> 
                                <i className="fas fa-envelope"></i> 
                                <input type="email" placeholder="Nhập địa chỉ email" /> 
                            </div> 
                        </div> 
                        <button className="auth-btn" style={{marginTop: '20px'}}>Gửi link khôi phục</button> 
                    </div> 
                </div> 
            )}
        </div>
    );
};

export default AuthPage;