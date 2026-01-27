import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../../context/AuthContext';
import Sidebar from '../../../../components/Sidebar/Sidebar'; 
import { Outlet, useNavigate, useLocation } from 'react-router-dom'; // Thêm Outlet và useNavigate
import './PatientDashboard.css';

const PatientLayout: React.FC = () => {
    const { user, logout, loading } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [activeTab, setActiveTab] = useState<string>('home');

    // Đồng bộ Tab dựa trên URL thực tế
    useEffect(() => {
        const path = location.pathname;
        if (path.includes('upload')) setActiveTab('upload');
        else if (path.includes('history')) setActiveTab('history');
        else if (path.includes('profile')) setActiveTab('profile');
        else setActiveTab('home');
    }, [location.pathname]);

    const handleTabClick = (tab: string) => {
        setActiveTab(tab);
        if (tab === 'home') navigate('/patient/dashboard');
        else navigate(`/patient/${tab}`);
    };

    if (loading) return <div style={{textAlign: 'center', padding: '50px'}}>Đang tải...</div>;

    return (
        <div className="dashboard-layout" style={{ display: 'flex' }}>
            <Sidebar />

            <main className="main-wrapper" style={{ marginLeft: '250px', width: 'calc(100% - 250px)', minHeight: '100vh', background: '#f7fafc' }}>
                <header className="top-bar" style={{ background: '#fff', padding: '15px 30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                    <div style={{ fontWeight: 'bold', color: '#0ea5e9', fontSize: '18px' }}>
                        🏥 AURA SCREENING | Bệnh nhân
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                        <span>Xin chào, <b>{user?.fullName || 'Bệnh Nhân'}</b></span>
                        <button className="logout-btn" onClick={logout} style={{ padding: '6px 15px', borderRadius: '5px', border: '1px solid #fc8181', color: '#fc8181', cursor: 'pointer', background: 'none' }}>
                            Đăng xuất
                        </button>
                    </div>
                </header>

                <div className="content-area" style={{ padding: '30px' }}>
                    {/* Navigation con */}
                    <div className="patient-internal-nav" style={{ marginBottom: '25px', display: 'flex', gap: '10px' }}>
                        <button className={`nav-item ${activeTab === 'home' ? 'active' : ''}`} onClick={() => handleTabClick('home')}>Tổng quan</button>
                        <button className={`nav-item ${activeTab === 'upload' ? 'active' : ''}`} onClick={() => handleTabClick('upload')}>Sàng lọc AI</button>
                        <button className={`nav-item ${activeTab === 'history' ? 'active' : ''}`} onClick={() => handleTabClick('history')}>Lịch sử</button>
                        <button className={`nav-item ${activeTab === 'profile' ? 'active' : ''}`} onClick={() => handleTabClick('profile')}>Hồ sơ</button>
                    </div>

                    <div className="tab-content-render animate-fade-in">
                        {/* QUAN TRỌNG: Outlet sẽ là nơi hiển thị các trang con từ AppRoutes */}
                        <Outlet /> 
                    </div>
                </div>
            </main>
        </div>
    );
};
export default PatientLayout;