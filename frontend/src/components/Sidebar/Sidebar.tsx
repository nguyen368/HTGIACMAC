import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import jwtDecode from 'jwt-decode'; // Sửa lỗi theo gợi ý: dùng default import

interface MenuItem {
    name: string;
    path: string;
    icon: string;
}

interface MenuGroups {
    [key: string]: MenuItem[];
}

const Sidebar: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const token = localStorage.getItem('aura_token');
    
    if (!token) return null;
    
    let userRole: string = '';
    try {
        const decoded: any = jwtDecode(token);
        const roleKey = "http://schemas.microsoft.com/ws/2008/06/identity/claims/role";
        userRole = (decoded[roleKey] || decoded.role || '').toLowerCase();
    } catch (e) {
        return null;
    }

    const menuItems: MenuGroups = {
        admin: [
            { name: 'Dashboard Admin', path: '/admin/dashboard', icon: '📊' },
            { name: 'Quản lý phòng khám', path: '/admin/users', icon: '🏥' }
        ],
        clinicadmin: [
            { name: 'Tổng quan Clinic', path: '/clinic/dashboard', icon: '📈' },
            { name: 'Hàng đợi phòng khám', path: '/doctor/queue', icon: '📋' },
            { name: 'Thiết bị IoT (Test)', path: '/hardware-simulator', icon: '🔧' }
        ],
        doctor: [
            { name: 'Hàng chờ khám', path: '/doctor/queue', icon: '📋' },
            { name: 'Lịch sử ca khám', path: '/doctor/history', icon: '📜' },
            { name: 'Thiết bị chụp ảnh', path: '/hardware-simulator', icon: '📸' }
        ],
        patient: [
            { name: 'Trang chủ', path: '/patient/dashboard', icon: '🏠' },
            { name: 'Hồ sơ sức khỏe', path: '/patient/profile', icon: '👤' },
            { name: 'Lịch sử khám', path: '/patient/history', icon: '📂' },
            { name: 'Sàng lọc AI', path: '/patient/upload', icon: '📤' }
        ]
    };

    const currentMenu = menuItems[userRole] || [];

    return (
        <div className="sidebar" style={{ width: '250px', background: '#1a202c', color: 'white', height: '100vh', padding: '20px', position: 'fixed', left: 0, top: 0, zIndex: 1000 }}>
            <div style={{ marginBottom: '30px', borderBottom: '1px solid #4a5568', paddingBottom: '15px' }}>
                <h2 style={{ fontSize: '20px', color: '#63b3ed', margin: 0 }}>AURA SYSTEM</h2>
                <small style={{ color: '#a0aec0' }}>Retinal Health Screening</small>
            </div>
            <ul style={{ listStyle: 'none', padding: 0 }}>
                {currentMenu.map((item) => (
                    <li 
                        key={item.path} 
                        onClick={() => navigate(item.path)}
                        style={{ 
                            padding: '12px 15px', 
                            cursor: 'pointer', 
                            borderRadius: '8px',
                            background: location.pathname.includes(item.path) ? '#2d3748' : 'transparent',
                            color: location.pathname.includes(item.path) ? '#63b3ed' : 'white',
                            marginBottom: '10px',
                            display: 'flex',
                            alignItems: 'center',
                            transition: 'all 0.2s'
                        }}
                    >
                        <span style={{ marginRight: '12px', fontSize: '18px' }}>{item.icon}</span>
                        <span style={{ fontWeight: location.pathname.includes(item.path) ? 'bold' : 'normal' }}>{item.name}</span>
                    </li>
                ))}
            </ul>
            <div style={{ position: 'absolute', bottom: '20px', width: '210px' }}>
                <li 
                    onClick={() => { localStorage.clear(); navigate('/auth'); }}
                    style={{ listStyle: 'none', padding: '12px', cursor: 'pointer', color: '#fc8181', display: 'flex', alignItems: 'center', borderTop: '1px solid #4a5568' }}
                >
                    <span style={{ marginRight: '12px' }}>🚪</span> Đăng xuất
                </li>
            </div>
        </div>
    );
};

export default Sidebar;