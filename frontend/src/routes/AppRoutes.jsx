import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { jwtDecode } from "jwt-decode"; 
import AuthPage from '../modules/PatientWebApp/pages/Auth/AuthPage';
import ClinicUploadPage from '../modules/ClinicWebApp/pages/Upload/ClinicUploadPage'; 
import PatientLayout from '../modules/PatientWebApp/pages/Dashboard/PatientLayout';
import DoctorWorkstation from '../modules/ClinicWebApp/pages/components/DoctorWorkstation';

// --- COMPONENT BẢO VỆ ROUTE ---
const ProtectedRoute = ({ children, allowedRoles }) => {
    const token = localStorage.getItem('token');
    
    // 1. Chưa đăng nhập -> Về Login
    if (!token) {
        return <Navigate to="/login" replace />;
    }

    try {
        const decoded = jwtDecode(token);
        // Lấy Role an toàn (thử mọi key có thể)
        const roleKey = "http://schemas.microsoft.com/ws/2008/06/identity/claims/role";
        const userRole = decoded[roleKey] || decoded.role || decoded.Role;

        // 2. Kiểm tra Role
        if (allowedRoles && !allowedRoles.includes(userRole)) {
            console.warn(`Bị chặn: Role ${userRole} không nằm trong [${allowedRoles}]`);
            return <Navigate to="/login" replace />; 
        }

        return children;
    } catch (error) {
        localStorage.removeItem('token');
        return <Navigate to="/login" replace />;
    }
};

const AppRoutes = () => {
    const testExamId = "600bacf7-85e5-4be0-97ae-22b2bbc28189";

    return (
        <Routes>
            {/* --- Public Routes --- */}
            <Route path="/login" element={<AuthPage />} />
            <Route path="/" element={<Navigate to="/login" replace />} />

            {/* --- Doctor / Clinic Routes --- */}
            <Route 
                path="/doctor" 
                element={
                    <ProtectedRoute allowedRoles={['Doctor', 'doctor', 'Admin', 'admin']}>
                        <DoctorWorkstation examId={testExamId} />
                    </ProtectedRoute>
                } 
            />
            
            <Route 
                path="/clinic/upload" 
                element={
                    <ProtectedRoute allowedRoles={['Doctor', 'doctor', 'Admin', 'admin']}>
                        <ClinicUploadPage />
                    </ProtectedRoute>
                } 
            />

            {/* --- Patient Routes --- */}
            <Route 
                path="/patient/dashboard" 
                element={
                    <ProtectedRoute allowedRoles={['Patient', 'patient']}>
                        <PatientLayout />
                    </ProtectedRoute>
                } 
            />

            {/* --- 404 --- */}
            <Route path="*" element={<div style={{padding:'20px'}}>404 - Trang không tìm thấy</div>} />
        </Routes>
    );
};

export default AppRoutes;