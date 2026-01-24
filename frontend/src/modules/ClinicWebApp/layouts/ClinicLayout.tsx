import React from "react";
import { Outlet } from "react-router-dom";
// SỬA ĐƯỜNG DẪN: Trỏ đúng vào thư mục Sidebar mới (3 cấp từ layouts)
import Sidebar from "../../../components/Sidebar/Sidebar"; 
import "../pages/Upload/ClinicUploadPage.css"; 

const ClinicLayout: React.FC = () => {
  // Logic điều hướng chính đã được Sidebar.tsx đảm nhận dựa trên Role 'clinicadmin'
  // Tuy nhiên chúng ta giữ nguyên header và cấu trúc container của bạn

  return (
    <div className="clinic-main-layout" style={{ display: 'flex' }}>
      {/* 1. Tích hợp Sidebar hệ thống vào bên trái */}
      <Sidebar />

      {/* 2. Khu vực nội dung bên phải */}
      <div className="container" style={{ marginLeft: '250px', width: 'calc(100% - 250px)', padding: 0, minHeight: '100vh' }}>
        
        {/* Giữ nguyên Header cũ của bạn */}
        <div className="header" style={{ padding: '15px 30px', background: '#fff', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div className="logo-text"><h1>AURA CLINIC MANAGER</h1></div>
          <div style={{ display: 'flex', gap: 15, alignItems: 'center' }}>
            <span className="badge warning">Staff Portal</span>
            <div style={{ width: 35, height: 35, background: '#3b82f6', borderRadius: '50%', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <i className="fas fa-user-md"></i>
            </div>
          </div>
        </div>

        {/* Khu vực render các trang con (Dashboard, Queue, Upload...) */}
        <div className="main-content" style={{ padding: '20px' }}>
          <div className="services-container" style={{ background: 'transparent', padding: 0, boxShadow: 'none' }}>
            <Outlet /> 
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClinicLayout;