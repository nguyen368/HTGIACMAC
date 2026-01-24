import React, { useState } from 'react';
import { useAuth } from '../../../../context/AuthContext';
// Đảm bảo đường dẫn này khớp với vị trí thực tế của file Sidebar.tsx
import Sidebar from '../../../../components/Sidebar/Sidebar'; 
import './PatientDashboard.css';
import PatientUpload from './PatientUpload'; 
import PatientHistory from './PatientHistory';
import PatientHome from './PatientHome'; 
import PatientProfile from './PatientProfile';

const PatientLayout: React.FC = () => {
    const { user, logout, loading } = useAuth();
    const [activeTab, setActiveTab] = useState<string>('home');

    // Hàm lấy chữ cái đầu (Giữ nguyên logic cũ)
    const getInitials = (name: string | undefined) => {
        if (!name) return 'BN';
        const parts = name.trim().split(' ');
        return parts.length === 1 ? parts[0][0] : (parts[0][0] + parts[parts.length - 1][0]);
    };

    if (loading) return null;

    return (
        <div className="dashboard-layout" style={{ display: 'flex' }}>
            {/* Sử dụng Sidebar chung của hệ thống */}
            <Sidebar />

            <main className="main-wrapper" style={{ marginLeft: '250px', width: 'calc(100% - 250px)', minHeight: '100vh', background: '#f7fafc' }}>
                <header className="top-bar" style={{ background: '#fff', padding: '15px 30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                    <div className="page-breadcrumb" style={{ fontWeight: 'bold', color: '#4a5568' }}>
                        🏥 AURA MED | Phân hệ Bệnh nhân
                    </div>
                    <div className="top-actions" style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                        {/* SỬA LỖI TẠI ĐÂY: 
                            Sử dụng (user as any) để giữ nguyên logic kiểm tra FullName (viết hoa) 
                            mà không bị TypeScript báo lỗi 
                        */}
                        <span>Xin chào, <b>{user?.fullName || (user as any)?.FullName || 'Bệnh Nhân'}</b></span>
                        <button 
                            className="logout-btn" 
                            onClick={logout}
                            style={{ padding: '6px 15px', borderRadius: '5px', border: '1px solid #fc8181', color: '#fc8181', cursor: 'pointer', background: 'none' }}
                        >
                            Đăng xuất
                        </button>
                    </div>
                </header>

                <div className="content-area" style={{ padding: '30px' }}>
                    {/* Thanh Tab nội bộ của Bệnh nhân (Giữ nguyên cấu trúc cũ) */}
                    <div className="patient-internal-nav" style={{ marginBottom: '25px', display: 'flex', gap: '10px' }}>
                        <button className={`tab-btn ${activeTab === 'home' ? 'active' : ''}`} onClick={() => setActiveTab('home')}>Tổng quan</button>
                        <button className={`tab-btn ${activeTab === 'profile' ? 'active' : ''}`} onClick={() => setActiveTab('profile')}>Hồ sơ</button>
                        <button className={`tab-btn ${activeTab === 'upload' ? 'active' : ''}`} onClick={() => setActiveTab('upload')}>Sàng lọc AI</button>
                        <button className={`tab-btn ${activeTab === 'history' ? 'active' : ''}`} onClick={() => setActiveTab('history')}>Lịch sử</button>
                    </div>

                    <div className="tab-content-render">
                        {/* Giữ nguyên logic render tab và truyền props cần thiết 
                            để thỏa mãn các interface của component con
                        */}
                        {activeTab === 'home' && <PatientHome user={user} setTab={setActiveTab} />}
                        {activeTab === 'profile' && <PatientProfile />}
                        {activeTab === 'upload' && <PatientUpload onUploadSuccess={() => setActiveTab('history')} />}
                        {activeTab === 'history' && <PatientHistory />}
                    </div>
                </div>
            </main>
        </div>
    );
};

export default PatientLayout;