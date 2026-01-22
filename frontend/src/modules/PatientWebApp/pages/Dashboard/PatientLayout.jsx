import React, { useState } from 'react';
import { useAuth } from '../../../../context/AuthContext';
import './PatientDashboard.css';
import UploadSection from './PatientUpload'; 
import PatientHistory from './PatientHistory';
import PatientHome from './PatientHome'; 
import PatientProfile from './PatientProfile';

const PatientLayout = () => {
    const { user, logout, loading } = useAuth();
    const [activeTab, setActiveTab] = useState('home');

    const getInitials = (name) => {
        if (!name) return 'BN';
        const parts = name.trim().split(' ');
        return parts.length === 1 ? parts[0][0] : (parts[0][0] + parts[parts.length - 1][0]);
    };

    if (loading) return null;

    return (
        <div className="dashboard-layout">
            <aside className="sidebar-container">
                <div className="brand-section">
                    <div className="brand-logo-box"><i className="fas fa-heartbeat"></i></div>
                    <div className="brand-info"><h1>AURA MED</h1><span>SP26SE025</span></div>
                </div>
                <nav className="nav-links">
                    <div className={`nav-item ${activeTab === 'home' ? 'active' : ''}`} onClick={() => setActiveTab('home')}>
                        <i className="fas fa-home"></i><span>Trang chủ</span>
                    </div>
                    <div className={`nav-item ${activeTab === 'profile' ? 'active' : ''}`} onClick={() => setActiveTab('profile')}>
                        <i className="fas fa-id-card-alt"></i><span>Hồ sơ sức khỏe</span>
                    </div>
                    <div className={`nav-item ${activeTab === 'upload' ? 'active' : ''}`} onClick={() => setActiveTab('upload')}>
                        <i className="fas fa-brain"></i><span>Sàng lọc AI</span>
                    </div>
                    <div className={`nav-item ${activeTab === 'history' ? 'active' : ''}`} onClick={() => setActiveTab('history')}>
                        <i className="fas fa-history"></i><span>Lịch sử khám</span>
                    </div>
                </nav>
                <div className="user-mini-profile">
                    <div className="mini-avatar">{getInitials(user?.fullName || user?.FullName || 'BN').toUpperCase()}</div>
                    <div className="mini-info">
                        <h4>{user?.fullName || user?.FullName || 'Bệnh Nhân'}</h4>
                        <p>Đang trực tuyến</p>
                    </div>
                </div>
            </aside>
            <main className="main-wrapper">
                <header className="top-bar">
                    <div className="page-breadcrumb">Bảng điều khiển Bệnh nhân</div>
                    <div className="top-actions">
                        <span>Xin chào, <b>{user?.fullName || user?.FullName}</b></span>
                        <button className="logout-btn" onClick={logout}>Đăng xuất</button>
                    </div>
                </header>
                <div className="content-area">
                    {activeTab === 'home' && <PatientHome user={user} setTab={setActiveTab} />}
                    {activeTab === 'profile' && <PatientProfile />}
                    {activeTab === 'upload' && <UploadSection onUploadSuccess={() => setActiveTab('history')} />}
                    {activeTab === 'history' && <PatientHistory />}
                </div>
            </main>
        </div>
    );
};

export default PatientLayout;