import React, { useState, useEffect } from 'react';
import medicalApi from '../../../../api/medicalApi';
import { useAuth } from '../../../../context/AuthContext';

const PatientProfile = () => {
    const { user, login } = useAuth();
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});
    
    const [formData, setFormData] = useState({
        fullName: '',
        dateOfBirth: '',
        gender: 'Nam',
        phoneNumber: '',
        address: ''
    });

    // --- HÀM LÀM SẠCH SỐ ĐIỆN THOẠI (FIX MỚI) ---
    const cleanPhoneNumber = (raw) => {
        if (!raw) return '';
        let str = String(raw).trim();

        // Trường hợp 1: Bạn nhập +84038... (Dư số 0 sau mã vùng)
        // Cắt bỏ 4 ký tự đầu (+840) rồi thêm lại số 0
        if (str.startsWith('+840')) {
            return '0' + str.slice(4); 
        }

        // Trường hợp 2: Bạn nhập +8438... (Chuẩn quốc tế)
        // Cắt bỏ 3 ký tự đầu (+84) rồi thêm số 0
        if (str.startsWith('+84')) {
            return '0' + str.slice(3);
        }

        // Trường hợp 3: Bạn nhập 840... (Quên dấu +)
        if (str.startsWith('840')) {
            return '0' + str.slice(3);
        }

        return str;
    };

    useEffect(() => {
        if (user) {
            setFormData({
                fullName: user.fullName || '',
                dateOfBirth: user.dateOfBirth ? user.dateOfBirth.split('T')[0] : '',
                gender: (user.gender === 'Male' ? 'Nam' : (user.gender === 'Female' ? 'Nữ' : (user.gender || 'Nam'))),
                
                // Áp dụng hàm làm sạch ngay khi load dữ liệu
                phoneNumber: cleanPhoneNumber(user.phoneNumber),
                
                address: user.address || ''
            });
        }
    }, [user]);

    const validateForm = () => {
        const newErrors = {};
        if (!formData.fullName || formData.fullName.trim().length < 2) {
            newErrors.fullName = "Vui lòng nhập họ tên hợp lệ.";
        }
        
        // Validate: Chỉ chấp nhận số, 10 ký tự, bắt đầu bằng 0
        if (!formData.phoneNumber) {
            newErrors.phoneNumber = "Vui lòng nhập số điện thoại.";
        } else if (!/^0\d{9}$/.test(formData.phoneNumber)) {
            newErrors.phoneNumber = "SĐT phải có 10 số và bắt đầu bằng 0.";
        }

        if (!formData.dateOfBirth) newErrors.dateOfBirth = "Vui lòng chọn ngày sinh.";

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (errors[name]) setErrors(prev => ({ ...prev, [name]: null }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateForm()) return;

        setLoading(true);
        try {
            await medicalApi.updateProfile(formData);
            
            const updatedUser = { 
                ...user, 
                ...formData,
            };
            const token = localStorage.getItem('aura_token');
            login({ ...updatedUser, token }); 

            alert("✅ Cập nhật hồ sơ thành công!");
        } catch (error) {
            console.error("Lỗi:", error);
            alert("❌ Có lỗi xảy ra: " + (error.response?.data?.title || error.message));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="pro-card">
            <div className="card-header">
                <h3>Thông tin hành chính</h3>
                <button className="btn-save" onClick={handleSubmit} disabled={loading}>
                    {loading ? 'Đang lưu...' : 'Lưu Thay Đổi'}
                </button>
            </div>
            
            <div className="form-body">
                <div className="input-grid">
                    <div className="input-group">
                        <label>Họ và tên *</label>
                        <input type="text" name="fullName" 
                            className={`input-field ${errors.fullName ? 'error' : ''}`} 
                            value={formData.fullName} onChange={handleChange} />
                    </div>

                    <div className="input-group">
                        <label>Số điện thoại *</label>
                        <input type="text" name="phoneNumber" 
                            className={`input-field ${errors.phoneNumber ? 'error' : ''}`} 
                            value={formData.phoneNumber} onChange={handleChange} 
                            placeholder="0912345678"
                        />
                        {/* Hiển thị lỗi nếu có */}
                        {errors.phoneNumber && (
                            <span className="error-text">
                                <i className="fas fa-exclamation-circle"></i> {errors.phoneNumber}
                            </span>
                        )}
                    </div>

                    <div className="input-group">
                        <label>Ngày sinh *</label>
                        <input type="date" name="dateOfBirth" 
                            className={`input-field ${errors.dateOfBirth ? 'error' : ''}`} 
                            value={formData.dateOfBirth} onChange={handleChange} />
                    </div>

                    <div className="input-group">
                        <label>Giới tính *</label>
                        <select name="gender" className="input-field" 
                            value={formData.gender} onChange={handleChange}>
                            <option value="Nam">Nam</option>
                            <option value="Nữ">Nữ</option>
                            <option value="Khác">Khác</option>
                        </select>
                    </div>
                </div>
                <div className="input-group">
                    <label>Địa chỉ thường trú</label>
                    <input type="text" name="address" className="input-field" 
                        value={formData.address} onChange={handleChange} />
                </div>
            </div>
        </div>
    );
};

export default PatientProfile;