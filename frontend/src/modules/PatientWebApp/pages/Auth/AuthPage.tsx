import React, { useState, ChangeEvent, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
// @ts-ignore
import { GoogleLogin } from '@react-oauth/google';
// @ts-ignore
import authApi from '../../../../api/authApi';
import './AuthPage.css';
// @ts-ignore
import { useAuth } from '../../../../context/AuthContext';

// --- Interfaces ---
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
    
    // UI States
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    // Form Data
    const [loginData, setLoginData] = useState({ email: '', password: '' });
    const [regData, setRegData] = useState({
        fullName: '', email: '', password: '', confirmPassword: '', 
        phone: '', terms: false, accountType: 'Patient' 
    });

    // Password Strength Check
    const [pwdStrength, setPwdStrength] = useState(0);

    const handleRegChange = (e: ChangeEvent<HTMLInputElement>) => {
        const { name, value, type, checked } = e.target;
        setRegData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));

        if (name === 'password') {
            let score = 0;
            if (value.length > 6) score++;
            if (value.length > 10) score++;
            if (/[A-Z]/.test(value)) score++;
            if (/[0-9]/.test(value)) score++;
            if (/[^A-Za-z0-9]/.test(value)) score++;
            setPwdStrength(score);
        }
    };

    // --- SUBMIT LOGIN ---
    const handleLoginSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            const res: AuthResponse = await authApi.login({ email: loginData.email, password: loginData.password });
            
            if (res.isSuccess === false) {
                toast.error(res.message || "Đăng nhập thất bại");
                return;
            }

            const data = res; 
            if (data?.token) {
                localStorage.setItem('aura_token', data.token);
                if (login) await login(data);

                toast.success("Đăng nhập thành công! 🚀");

                const decoded = parseJwt(data.token);
                const roleKey = "http://schemas.microsoft.com/ws/2008/06/identity/claims/role";
                const userRole = (decoded?.[roleKey] || decoded?.role || 'patient').toLowerCase();

                if (userRole.includes('admin') && !userRole.includes('clinic')) navigate('/admin/dashboard');
                else if (userRole === 'clinicadmin') navigate('/clinic/dashboard');
                else if (userRole === 'doctor') navigate('/doctor'); 
                else navigate('/patient/dashboard');
            }
        } catch (error: any) {
            console.error(error);
            const msg = error.response?.data?.message || "Tài khoản hoặc mật khẩu không đúng.";
            toast.error(msg);
        } finally { setIsLoading(false); }
    };

    // --- SUBMIT REGISTER ---
    const handleRegisterSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (regData.password !== regData.confirmPassword) { toast.warning('Mật khẩu nhập lại không khớp!'); return; }
        if (!regData.terms) { toast.warning('Vui lòng đồng ý điều khoản!'); return; }
        
        setIsLoading(true);
        try {
            let res: AuthResponse;
            if (regData.accountType === 'ClinicAdmin') {
                res = await authApi.registerPartner({
                    username: regData.email, email: regData.email,
                    password: regData.password, fullName: regData.fullName,
                    clinicName: "Phòng khám Mới (Chờ duyệt)", 
                    clinicAddress: "Đang cập nhật"
                });
            } else {
                res = await authApi.register({
                    username: regData.email, email: regData.email,
                    password: regData.password, fullName: regData.fullName,
                    role: "Patient"
                });
            }
            
            toast.success(res.message || 'Đăng ký thành công! Vui lòng đăng nhập.');
            if (res.isSuccess !== false) {
                setActiveTab('login');
                setLoginData({ email: regData.email, password: '' });
            }
        } catch (error: any) { 
            toast.error('Đăng ký thất bại: ' + (error.response?.data?.message || "Lỗi hệ thống")); 
        } finally { setIsLoading(false); }
    };

    // --- GOOGLE LOGIN ---
    const handleGoogleSuccess = async (credentialResponse: any) => {
        setIsLoading(true);
        try {
            const res: AuthResponse = await authApi.googleLogin({ token: credentialResponse.credential });
            
            if (res.token) {
                localStorage.setItem('aura_token', res.token);
                if (login) await login(res);
                toast.success("Đăng nhập Google thành công!");
                navigate('/patient/dashboard');
            }
        } catch (error) {
            toast.error("Lỗi đăng nhập Google. Vui lòng thử lại.");
        } finally { setIsLoading(false); }
    };

    return (
        <div className="auth-container">
            <div className="auth-wrapper">
                
                {/* --- CỘT TRÁI: BANNER --- */}
                <div className="auth-banner">
                    <div className="brand-header">
                        <div className="logo-icon"><i className="fas fa-eye"></i></div>
                        <h1>AURA MED</h1>
                    </div>
                    
                    <div className="banner-content">
                        <h2>Công nghệ AI<br/>Bảo vệ Tầm nhìn</h2>
                        <p>Hệ thống sàng lọc bệnh lý võng mạc tiên tiến nhất, hỗ trợ bác sĩ chẩn đoán chính xác và nhanh chóng.</p>
                        
                        <ul className="feature-list">
                            <li><i className="fas fa-robot"></i> AI Deep Learning phân tích ảnh đáy mắt</li>
                            <li><i className="fas fa-chart-line"></i> Báo cáo rủi ro chi tiết & trực quan</li>
                            <li><i className="fas fa-lock"></i> Bảo mật dữ liệu chuẩn y tế</li>
                        </ul>
                    </div>

                    <div className="banner-footer">
                        © 2026 AURA Screening System. Design for Capstone Project.
                    </div>
                </div>

                {/* --- CỘT PHẢI: FORM --- */}
                <div className="auth-form-container">
                    <div className="form-header">
                        <h3>{activeTab === 'login' ? 'Chào mừng trở lại! 👋' : 'Tạo tài khoản mới 🚀'}</h3>
                        <p>{activeTab === 'login' ? 'Nhập thông tin để truy cập hệ thống' : 'Tham gia cộng đồng AURA ngay hôm nay'}</p>
                    </div>

                    {/* TABS SWITCHER */}
                    <div className="auth-tabs">
                        <button className={`tab-btn ${activeTab === 'login' ? 'active' : ''}`} onClick={() => setActiveTab('login')}>Đăng nhập</button>
                        <button className={`tab-btn ${activeTab === 'register' ? 'active' : ''}`} onClick={() => setActiveTab('register')}>Đăng ký</button>
                    </div>

                    {/* --- LOGIN FORM --- */}
                    {activeTab === 'login' && (
                        <form onSubmit={handleLoginSubmit}>
                            <div className="input-group">
                                <label className="input-label">Email</label>
                                <div className="input-wrapper">
                                    <i className="fas fa-envelope"></i>
                                    <input className="form-input" type="email" placeholder="name@example.com" 
                                        value={loginData.email} onChange={e => setLoginData({...loginData, email: e.target.value})} required />
                                </div>
                            </div>

                            <div className="input-group">
                                <label className="input-label">Mật khẩu</label>
                                <div className="input-wrapper">
                                    <i className="fas fa-lock"></i>
                                    <input className="form-input" type={showPassword ? "text" : "password"} placeholder="Nhập mật khẩu"
                                        value={loginData.password} onChange={e => setLoginData({...loginData, password: e.target.value})} required />
                                    <button type="button" className="toggle-password" onClick={() => setShowPassword(!showPassword)}>
                                        <i className={`fas ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                                    </button>
                                </div>
                            </div>

                            <div style={{textAlign: 'right', marginBottom: '20px'}}>
                                <span className="link-highlight" style={{fontSize: '13px'}}>Quên mật khẩu?</span>
                            </div>

                            <button type="submit" className="btn-primary" disabled={isLoading}>
                                {isLoading ? <span><i className="fas fa-spinner fa-spin"></i> Đang xử lý...</span> : 'Đăng nhập ngay'}
                            </button>

                            <div className="divider"><span>Hoặc tiếp tục với</span></div>

                            <div className="google-btn-wrapper" style={{ display: 'flex', justifyContent: 'center' }}>
                                {/* CẤU HÌNH FIX LỖI ONBOARDING VÀ COOP */}
                                <GoogleLogin 
                                    onSuccess={handleGoogleSuccess} 
                                    onError={() => toast.error('Google Login thất bại')} 
                                    
                                    // BẮT BUỘC: Tắt OneTap để hết lỗi onboarding.js
                                    useOneTap={false}
                                    auto_select={false}
                                    
                                    // BẮT BUỘC: Chuyển sang nút chuẩn để hết lỗi FedCM
                                    type="standard"
                                    
                                    theme="outline"
                                    size="large"
                                    shape="circle"
                                    width="300" // Dùng string "300" để TS không báo lỗi
                                />
                            </div>
                        </form>
                    )}

                    {/* --- REGISTER FORM --- */}
                    {activeTab === 'register' && (
                        <form onSubmit={handleRegisterSubmit}>
                            <div className="account-type-group">
                                <input type="radio" id="pt" name="accountType" value="Patient" 
                                    checked={regData.accountType === 'Patient'} onChange={handleRegChange as any} hidden />
                                <label htmlFor="pt" className="radio-label"><i className="fas fa-user-injured"></i> Bệnh nhân</label>

                                <input type="radio" id="dr" name="accountType" value="ClinicAdmin" 
                                    checked={regData.accountType === 'ClinicAdmin'} onChange={handleRegChange as any} hidden />
                                <label htmlFor="dr" className="radio-label"><i className="fas fa-user-md"></i> Phòng khám</label>
                            </div>

                            <div className="input-group">
                                <label className="input-label">Họ và tên</label>
                                <div className="input-wrapper">
                                    <i className="fas fa-user"></i>
                                    <input className="form-input" name="fullName" type="text" placeholder="Nguyễn Văn A" 
                                        value={regData.fullName} onChange={handleRegChange} required />
                                </div>
                            </div>

                            <div className="input-group">
                                <label className="input-label">Email</label>
                                <div className="input-wrapper">
                                    <i className="fas fa-envelope"></i>
                                    <input className="form-input" name="email" type="email" placeholder="email@example.com" 
                                        value={regData.email} onChange={handleRegChange} required />
                                </div>
                            </div>

                            <div className="input-group">
                                <label className="input-label">Mật khẩu</label>
                                <div className="input-wrapper">
                                    <i className="fas fa-lock"></i>
                                    <input className="form-input" name="password" type={showPassword ? "text" : "password"} placeholder="Tạo mật khẩu"
                                        value={regData.password} onChange={handleRegChange} required />
                                    <button type="button" className="toggle-password" onClick={() => setShowPassword(!showPassword)}>
                                        <i className={`fas ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                                    </button>
                                </div>
                                {regData.password && (
                                    <div className="password-strength">
                                        {[1, 2, 3, 4, 5].map(i => (
                                            <div key={i} className={`strength-bar ${pwdStrength >= i ? (pwdStrength < 3 ? 'weak' : 'strong') : ''}`}></div>
                                        ))}
                                    </div>
                                )}
                                <div className="requirements">
                                    <span className={`req-item ${regData.password.length >= 8 ? 'met' : ''}`}><i className="fas fa-check"></i> 8+ ký tự</span>
                                    <span className={`req-item ${/[A-Z]/.test(regData.password) ? 'met' : ''}`}><i className="fas fa-check"></i> Chữ hoa</span>
                                    <span className={`req-item ${/[0-9]/.test(regData.password) ? 'met' : ''}`}><i className="fas fa-check"></i> Số</span>
                                </div>
                            </div>

                            <div className="input-group">
                                <label className="input-label">Nhập lại mật khẩu</label>
                                <div className="input-wrapper">
                                    <i className="fas fa-key"></i>
                                    <input className="form-input" name="confirmPassword" type={showConfirmPassword ? "text" : "password"} placeholder="Xác nhận mật khẩu"
                                        value={regData.confirmPassword} onChange={handleRegChange} required />
                                    <button type="button" className="toggle-password" onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
                                        <i className={`fas ${showConfirmPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                                    </button>
                                </div>
                            </div>

                            <div style={{display:'flex', gap:'10px', alignItems:'center', marginBottom:'20px'}}>
                                <input type="checkbox" name="terms" id="terms" checked={regData.terms} onChange={handleRegChange} 
                                    style={{width:'18px', height:'18px', accentColor:'#0ea5e9'}}/>
                                <label htmlFor="terms" style={{fontSize:'13px', color:'#64748b'}}>Tôi đồng ý với <span className="link-highlight">Điều khoản dịch vụ</span> & Chính sách bảo mật.</label>
                            </div>

                            <button type="submit" className="btn-primary" disabled={isLoading}>
                                {isLoading ? <span><i className="fas fa-spinner fa-spin"></i> Đang đăng ký...</span> : 'Tạo tài khoản'}
                            </button>
                        </form>
                    )}

                    <div className="auth-footer-links">
                        {activeTab === 'login' 
                            ? <p>Chưa có tài khoản? <span className="link-highlight" onClick={() => setActiveTab('register')}>Đăng ký ngay</span></p>
                            : <p>Đã có tài khoản? <span className="link-highlight" onClick={() => setActiveTab('login')}>Đăng nhập</span></p>
                        }
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AuthPage;