import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const Sidebar = () => {
  const { user, logout } = useAuth();
  const location = useLocation();

  // CHUẨN HÓA: Chuyển role về chữ thường để so sánh chính xác với dữ liệu từ AuthContext
  const role = user?.role?.toLowerCase();

  const getMenuItems = () => {
    if (role === 'patient') {
      return [
        { path: '/patient/dashboard', label: 'Trang chủ', icon: 'home' },
        { path: '/patient/profile', label: 'Hồ sơ của tôi', icon: 'user' },
        { path: '/patient/history', label: 'Lịch sử khám', icon: 'history' },
      ];
    }

    // Tích hợp cho cả ClinicAdmin và ClinicOwner
    if (role === 'clinicadmin' || role === 'clinicowner') {
      return [
        { path: '/clinic/dashboard', label: 'Báo cáo tổng quan', icon: 'chart-line' },
        { path: '/clinic/doctors', label: 'Quản lý bác sĩ', icon: 'user-md' },
        { path: '/clinic/queue', label: 'Danh sách chờ khám', icon: 'list' },
        { path: '/clinic/upload', label: 'Tải ảnh hàng loạt', icon: 'upload' },
      ];
    }

    if (role === 'doctor') {
      return [
        { path: '/clinic/queue', label: 'Danh sách chờ khám', icon: 'list' },
        { path: '/clinic/history', label: 'Lịch sử chẩn đoán', icon: 'notes-medical' },
      ];
    }

    return [];
  };

  const menuItems = getMenuItems();

  return (
    <div className="sidebar" style={{ width: '250px', height: '100vh', background: '#1e293b', color: 'white', position: 'fixed', left: 0, top: 0, display: 'flex', flexDirection: 'column' }}>
      <div className="sidebar-logo" style={{ padding: '25px', borderBottom: '1px solid #334155', textAlign: 'center' }}>
        <h3 style={{ margin: 0, color: '#38bdf8' }}>AURA AI</h3>
      </div>
      
      <nav className="sidebar-nav" style={{ flex: 1, padding: '20px 0' }}>
        {menuItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}
            style={{ 
                display: 'flex', 
                alignItems: 'center', 
                padding: '12px 25px', 
                color: location.pathname === item.path ? '#38bdf8' : '#94a3b8',
                textDecoration: 'none',
                background: location.pathname === item.path ? '#334155' : 'transparent',
                transition: '0.3s'
            }}
          >
            <i className={`fas fa-${item.icon}`} style={{ marginRight: '15px', width: '20px' }}></i>
            <span>{item.label}</span>
          </Link>
        ))}
      </nav>

      {/* THÊM NÚT ĐĂNG XUẤT NHANH */}
      <div className="sidebar-footer" style={{ padding: '20px', borderTop: '1px solid #334155' }}>
        <button onClick={logout} style={{ width: '100%', padding: '10px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 600 }}>
          <i className="fas fa-sign-out-alt"></i> Đăng xuất
        </button>
      </div>
    </div>
  );
};

export default Sidebar;