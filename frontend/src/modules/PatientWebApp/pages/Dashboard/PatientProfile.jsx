import React, { useState, useEffect } from 'react';
import medicalApi from '../../../../api/medicalApi';
import './PatientProfile.css';

const PatientProfile = () => {
    const [profile, setProfile] = useState({
        fullName: '',
        dateOfBirth: '',
        gender: '',
        phoneNumber: '',
        address: ''
    });
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState({ type: '', text: '' });

    // 1. Tải hồ sơ hiện tại khi mở trang
    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            setLoading(true);
            const data = await medicalApi.getPatientProfile();
            if (data) {
                // Chuyển định dạng ngày yyyy-MM-dd để hiển thị trên input date
                // Dùng phương thức slice(0, 10) để lấy phần ngày an toàn hơn split
                const formattedDate = data.dateOfBirth ? data.dateOfBirth.slice(0, 10) : '';
                
                // Cập nhật state từ dữ liệu trả về (camelCase)
                setProfile({
                    fullName: data.fullName || '',
                    dateOfBirth: formattedDate,
                    gender: data.gender || '',
                    phoneNumber: data.phoneNumber || '',
                    address: data.address || ''
                });
            }
        } catch (error) {
            // Nếu 404 tức là chưa có hồ sơ (đúng logic của Backend trả về NotFound)
            if (error.response && error.response.status === 404) {
                console.log("Hệ thống: Chưa có hồ sơ y tế, người dùng có thể tạo mới.");
            } else {
                setMessage({ type: 'error', text: 'Không thể tải hồ sơ. Vui lòng kiểm tra kết nối Gateway.' });
            }
        } finally {
            setLoading(false);
        }
    };

    // 2. Xử lý lưu/cập nhật hồ sơ (UPSERT)
    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage({ type: '', text: '' }); // Xóa thông báo cũ

        try {
            // Gọi API UpdateProfile (Logic UPSERT đã có sẵn trong Backend của bạn)
            await medicalApi.updateProfile(profile);
            
            setMessage({ type: 'success', text: 'Cập nhật hồ sơ sức khỏe thành công!' });
            
            // Cuộn lên đầu trang để người dùng thấy thông báo thành công
            window.scrollTo({ top: 0, behavior: 'smooth' });

            // Tự động xóa thông báo sau 3 giây
            setTimeout(() => setMessage({ type: '', text: '' }), 3000);
        } catch (error) {
            // Xử lý lỗi trả về từ FluentValidation hoặc lỗi hệ thống
            const errorResponse = error.response?.data;
            let errorMsg = 'Lỗi cập nhật hồ sơ.';

            if (errorResponse?.errors) {
                // Nếu là lỗi từ FluentValidation (mảng lỗi)
                errorMsg = Array.isArray(errorResponse.errors) 
                    ? errorResponse.errors[0] 
                    : Object.values(errorResponse.errors)[0];
            } else if (errorResponse?.detail) {
                errorMsg = errorResponse.detail;
            } else if (typeof errorResponse === 'string') {
                errorMsg = errorResponse;
            }

            setMessage({ type: 'error', text: errorMsg });
        } finally {
            setLoading(false);
        }
    };

    if (loading && !profile.fullName) {
        return (
            <div className="profile-loading-box">
                <div className="loader"></div>
                <p>Đang tải dữ liệu hồ sơ y tế...</p>
            </div>
        );
    }

    return (
        <div className="profile-container animate-fade-in">
            <div className="profile-header">
                <h3>Hồ sơ sức khỏe cá nhân</h3>
                <p className="subtitle">Thông tin này bắt buộc để thực hiện sàng lọc AI (Dự án AURA)</p>
            </div>
            
            {message.text && (
                <div className={`alert-banner ${message.type}`}>
                    <i className={message.type === 'success' ? 'fas fa-check-circle' : 'fas fa-exclamation-triangle'}></i>
                    {message.text}
                </div>
            )}

            <form onSubmit={handleSubmit} className="profile-form">
                <div className="form-section">
                    <div className="form-group full-width">
                        <label><i className="fas fa-user"></i> Họ và tên</label>
                        <input 
                            type="text" 
                            placeholder="Nhập họ và tên đầy đủ"
                            value={profile.fullName} 
                            onChange={(e) => setProfile({...profile, fullName: e.target.value})} 
                            required 
                        />
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label><i className="fas fa-calendar-alt"></i> Ngày sinh</label>
                            <input 
                                type="date" 
                                value={profile.dateOfBirth} 
                                onChange={(e) => setProfile({...profile, dateOfBirth: e.target.value})} 
                                required 
                            />
                        </div>
                        <div className="form-group">
                            <label><i className="fas fa-venus-mars"></i> Giới tính</label>
                            <select 
                                value={profile.gender} 
                                onChange={(e) => setProfile({...profile, gender: e.target.value})} 
                                required
                            >
                                <option value="">-- Chọn giới tính --</option>
                                <option value="Male">Nam</option>
                                <option value="Female">Nữ</option>
                                <option value="Other">Khác</option>
                            </select>
                        </div>
                    </div>

                    <div className="form-group full-width">
                        <label><i className="fas fa-phone"></i> Số điện thoại</label>
                        <input 
                            type="tel" 
                            placeholder="Ví dụ: 0912345678"
                            value={profile.phoneNumber} 
                            onChange={(e) => setProfile({...profile, phoneNumber: e.target.value})} 
                            required 
                        />
                    </div>

                    <div className="form-group full-width">
                        <label><i className="fas fa-map-marker-alt"></i> Địa chỉ liên lạc</label>
                        <textarea 
                            placeholder="Số nhà, tên đường, phường/xã..."
                            rows="3"
                            value={profile.address} 
                            onChange={(e) => setProfile({...profile, address: e.target.value})} 
                            required 
                        />
                    </div>
                </div>

                <div className="form-actions">
                    <button type="submit" className="save-btn" disabled={loading}>
                        {loading ? (
                            <><i className="fas fa-spinner fa-spin"></i> Đang lưu...</>
                        ) : (
                            <><i className="fas fa-save"></i> Lưu hồ sơ sức khỏe</>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default PatientProfile;