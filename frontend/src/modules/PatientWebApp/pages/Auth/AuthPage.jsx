import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google'; // Import lại GoogleLogin
import authApi from '../../../../api/authApi';
import './AuthPage.css';
import { useAuth } from '../../../../context/AuthContext';

// --- HÀM GIẢI MÃ TOKEN THỦ CÔNG ---
const parseJwt = (token) => {
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function(c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
        return JSON.parse(jsonPayload);
    } catch (e) { return null; }
};

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
        terms: false,
        accountType: 'Patient' // Thêm field này để theo dõi Radio button
    });

    const [passwordCriteria, setPasswordCriteria] = useState({
        length: false, case: false, number: false, special: false
    });

    // --- XỬ LÝ SỰ KIỆN ---
    const handleLoginChange = (e) => {
        const { id, value, checked, type } = e.target;
        setLoginData(prev => ({ ...prev, [id]: type === 'checkbox' ? checked : value }));
    };

    const handleRegChange = (e) => {
        const { name, value, checked, type } = e.target;
        const fieldName = (name === 'account-type') ? 'accountType' : (name || e.target.id);
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

    const handleLoginSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            const res = await authApi.login({ email: loginData.email, password: loginData.password });
            const data = res.data?.value || res.data;
            
            if (data?.token) {
                localStorage.setItem('aura_token', data.token); // Đồng bộ Key aura_token
                if (login) await login(data);

                const decoded = parseJwt(data.token);
                const roleKey = "http://schemas.microsoft.com/ws/2008/06/identity/claims/role";
                const userRole = (decoded?.[roleKey] || decoded?.role || 'patient').toLowerCase();

                // ĐIỀU HƯỚNG CHUẨN
                if (userRole.includes('admin')) navigate('/admin/dashboard');
                else if (userRole === 'doctor') navigate('/doctor'); 
                else navigate('/patient/dashboard');
            }
        } catch (error) {
            alert('Lỗi: ' + (error.response?.data?.detail || "Sai thông tin đăng nhập"));
        } finally { setIsLoading(false); }
    };

    const handleGoogleSuccess = async (credentialResponse) => {
        setIsLoading(true);
        try {
            const res = await authApi.googleLogin({ token: credentialResponse.credential });
            const data = res.data?.value || res.data;
            if (data?.token) {
                localStorage.setItem('aura_token', data.token);
                if (login) await login(data);
                navigate(data.role?.toLowerCase() === 'doctor' ? '/doctor' : '/patient/dashboard');
            }
        } catch (error) { alert("Lỗi đăng nhập Google"); }
        finally { setIsLoading(false); }
    };

    const handleRegisterSubmit = async (e) => {
        e.preventDefault();
        if (regData.password !== regData.confirmPassword) { alert('Mật khẩu không khớp!'); return; }
        setIsLoading(true);
        try {
            await authApi.register({
                username: regData.email, email: regData.email,
                password: regData.password, fullName: regData.fullName,
                role: regData.accountType // Gửi đúng Role người dùng chọn
            });
            alert('Đăng ký thành công!');
            setActiveTab('login');
        } catch (error) { alert('Đăng ký thất bại'); }
        finally { setIsLoading(false); }
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
                                                <input type={showLoginPassword ? "text" : "password"} id="password" placeholder="Mật khẩu" value={loginData.password} onChange={handleLoginChange} />
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
                                        
                                        <div style={{ marginTop: '20px', textAlign: 'center', borderTop: '1px solid #eee', paddingTop: '15px' }}>
                                            <p style={{ marginBottom: '10px', color: '#666', fontSize: '14px' }}>Hoặc tiếp tục với</p>
                                            <div style={{ display: 'flex', justifyContent: 'center' }}>
                                                <GoogleLogin
                                                    onSuccess={handleGoogleSuccess}
                                                    onError={() => alert("Đăng nhập Google thất bại")}
                                                    theme="outline" shape="pill" text="signin_with" width="100%"
                                                />
                                            </div>
                                        </div>

                                        <div className="auth-links" style={{marginTop: '15px'}}>
                                            <span className="auth-link" onClick={() => setShowForgotPassword(true)}>Quên mật khẩu?</span>
                                            <span> | </span>
                                            <span className="auth-link" onClick={() => setActiveTab('register')}>Đăng ký ngay</span>
                                        </div>
                                    </form>
                                </div>
                            )}

                            {activeTab === 'register' && (
                                <form className="auth-form" onSubmit={handleRegisterSubmit}>
                                    <h3 className="auth-form-title">Tạo tài khoản mới</h3>
                                    <div className="form-group">
                                        <label>Loại tài khoản</label>
                                        <div className="account-type">
                                            <input type="radio" id="patient" name="account-type" value="Patient" checked={regData.accountType === 'Patient'} onChange={handleRegChange} />
                                            <label htmlFor="patient">Bệnh nhân</label>
                                            <input type="radio" id="doctor" name="account-type" value="Doctor" checked={regData.accountType === 'Doctor'} onChange={handleRegChange} />
                                            <label htmlFor="doctor">Bác sĩ</label>
                                            <input type="radio" id="admin" name="account-type" value="Admin" checked={regData.accountType === 'Admin'} onChange={handleRegChange} />
                                            <label htmlFor="admin">Admin</label>
                                        </div>
                                    </div>
                                    <div className="form-group">
                                        <label>Họ và tên</label>
                                        <input type="text" name="fullName" placeholder="Nhập họ tên" value={regData.fullName} onChange={handleRegChange} />
                                    </div>
                                    <div className="form-group">
                                        <label>Email</label>
                                        <input type="email" name="email" placeholder="Nhập email" value={regData.email} onChange={handleRegChange} />
                                    </div>
                                    <div className="form-group">
                                        <label>Mật khẩu</label>
                                        <input type={showRegPassword ? "text" : "password"} name="password" value={regData.password} onChange={handleRegChange} />
                                    </div>
                                    <div className="password-requirements">
                                        <div className={`requirement ${passwordCriteria.length ? 'met' : ''}`}>Tối thiểu 8 ký tự</div>
                                        <div className={`requirement ${passwordCriteria.special ? 'met' : ''}`}>Có ký tự đặc biệt</div>
                                    </div>
                                    <div className="form-group">
                                        <label>Xác nhận mật khẩu</label>
                                        <input type="password" name="confirmPassword" value={regData.confirmPassword} onChange={handleRegChange} />
                                    </div>
                                    <div className="checkbox-group">
                                        <input type="checkbox" name="terms" id="terms" checked={regData.terms} onChange={handleRegChange} />
                                        <label htmlFor="terms">Đồng ý Điều khoản dịch vụ</label>
                                    </div>
                                    <button type="submit" className="auth-btn" disabled={isLoading}>Đăng ký</button>
                                </form>
                            )}
                        </div>
                    </div>
                </div>
                <div className="auth-footer"><p>© 2026 AURA Screening.</p></div>
            </div>

            {/* Forgot Password Modal */}
            {showForgotPassword && (
                <div className="auth-modal">
                    <div className="auth-modal-content">
                        <div className="auth-modal-header">
                            <h3 className="auth-modal-title">Khôi phục mật khẩu</h3>
                            <button className="close-modal-btn" onClick={() => setShowForgotPassword(false)}>&times;</button>
                        </div>
                        <p>Nhập email để nhận liên kết khôi phục:</p>
                        <input type="email" className="modal-input" placeholder="example@email.com" />
                        <button className="auth-btn" style={{marginTop: '20px'}}>Gửi yêu cầu</button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AuthPage;