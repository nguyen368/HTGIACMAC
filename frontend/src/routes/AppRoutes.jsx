import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { jwtDecode } from "jwt-decode"; 
import AuthPage from '../modules/PatientWebApp/pages/Auth/AuthPage';
import PatientLayout from '../modules/PatientWebApp/pages/Dashboard/PatientLayout';
import DoctorWorkstation from '../modules/ClinicWebApp/pages/components/DoctorWorkstation';

// Component bảo vệ Route (Giữ nguyên)
const ProtectedRoute = ({ children, allowedRoles }) => {
    const token = localStorage.getItem('token');
    if (!token) return <Navigate to="/login" replace />;

    try {
        const decoded = jwtDecode(token);
        const roleKey = "http://schemas.microsoft.com/ws/2008/06/identity/claims/role";
        const userRole = (decoded[roleKey] || decoded.role || '').toLowerCase();
        
        // Chuẩn hóa roles cho phép về chữ thường
        const normalizedAllowedRoles = allowedRoles.map(r => r.toLowerCase());

        if (allowedRoles && !normalizedAllowedRoles.includes(userRole)) {
            return <Navigate to="/login" replace />; 
        }
        return children;
    } catch (error) {
        localStorage.removeItem('token');
        return <Navigate to="/login" replace />;
    }
};

const AppRoutes = () => {
    return (
        <Routes>
            <Route path="/login" element={<AuthPage />} />
            <Route path="/" element={<Navigate to="/login" replace />} />

            {/* 1. Route cho BÁC SĨ (Doctor) */}
            <Route 
                path="/doctor" 
                element={
                    <ProtectedRoute allowedRoles={['Doctor']}>
                        <DoctorWorkstation />
                    </ProtectedRoute>
                } 
            />

            {/* 2. Route cho BỆNH NHÂN (Patient) */}
            <Route 
                path="/patient/dashboard" 
                element={
                    <ProtectedRoute allowedRoles={['Patient']}>
                        <PatientLayout />
                    </ProtectedRoute>
                } 
            />

            {/* 3. Route cho ADMIN (Thay cho Clinic) */}
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

            <Route path="*" element={<div>404 Not Found</div>} />
        </Routes>
    );
};

export default AppRoutes;