import React, { useState, useEffect } from 'react';
import medicalApi from '../../../../api/medicalApi';
import { useAuth } from '../../../../context/AuthContext';

const PatientProfile = () => {
    const { user, login } = useAuth();
    const [loading, setLoading] = useState(false);
    const [fieldErrors, setFieldErrors] = useState({}); // Lưu lỗi chi tiết từng ô
    
    const [formData, setFormData] = useState({
        fullName: '',
        dateOfBirth: '',
        gender: 'Nam',
        phoneNumber: '',
        address: ''
    });

    useEffect(() => {
        if (user) {
            setFormData({
                fullName: user.fullName || user.FullName || '',
                dateOfBirth: user.dateOfBirth ? user.dateOfBirth.split('T')[0] : (user.DateOfBirth ? user.DateOfBirth.split('T')[0] : ''),
                gender: (user.gender === 'Male' || user.Gender === 'Male') ? 'Nam' : 'Nữ',
                phoneNumber: user.phoneNumber || user.PhoneNumber || '',
                address: user.address || user.Address || ''
            });
        }
    }, [user]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (fieldErrors[name]) setFieldErrors(prev => ({ ...prev, [name]: null }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setFieldErrors({});

        try {
            // --- LÀM SẠCH DỮ LIỆU SĐT ĐỂ KHỚP REGEX BACKEND ---
            let cleanPhone = formData.phoneNumber.trim().replace(/\s/g, '');
            if (cleanPhone.startsWith('+84')) cleanPhone = '0' + cleanPhone.slice(3);
            if (cleanPhone.startsWith('84') && cleanPhone.length > 10) cleanPhone = '0' + cleanPhone.slice(2);

            const requestData = {
                FullName: formData.fullName,
                PhoneNumber: cleanPhone,
                Address: formData.address,
                Gender: formData.gender === 'Nam' ? 'Male' : 'Female',
                DateOfBirth: formData.dateOfBirth ? new Date(formData.dateOfBirth).toISOString() : null
            };

            const response = await medicalApi.updateProfile(requestData);
            
            if (login) await login(response); 
            alert("✅ Cập nhật hồ sơ thành công!");
        } catch (error) {
            if (error.response && error.response.status === 400) {
                // Xử lý lỗi validation từ FluentValidation Backend
                const serverErrors = error.response.data.errors;
                console.error("Validation Errors:", serverErrors);
                
                // Nếu lỗi trả về dạng mảng chuỗi (như log bạn gửi)
                if (Array.isArray(serverErrors)) {
                    alert("❌ Lỗi: " + serverErrors.join("\n"));
                } else {
                    alert("❌ Lỗi dữ liệu: Vui lòng kiểm tra lại Số điện thoại hoặc Họ tên.");
                }
            } else {
                alert("❌ Lỗi hệ thống (500): Hãy chắc chắn đã chạy 'dotnet ef database update'");
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="pro-card">
            <div className="card-header">
                <div>
                    <h3>Hồ sơ sức khỏe</h3>
                    <p className="subtitle">Mã bệnh nhân: {user?.id || 'Chưa khởi tạo'}</p>
                </div>
                <button className="btn-save" onClick={handleSubmit} disabled={loading}>
                    {loading ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-save"></i>} 
                    {loading ? ' Đang lưu...' : ' Lưu thay đổi'}
                </button>
            </div>

            <div className="form-body">
                <div className="input-grid">
                    <div className="input-group">
                        <label>HỌ VÀ TÊN *</label>
                        <input type="text" name="fullName" className="input-field" 
                            value={formData.fullName} onChange={handleChange} placeholder="Nhập đầy đủ họ tên" />
                    </div>
                    <div className="input-group">
                        <label>SỐ ĐIỆN THOẠI *</label>
                        <input 
                            type="text" 
                            name="phoneNumber"
                            className="input-field" 
                            value={formData.phoneNumber} 
                            onChange={handleChange}
                            placeholder="Ví dụ: 0912345678"
                            // Nếu đã có SĐT thì khóa, nếu chưa có thì cho phép nhập
                            readOnly={!!(user?.phoneNumber || user?.PhoneNumber)} 
                            style={!!(user?.phoneNumber || user?.PhoneNumber) ? {background: '#f1f5f9'} : {}}
                        />
                    </div>
                    <div className="input-group">
                        <label>NGÀY SINH *</label>
                        <input type="date" name="dateOfBirth" className="input-field" 
                            value={formData.dateOfBirth} onChange={handleChange} />
                    </div>
                    <div className="input-group">
                        <label>GIỚI TÍNH *</label>
                        <select name="gender" className="input-field" value={formData.gender} onChange={handleChange}>
                            <option value="Nam">Nam</option>
                            <option value="Nữ">Nữ</option>
                        </select>
                    </div>
                </div>
                <div className="input-group" style={{marginTop: '20px'}}>
                    <label>ĐỊA CHỈ THƯỜNG TRÚ</label>
                    <input type="text" name="address" className="input-field" 
                        value={formData.address} onChange={handleChange} placeholder="Số nhà, tên đường, phường/xã..." />
                </div>
            </div>
        </div>
    );
};

export default PatientProfile;