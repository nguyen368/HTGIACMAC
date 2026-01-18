import React from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import "../pages/Upload/ClinicUploadPage.css"; 

const ClinicLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    { path: "/clinic/dashboard", icon: "fa-chart-pie", label: "Tổng quan" },
    { path: "/clinic/patients", icon: "fa-user-injured", label: "Tiếp đón" },
    { path: "/clinic/doctor-queue", icon: "fa-stethoscope", label: "Bác sĩ / Khám" },
    { path: "/clinic/upload", icon: "fa-cloud-upload-alt", label: "Chụp ảnh (KTV)" },
  ];

  return (
    <div className="container">
      <div className="header">
        <div className="logo-text"><h1>AURA CLINIC MANAGER</h1></div>
        <div style={{display:'flex', gap:15, alignItems:'center'}}>
             <span className="badge warning">Staff Portal</span>
             <div style={{width:35, height:35, background:'#3b82f6', borderRadius:'50%', color:'white', display:'flex', alignItems:'center', justifyContent:'center'}}><i className="fas fa-user-md"></i></div>
        </div>
      </div>
      <div className="main-content">
        <div className="services-nav">
            <div className="nav-group-title">MENU</div>
            {menuItems.map(item => (
                <div key={item.path} className={`nav-item ${location.pathname.includes(item.path) ? "active" : ""}`} onClick={() => navigate(item.path)}>
                    <i className={`fas ${item.icon}`}></i> {item.label}
                </div>
            ))}
        </div>
        <div className="services-container" style={{background:'transparent', padding:0, boxShadow:'none'}}>
            <Outlet /> 
        </div>
      </div>
    </div>
  );
};
export default ClinicLayout;