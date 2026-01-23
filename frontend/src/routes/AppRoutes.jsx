import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { jwtDecode } from "jwt-decode"; // [FIX] Thêm dấu ngoặc nhọn {}
import AuthPage from '../modules/PatientWebApp/pages/Auth/AuthPage';
import PatientLayout from '../modules/PatientWebApp/pages/Dashboard/PatientLayout';
import PatientHome from '../modules/PatientWebApp/pages/Dashboard/PatientHome';
import PatientProfile from '../modules/PatientWebApp/pages/Dashboard/PatientProfile';
import PatientHistory from '../modules/PatientWebApp/pages/Dashboard/PatientHistory';
import PatientUpload from '../modules/PatientWebApp/pages/Dashboard/PatientUpload';

// Import Pages - Clinic (Doctor)
import ClinicLayout from '../modules/ClinicWebApp/layouts/ClinicLayout';
import ClinicDashboard from '../modules/ClinicWebApp/pages/Dashboard/ClinicDashboard';
import DoctorWorkstation from '../modules/ClinicWebApp/pages/components/DoctorWorkstation';

// Component bảo vệ Route (Giữ nguyên)
const ProtectedRoute = ({ children, allowedRoles }) => {
    const token = localStorage.getItem('token');
    if (!token) return <Navigate to="/auth" replace />;

    try {
        const decoded = jwtDecode(token); // Sử dụng hàm đã import
        const roleKey = "http://schemas.microsoft.com/ws/2008/06/identity/claims/role";
        const userRole = (decoded[roleKey] || decoded.role || '').toLowerCase();
        
        // Chuẩn hóa roles cho phép về chữ thường
        const normalizedAllowedRoles = allowedRoles.map(r => r.toLowerCase());

        if (allowedRoles && !normalizedAllowedRoles.includes(userRole)) {
            // Nếu sai role, đá về trang login
            return <Navigate to="/auth" replace />; 
        }
        return children;
    } catch (error) {
        localStorage.removeItem('token');
        return <Navigate to="/auth" replace />;
    }
};

const AppRoutes = () => {
  return (
    <Routes>
      {/* 1. Mặc định vào trang đăng nhập */}
      <Route path="/" element={<Navigate to="/auth" replace />} />
      <Route path="/auth" element={<AuthPage />} />
      {/* Redirect /login về /auth để tránh lỗi đường dẫn cũ */}
      <Route path="/login" element={<Navigate to="/auth" replace />} />

            {/* 2. Route cho BÁC SĨ (Doctor) - Sử dụng Layout của Clinic */}
            <Route 
                path="/clinic" 
                element={
                    <ProtectedRoute allowedRoles={['Doctor', 'ClinicAdmin']}>
                        <ClinicLayout />
                    </ProtectedRoute>
                } 
            >
                {/* Mặc định vào Dashboard */}
                <Route index element={<ClinicDashboard />} />
                <Route path="dashboard" element={<ClinicDashboard />} />
                
                {/* Route trạm làm việc của bác sĩ */}
                <Route path="doctor-workstation" element={<DoctorWorkstation />} />
            </Route>

            {/* Giữ lại route cũ /doctor nếu muốn truy cập nhanh (Optional) */}
            <Route 
                path="/doctor" 
                element={
                    <ProtectedRoute allowedRoles={['Doctor']}>
                        <DoctorWorkstation />
                    </ProtectedRoute>
                } 
            />

            {/* 3. Route cho BỆNH NHÂN (Patient) */}
            <Route 
                path="/patient" 
                element={
                    <ProtectedRoute allowedRoles={['Patient']}>
                        <PatientLayout />
                    </ProtectedRoute>
                } 
            >
                <Route index element={<Navigate to="/patient/dashboard" replace />} />
                <Route path="dashboard" element={<PatientHome />} />
                <Route path="profile" element={<PatientProfile />} />
                <Route path="history" element={<PatientHistory />} />
                <Route path="upload" element={<PatientUpload />} />
            </Route>

            {/* 4. Route cho ADMIN */}
            <Route 
                path="/admin" 
                element={
                    <ProtectedRoute allowedRoles={['Admin', 'Administrator']}>
                        <div style={{padding: '50px', textAlign: 'center'}}>
                            <h1>🛡️ TRANG QUẢN TRỊ ADMIN</h1>
                            <p>Đây là khu vực dành riêng cho Admin hệ thống.</p>
                            <p>Chức năng: Quản lý người dùng, xem thống kê hệ thống, v.v.</p>
                        </div>
                    </ProtectedRoute>
                } 
            />

            {/* Route 404 */}
            <Route path="*" element={<div style={{textAlign: 'center', marginTop: '50px'}}><h1>404 - Page Not Found</h1></div>} />
        </Routes>
    );
};

export default AppRoutes;