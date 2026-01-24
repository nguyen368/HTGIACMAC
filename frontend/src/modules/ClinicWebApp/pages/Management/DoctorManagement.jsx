import React, { useState, useEffect } from 'react';
import axiosClient from '../../../../api/axiosClient';
import './DoctorManagement.css';

const DoctorManagement = () => {
    const [doctors, setDoctors] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({ fullName: '', email: '', password: '' });

    // Lấy danh sách bác sĩ
    const fetchDoctors = async () => {
        try {
            const res = await axiosClient.get('/identity/clinics/my-doctors');
            setDoctors(res);
        } catch (err) { console.error("Lỗi lấy danh sách:", err); }
    };

    useEffect(() => { fetchDoctors(); }, []);

    // Thêm bác sĩ mới
    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await axiosClient.post('/identity/clinics/doctors', formData);
            alert("Thêm bác sĩ thành công!");
            setShowModal(false);
            fetchDoctors();
        } catch (err) { alert("Lỗi: " + err.response?.data || err.message); }
    };

    return (
        <div className="management-container">
            <div className="page-header">
                <h2>Quản lý Bác sĩ</h2>
                <button className="add-btn" onClick={() => setShowModal(true)}>+ Thêm Bác sĩ</button>
            </div>

            <table className="doctor-table">
                <thead>
                    <tr>
                        <th>Họ Tên</th>
                        <th>Email</th>
                        <th>Ngày tạo</th>
                        <th>Trạng thái</th>
                    </tr>
                </thead>
                <tbody>
                    {doctors.map(doc => (
                        <tr key={doc.id}>
                            <td>{doc.fullName}</td>
                            <td>{doc.email}</td>
                            <td>{new Date(doc.createdAt).toLocaleDateString('vi-VN')}</td>
                            <td><span className="badge-doctor">Đang hoạt động</span></td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {showModal && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h3>Đăng ký tài khoản Bác sĩ</h3>
                        <form onSubmit={handleSubmit}>
                            <input type="text" placeholder="Họ và tên" required 
                                onChange={e => setFormData({...formData, fullName: e.target.value})} />
                            <input type="email" placeholder="Email" required 
                                onChange={e => setFormData({...formData, email: e.target.value})} />
                            <input type="password" placeholder="Mật khẩu" required 
                                onChange={e => setFormData({...formData, password: e.target.value})} />
                            <div className="modal-actions">
                                <button type="submit" className="save-btn">Lưu</button>
                                <button type="button" className="cancel-btn" onClick={() => setShowModal(false)}>Hủy</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DoctorManagement;