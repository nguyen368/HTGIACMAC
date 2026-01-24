import React, { useState, ChangeEvent, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
// @ts-ignore
import { GoogleLogin } from '@react-oauth/google';
// @ts-ignore
import authApi from '../../../../api/authApi';
import './AuthPage.css';
// @ts-ignore
import { useAuth } from '../../../../context/AuthContext';

// --- Định nghĩa các Interface ---

interface LoginData {
    email: string;
    password: string;
    remember: boolean;
}

interface RegisterData {
    fullName: string;
    email: string;
    phone: string;
    password: string;
    confirmPassword: string;
    terms: boolean;
    accountType: string;
    [key: string]: string | boolean; // Index signature để hỗ trợ truy cập động
}

interface PasswordCriteria {
    length: boolean;
    special: boolean;
}

interface AuthResponse {
    isSuccess?: boolean;
    message?: string;
    token?: string;
    [key: string]: any;
}

const parseJwt = (token: string): any => {
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(window.atob(base64).split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join(''));
        return JSON.parse(jsonPayload);
    } catch (e) { return null; }
};

const AuthPage: React.FC = () => {
    const navigate = useNavigate();
    const { login } = useAuth();
    const [activeTab, setActiveTab] = useState<'login' | 'register'>('login'); 
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [showForgotPassword, setShowForgotPassword] = useState<boolean>(false);
    const [showLoginPassword, setShowLoginPassword] = useState<boolean>(false);
    const [showRegPassword, setShowRegPassword] = useState<boolean>(false);

    const [loginData, setLoginData] = useState<LoginData>({ email: '', password: '', remember: false });
    const [regData, setRegData] = useState<RegisterData>({
        fullName: '', email: '', phone: '+84', password: '', confirmPassword: '',
        terms: false, accountType: 'Patient' 
    });

    const [passwordCriteria, setPasswordCriteria] = useState<PasswordCriteria>({ length: false, special: false });

    const handleLoginChange = (e: ChangeEvent<HTMLInputElement>) => {
        const { id, value, checked, type } = e.target;
        setLoginData(prev => ({ ...prev, [id]: type === 'checkbox' ? checked : value }));
    };

    const handleRegChange = (e: ChangeEvent<HTMLInputElement>) => {
        const { name, value, checked, type } = e.target;
        const fieldName = (name === 'account-type') ? 'accountType' : (name || e.target.id);
        
        setRegData(prev => ({ ...prev, [fieldName]: type === 'checkbox' ? checked : value }));
        
        if (fieldName === 'password') {
            setPasswordCriteria({
                length: value.length >= 8,
                special: /[!@#$%^&*(),.?":{}|<>]/.test(value)
            });
        }
    };

    const handleLoginSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            const res: AuthResponse = await authApi.login({ email: loginData.email, password: loginData.password });
            
            // KIỂM TRA CHỜ DUYỆT (Nếu Backend trả về isSuccess: false)
            if (res.isSuccess === false) {
                alert(res.message);
                return;
            }

            const data = res; // axiosClient đã bóc tách response.data rồi
            if (data?.token) {
                localStorage.setItem('aura_token', data.token);
                if (login) await login(data);

                const decoded = parseJwt(data.token);
                const roleKey = "http://schemas.microsoft.com/ws/2008/06/identity/claims/role";
                const userRole = (decoded?.[roleKey] || decoded?.role || 'patient').toLowerCase();

                // --- LOGIC ĐIỀU HƯỚNG CẬP NHẬT ---
                if (userRole.includes('admin') && !userRole.includes('clinic')) {
                    navigate('/admin/dashboard');
                } else if (userRole === 'clinicadmin') {
                    navigate('/clinic/dashboard'); // Chuyển đến trang quản lý phòng khám
                } else if (userRole === 'doctor') {
                    navigate('/doctor'); 
                } else {
                    navigate('/patient/dashboard');
                }
            }
        } catch (error: any) {
            alert('Lỗi: ' + (error.response?.data?.message || "Sai thông tin đăng nhập hoặc tài khoản chưa được duyệt"));
        } finally { setIsLoading(false); }
    };

    const handleRegisterSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (regData.password !== regData.confirmPassword) { alert('Mật khẩu không khớp!'); return; }
        if (!regData.terms) { alert('Vui lòng đồng ý điều khoản!'); return; }
        
        setIsLoading(true);
        try {
            let res: AuthResponse;
            if (regData.accountType === 'ClinicAdmin') {
                res = await authApi.registerPartner({
                    username: regData.email, email: regData.email,
                    password: regData.password, fullName: regData.fullName,
                    clinicName: "Phòng khám mới", 
                    clinicAddress: "Chưa cập nhật"
                });
            } else {
                res = await authApi.register({
                    username: regData.email, email: regData.email,
                    password: regData.password, fullName: regData.fullName,
                    role: "Patient"
                });
            }
            alert(res.message || 'Đăng ký thành công!');
            if (res.isSuccess !== false) setActiveTab('login');
        } catch (error: any) { 
            alert('Đăng ký thất bại: ' + (error.response?.data?.message || "")); 
        } finally { setIsLoading(false); }
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

                            {activeTab === 'login' ? (
                                <form className="auth-form" onSubmit={handleLoginSubmit}>
                                    <h3 className="auth-form-title">Đăng nhập tài khoản</h3>
                                    <div className="form-group">
                                        <label>Email</label>
                                        <div className="input-with-icon">
                                            <i className="fas fa-user"></i>
                                            <input type="text" id="email" placeholder="Nhập email" value={loginData.email} onChange={handleLoginChange} required />
                                        </div>
                                    </div>
                                    <div className="form-group">
                                        <label>Mật khẩu</label>
                                        <div className="input-with-icon">
                                            <i className="fas fa-lock"></i>
                                            <input type={showLoginPassword ? "text" : "password"} id="password" placeholder="Mật khẩu" value={loginData.password} onChange={handleLoginChange} required />
                                            <button type="button" className="password-toggle" onClick={() => setShowLoginPassword(!showLoginPassword)}>
                                                <i className={`fas ${showLoginPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                                            </button>
                                        </div>
                                    </div>
                                    <button type="submit" className="auth-btn" disabled={isLoading}>{isLoading ? 'Đang xử lý...' : 'Đăng nhập'}</button>
                                    <div className="auth-links">
                                        <span className="auth-link" onClick={() => setShowForgotPassword(true)}>Quên mật khẩu?</span>
                                        <span> | </span>
                                        <span className="auth-link" onClick={() => setActiveTab('register')}>Đăng ký ngay</span>
                                    </div>
                                </form>
                            ) : (
                                <form className="auth-form" onSubmit={handleRegisterSubmit}>
                                    <h3 className="auth-form-title">Tạo tài khoản mới</h3>
                                    <div className="form-group">
                                        <label>Bạn đăng ký với tư cách:</label>
                                        <div className="account-type">
                                            <input type="radio" id="patient" name="account-type" value="Patient" checked={regData.accountType === 'Patient'} onChange={handleRegChange} />
                                            <label htmlFor="patient">Bệnh nhân</label>
                                            
                                            <input type="radio" id="manager" name="account-type" value="ClinicAdmin" checked={regData.accountType === 'ClinicAdmin'} onChange={handleRegChange} />
                                            <label htmlFor="manager">Đối tác (Quản lý)</label>
                                        </div>
                                    </div>
                                    <div className="form-group">
                                        <label>Họ và tên</label>
                                        <input type="text" name="fullName" placeholder="Nhập họ tên" value={regData.fullName} onChange={handleRegChange} required />
                                    </div>
                                    <div className="form-group">
                                        <label>Email</label>
                                        <input type="email" name="email" placeholder="Nhập email" value={regData.email} onChange={handleRegChange} required />
                                    </div>
                                    <div className="form-group">
                                        <label>Mật khẩu</label>
                                        <input type={showRegPassword ? "text" : "password"} name="password" value={regData.password} onChange={handleRegChange} required />
                                    </div>
                                    <div className="password-requirements">
                                        <div className={`requirement ${passwordCriteria.length ? 'met' : ''}`}>Tối thiểu 8 ký tự</div>
                                        <div className={`requirement ${passwordCriteria.special ? 'met' : ''}`}>Có ký tự đặc biệt</div>
                                    </div>
                                    <div className="form-group">
                                        <label>Xác nhận mật khẩu</label>
                                        <input type="password" name="confirmPassword" value={regData.confirmPassword} onChange={handleRegChange} required />
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
        </div>
    );
};

export default AuthPage;