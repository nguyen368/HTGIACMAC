import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import authApi from '../../../../api/authApi'; // Đảm bảo đường dẫn này đúng với dự án của bạn
import './AuthPage.css';

const AuthPage = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('login'); // 'login' or 'register'
    const [isLoading, setIsLoading] = useState(false);
    const [showForgotPassword, setShowForgotPassword] = useState(false);
    
    // State hiển thị mật khẩu
    const [showLoginPassword, setShowLoginPassword] = useState(false);
    const [showRegPassword, setShowRegPassword] = useState(false);

    // State dữ liệu Login
    const [loginData, setLoginData] = useState({ email: '', password: '', remember: false });
    
    // State dữ liệu Register
    const [regData, setRegData] = useState({
        accountType: 'Patient', // Mặc định là Patient (khớp với Role backend)
        fullName: '',
        email: '',
        phone: '+84',
        password: '',
        confirmPassword: '',
        terms: false
    });

    // State kiểm tra độ mạnh mật khẩu
    const [passwordCriteria, setPasswordCriteria] = useState({
        length: false,
        case: false,
        number: false,
        special: false
    });

    // --- LOGIC XỬ LÝ ---

    // 1. Cập nhật input Login
    const handleLoginChange = (e) => {
        const { id, value, checked, type } = e.target;
        setLoginData(prev => ({
            ...prev,
            [id]: type === 'checkbox' ? checked : value
        }));
    };

    // 2. Cập nhật input Register & Validate Password
    const handleRegChange = (e) => {
        const { name, value, checked, type } = e.target;
        
        // Xử lý radio group account type
        if (name === 'account-type') {
            setRegData(prev => ({ ...prev, accountType: value }));
            return;
        }

        const fieldName = name || e.target.id; // Fallback id nếu không có name
        
        setRegData(prev => ({
            ...prev,
            [fieldName]: type === 'checkbox' ? checked : value
        }));

        // Validate mật khẩu realtime
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

    // 3. Xử lý Đăng nhập (Call API)
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

            const data = res.data.value || res.data;
            if (data?.token) {
                localStorage.setItem('aura_token', data.token);
                localStorage.setItem('aura_role', data.role);
                alert(`Đăng nhập thành công! Xin chào ${data.fullName}`);
                
                // Chuyển hướng dựa trên Role
                const role = data.role?.toLowerCase() || '';
                if (role === 'admin') navigate('/admin');
                else if (role === 'doctor') navigate('/doctor');
                else navigate('/'); 
            }
        } catch (error) {
            alert('Lỗi đăng nhập: ' + (error.response?.data?.detail || "Kiểm tra lại email/mật khẩu"));
        } finally {
            setIsLoading(false);
        }
    };

    // 4. Xử lý Đăng ký (Call API)
    const handleRegisterSubmit = async (e) => {
        e.preventDefault();
        const { fullName, email, password, confirmPassword, terms, accountType } = regData;

        if (!fullName || !email || !password || !confirmPassword) {
            alert('Vui lòng nhập đầy đủ thông tin!');
            return;
        }
        if (password !== confirmPassword) {
            alert('Mật khẩu xác nhận không khớp!');
            return;
        }
        if (!terms) {
            alert('Vui lòng đồng ý với Điều khoản dịch vụ!');
            return;
        }
        // Kiểm tra lại criteria lần cuối
        if (!Object.values(passwordCriteria).every(Boolean)) {
            alert('Mật khẩu chưa đáp ứng yêu cầu bảo mật!');
            return;
        }

        setIsLoading(true);
        try {
            // Mapping Account Type HTML sang Role Backend
            // HTML: patient, doctor, clinic
            // Backend: Patient, Doctor, Admin (Hoặc Clinic nếu backend hỗ trợ)
            let roleToSend = 'Patient';
            if (accountType === 'doctor') roleToSend = 'Doctor';
            if (accountType === 'clinic') roleToSend = 'Doctor'; // Tạm thời map Clinic thành Doctor nếu chưa có Role Clinic

            // Backend yêu cầu: Username, Email, Password, FullName, Role
            // Ta dùng Email làm Username luôn cho tiện
            await authApi.register({
                username: email, 
                email: email,
                password: password,
                fullName: fullName,
                role: roleToSend
            });

            alert('Đăng ký thành công! Vui lòng đăng nhập.');
            setActiveTab('login'); // Chuyển về tab Login
        } catch (error) {
            alert('Đăng ký thất bại: ' + (error.response?.data?.detail || "Email đã tồn tại"));
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="auth-page-wrapper">
            <div className="auth-page-container">
                {/* Header */}
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

                {/* Main Content */}
                <div className="auth-main-content">
                    <div className="auth-card-container">
                        {/* Welcome Section (Left) */}
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

                        {/* Auth Forms (Right) */}
                        <div className="auth-forms-section">
                            {/* Tabs */}
                            <div className="auth-tabs">
                                <div 
                                    className={`auth-tab ${activeTab === 'login' ? 'active' : ''}`}
                                    onClick={() => setActiveTab('login')}
                                >
                                    Đăng nhập
                                </div>
                                <div 
                                    className={`auth-tab ${activeTab === 'register' ? 'active' : ''}`}
                                    onClick={() => setActiveTab('register')}
                                >
                                    Đăng ký
                                </div>
                            </div>

                            {/* --- LOGIN FORM --- */}
                            {activeTab === 'login' && (
                                <form className="auth-form" onSubmit={handleLoginSubmit}>
                                    <h3 className="auth-form-title">Đăng nhập tài khoản</h3>
                                    
                                    <div className="form-group">
                                        <label>Email hoặc Số điện thoại</label>
                                        <div className="input-with-icon">
                                            <i className="fas fa-user"></i>
                                            <input 
                                                type="text" id="email" 
                                                placeholder="Nhập email"
                                                value={loginData.email} onChange={handleLoginChange}
                                            />
                                        </div>
                                    </div>
                                    
                                    <div className="form-group">
                                        <label>Mật khẩu</label>
                                        <div className="input-with-icon">
                                            <i className="fas fa-lock"></i>
                                            <input 
                                                type={showLoginPassword ? "text" : "password"} id="password"
                                                placeholder="Nhập mật khẩu"
                                                value={loginData.password} onChange={handleLoginChange}
                                            />
                                            <button type="button" className="password-toggle" onClick={() => setShowLoginPassword(!showLoginPassword)}>
                                                <i className={`fas ${showLoginPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                                            </button>
                                        </div>
                                    </div>
                                    
                                    <div className="checkbox-group">
                                        <input 
                                            type="checkbox" id="remember" 
                                            checked={loginData.remember} onChange={handleLoginChange}
                                        />
                                        <label htmlFor="remember">Ghi nhớ đăng nhập</label>
                                    </div>
                                    
                                    <button type="submit" className="auth-btn" disabled={isLoading}>
                                        {isLoading ? 'Đang xử lý...' : 'Đăng nhập'}
                                    </button>
                                    
                                    <div className="auth-links">
                                        <span className="auth-link" onClick={() => setShowForgotPassword(true)}>Quên mật khẩu?</span>
                                        <span> | </span>
                                        <span className="auth-link" onClick={() => setActiveTab('register')}>Chưa có tài khoản? Đăng ký ngay</span>
                                    </div>
                                </form>
                            )}

                            {/* --- REGISTER FORM --- */}
                            {activeTab === 'register' && (
                                <form className="auth-form" onSubmit={handleRegisterSubmit}>
                                    <h3 className="auth-form-title">Tạo tài khoản mới</h3>
                                    
                                    <div className="form-group">
                                        <label>Loại tài khoản</label>
                                        <div className="account-type">
                                            <input 
                                                type="radio" id="patient" name="account-type" value="Patient"
                                                checked={regData.accountType === 'Patient'} onChange={handleRegChange}
                                            />
                                            <label htmlFor="patient">Bệnh nhân</label>
                                            
                                            <input 
                                                type="radio" id="doctor" name="account-type" value="Doctor"
                                                checked={regData.accountType === 'Doctor'} onChange={handleRegChange}
                                            />
                                            <label htmlFor="doctor">Bác sĩ</label>
                                            
                                            <input 
                                                type="radio" id="clinic" name="account-type" value="Clinic"
                                                checked={regData.accountType === 'Clinic'} onChange={handleRegChange}
                                            />
                                            <label htmlFor="clinic">Phòng khám</label>
                                        </div>
                                    </div>
                                    
                                    <div className="form-group">
                                        <label>Họ và tên</label>
                                        <div className="input-with-icon">
                                            <i className="fas fa-user"></i>
                                            <input 
                                                type="text" name="fullName" 
                                                placeholder="Nhập họ và tên đầy đủ"
                                                value={regData.fullName} onChange={handleRegChange}
                                            />
                                        </div>
                                    </div>
                                    
                                    <div className="form-group">
                                        <label>Email</label>
                                        <div className="input-with-icon">
                                            <i className="fas fa-envelope"></i>
                                            <input 
                                                type="email" name="email" 
                                                placeholder="Nhập địa chỉ email"
                                                value={regData.email} onChange={handleRegChange}
                                            />
                                        </div>
                                    </div>
                                    
                                    <div className="form-group">
                                        <label>Số điện thoại</label>
                                        <div className="input-with-icon">
                                            <i className="fas fa-phone"></i>
                                            <input 
                                                type="tel" name="phone" 
                                                placeholder="Nhập số điện thoại"
                                                value={regData.phone} onChange={handleRegChange}
                                            />
                                        </div>
                                    </div>
                                    
                                    <div className="form-group">
                                        <label>Mật khẩu</label>
                                        <div className="input-with-icon">
                                            <i className="fas fa-lock"></i>
                                            <input 
                                                type={showRegPassword ? "text" : "password"} name="password"
                                                placeholder="Nhập mật khẩu (tối thiểu 8 ký tự)"
                                                value={regData.password} onChange={handleRegChange}
                                            />
                                            <button type="button" className="password-toggle" onClick={() => setShowRegPassword(!showRegPassword)}>
                                                <i className={`fas ${showRegPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                                            </button>
                                        </div>
                                        
                                        {/* Password Requirements Checklist */}
                                        <div className="password-requirements">
                                            <div className={`requirement ${passwordCriteria.length ? 'met' : 'not-met'}`}>
                                                <i className={`fas ${passwordCriteria.length ? 'fa-check-circle' : 'fa-circle'}`}></i> Tối thiểu 8 ký tự
                                            </div>
                                            <div className={`requirement ${passwordCriteria.case ? 'met' : 'not-met'}`}>
                                                <i className={`fas ${passwordCriteria.case ? 'fa-check-circle' : 'fa-circle'}`}></i> Chứa chữ hoa và chữ thường
                                            </div>
                                            <div className={`requirement ${passwordCriteria.number ? 'met' : 'not-met'}`}>
                                                <i className={`fas ${passwordCriteria.number ? 'fa-check-circle' : 'fa-circle'}`}></i> Có ít nhất 1 số
                                            </div>
                                            <div className={`requirement ${passwordCriteria.special ? 'met' : 'not-met'}`}>
                                                <i className={`fas ${passwordCriteria.special ? 'fa-check-circle' : 'fa-circle'}`}></i> Có ít nhất 1 ký tự đặc biệt
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div className="form-group">
                                        <label>Xác nhận mật khẩu</label>
                                        <div className="input-with-icon">
                                            <i className="fas fa-lock"></i>
                                            <input 
                                                type="password" name="confirmPassword"
                                                placeholder="Nhập lại mật khẩu"
                                                value={regData.confirmPassword} onChange={handleRegChange}
                                            />
                                        </div>
                                    </div>
                                    
                                    <div className="checkbox-group">
                                        <input 
                                            type="checkbox" name="terms" id="terms"
                                            checked={regData.terms} onChange={handleRegChange}
                                        />
                                        <label htmlFor="terms">Tôi đồng ý với <span className="auth-link">Điều khoản dịch vụ</span> và <span className="auth-link">Chính sách bảo mật</span></label>
                                    </div>
                                    
                                    <button type="submit" className="auth-btn" disabled={isLoading}>
                                        {isLoading ? 'Đang xử lý...' : 'Đăng ký tài khoản'}
                                    </button>
                                    
                                    <div className="auth-links">
                                        <span className="auth-link" onClick={() => setActiveTab('login')}>Đã có tài khoản? Đăng nhập ngay</span>
                                    </div>
                                </form>
                            )}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="auth-footer">
                    <p>© 2024 AURA Screening. Hệ thống sàng lọc sức khỏe mạch máu võng mạc.</p>
                    <p>Phát triển bởi nhóm nghiên cứu SP26SE025</p>
                </div>
            </div>

            {/* Forgot Password Modal */}
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
                            <button className="auth-btn" style={{backgroundColor: '#f8f9fa', color: '#333', border: '1px solid #ddd'}}>
                                Xác thực bằng số điện thoại
                            </button>
                        </div>
                        
                        <p style={{marginTop: '20px', fontSize: '14px', color: '#666', textAlign: 'center'}}>
                            Liên kết sẽ được gửi đến email trong vòng 5 phút
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AuthPage;