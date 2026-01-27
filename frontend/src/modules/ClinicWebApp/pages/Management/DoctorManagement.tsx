import React, { useState } from 'react';
import medicalApi from '../../../../api/medicalApi';
import './DoctorManagement.css';

const DoctorManagement = () => {
    const [formData, setFormData] = useState({
        username: '',
        password: '',
        email: '',
        fullName: '',
        specialty: 'Nhãn khoa'
    });
    const [status, setStatus] = useState({ type: '', message: '' });

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setStatus({ type: 'info', message: 'Đang xử lý...' });
      try {
          await medicalApi.createDoctor(formData);
          setStatus({ type: 'success', message: '✅ Tạo tài khoản bác sĩ thành công!' });
          setFormData({ username: '', password: '', email: '', fullName: '', specialty: 'Nhãn khoa' });
      } catch (error: any) {
          const errMsg = error.response?.data?.message || 'Không thể tạo tài khoản';
          setStatus({ type: 'error', message: '❌ Lỗi: ' + errMsg });
      }
    };

    return (
        <div className="doctor-mgmt-page">
            <div className="header-section">
                <h2>Quản lý Đội ngũ Bác sĩ</h2>
                <p>Tạo tài khoản chuyên môn cho các bác sĩ thuộc phòng khám.</p>
            </div>

            <div className="form-card">
                <form onSubmit={handleSubmit} className="doctor-grid-form">
                    <div className="form-group">
                        <label>Tên đăng nhập (Username)</label>
                        <input type="text" placeholder="Ví dụ: bs_quynh" required value={formData.username}
                            onChange={e => setFormData({...formData, username: e.target.value})} />
                    </div>
                    <div className="form-group">
                        <label>Email liên lạc</label>
                        <input type="email" placeholder="email@gmail.com" required value={formData.email}
                            onChange={e => setFormData({...formData, email: e.target.value})} />
                    </div>
                    <div className="form-group">
                        <label>Mật khẩu tạm thời</label>
                        <input type="password" required value={formData.password}
                            onChange={e => setFormData({...formData, password: e.target.value})} />
                    </div>
                    <div className="form-group">
                        <label>Họ và Tên bác sĩ</label>
                        <input type="text" placeholder="BS. Nguyễn Văn A" required value={formData.fullName}
                            onChange={e => setFormData({...formData, fullName: e.target.value})} />
                    </div>
                    <div className="form-group full-width">
                        <label>Chuyên khoa</label>
                        <select value={formData.specialty}
                            onChange={e => setFormData({...formData, specialty: e.target.value})}>
                            <option value="Nhãn khoa">Nhãn khoa (Mắt)</option>
                            <option value="Đa khoa">Đa khoa</option>
                        </select>
                    </div>
                    <button type="submit" className="btn-create">Kích hoạt tài khoản bác sĩ</button>
                </form>
                {status.message && (
                    <div className={`alert ${status.type}`} style={{ marginTop: '15px', padding: '10px', borderRadius: '5px', background: status.type === 'success' ? '#d4edda' : '#f8d7da' }}>
                        {status.message}
                    </div>
                )}
            </div>
        </div>
    );
};

export default DoctorManagement;