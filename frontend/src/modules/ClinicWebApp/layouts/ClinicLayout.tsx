import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../../../components/Sidebar/Sidebar';
import { useAuth } from '../../../context/AuthContext';

const ClinicLayout: React.FC = () => {
  const { user, logout } = useAuth();

  return (
    <div className="clinic-main-layout" style={{ display: 'flex', minHeight: '100vh', background: '#f8fafc' }}>
      <Sidebar />
      
      <div className="layout-content-area" style={{ marginLeft: '250px', flex: 1, display: 'flex', flexDirection: 'column' }}>
        {/* HEADER CHỨA THÔNG TIN USER VÀ NÚT THOÁT */}
        <header style={{ 
          height: '70px', 
          background: '#fff', 
          padding: '0 30px', 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          position: 'sticky',
          top: 0,
          zIndex: 10
        }}>
          <div className="header-left">
            <h2 style={{ fontSize: '1.1rem', margin: 0, color: '#1e293b' }}>
              🏥 Cổng thông tin Phòng khám
            </h2>
          </div>

          <div className="header-right" style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{user?.fullName}</div>
              <div style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'capitalize' }}>{user?.role}</div>
            </div>
            
            <button 
              onClick={logout} 
              style={{ 
                padding: '8px 16px', 
                background: '#fee2e2', 
                color: '#ef4444', 
                border: '1px solid #fecaca', 
                borderRadius: '6px', 
                cursor: 'pointer',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <i className="fas fa-sign-out-alt"></i> Thoát
            </button>
          </div>
        </header>

        <main style={{ padding: '30px', flex: 1 }}>
          {/* Nơi hiển thị Dashboard, Doctor Management, Queue... */}
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default ClinicLayout;