import React, { useState } from 'react';
import { useAuth } from '../../../../context/AuthContext';
import PatientHome from './PatientHome';
import PatientProfile from './PatientProfile';
import PatientUpload from './PatientUpload';
import PatientHistory from './PatientHistory';
import './PatientDashboard.css';

const PatientLayout = () => {
    const { user, logout } = useAuth();
    const [activeTab, setActiveTab] = useState('home'); // Tab mặc định

    const getInitials = (name) => {
        if (!name) return 'BN';
        const parts = name.trim().split(' ');
        return parts.length === 1 
            ? parts[0][0].toUpperCase() 
            : (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    };

    const menuItems = [
        { id: 'home', label: 'Trang chủ', icon: 'fas fa-home' },
        { id: 'profile', label: 'Hồ sơ sức khỏe', icon: 'fas fa-id-card-alt' },
        { id: 'upload', label: 'Sàng lọc AI', icon: 'fas fa-brain' },
        { id: 'history', label: 'Lịch sử khám', icon: 'fas fa-history' },
    ];

    const pageTitles = {
        'home': 'Cổng thông tin bệnh nhân',
        'profile': 'Hồ sơ cá nhân',
        'upload': 'Chẩn đoán hình ảnh',
        'history': 'Lịch sử bệnh án'
    };

    return (
        <div className="dashboard-layout">
            {/* SIDEBAR */}
            <aside className="sidebar-container">
                <div className="brand-section">
                    <div className="brand-logo-box"><i className="fas fa-heartbeat"></i></div>
                    <div className="brand-info"><h1>AURA MED</h1><span>Hospital Premium</span></div>
                </div>

                <nav className="nav-links">
                    {menuItems.map((item) => (
                        <div 
                            key={item.id}
                            className={`nav-item ${activeTab === item.id ? 'active' : ''}`}
                            onClick={() => setActiveTab(item.id)}
                        >
                            <i className={item.icon}></i>
                            <span>{item.label}</span>
                        </div>
                    ))}
                </nav>

                <div className="user-mini-profile">
                    <div className="mini-avatar">{getInitials(user?.fullName)}</div>
                    <div className="mini-info">
                        <h4>{user?.fullName || 'Bệnh Nhân'}</h4>
                        <p>Đang trực tuyến</p>
                    </div>
                </div>
            </aside>

            {/* MAIN CONTENT */}
            <main className="main-wrapper">
                <header className="top-bar">
                    <div className="page-breadcrumb">{pageTitles[activeTab]}</div>
                    <div className="top-actions">
                        <button className="logout-btn" onClick={logout}>
                            Đăng xuất <i className="fas fa-sign-out-alt" style={{marginLeft: '5px'}}></i>
                        </button>
                    </div>
                </header>

                <div className="content-area">
                    {/* Truyền user cho Home */}
                    {activeTab === 'home' && <PatientHome user={user} />}
                    
                    {activeTab === 'profile' && <PatientProfile />}
                    
                    {/* [QUAN TRỌNG] Truyền hàm onUploadSuccess để tự chuyển tab */}
                    {activeTab === 'upload' && (
                        <PatientUpload onUploadSuccess={() => setActiveTab('history')} />
                    )}
                    
                    {activeTab === 'history' && <PatientHistory />}
                </div>
            </main>
        </div>
    );
};

export default PatientLayout;