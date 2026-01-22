import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import AuthPage from '../modules/PatientWebApp/pages/Auth/AuthPage';
import PatientLayout from '../modules/PatientWebApp/pages/Dashboard/PatientLayout';
import DoctorWorkstation from '../modules/ClinicWebApp/pages/components/DoctorWorkstation';

const ProtectedRoute = ({ children, allowedRoles }) => {
    const { user, loading } = useAuth();

    // 1. Nếu đang nạp dữ liệu F5, hiện màn hình loading chờ đợi
    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                <div style={{ textAlign: 'center' }}>
                    <i className="fas fa-spinner fa-spin" style={{ fontSize: '30px', color: '#0ea5e9' }}></i>
                    <p style={{ marginTop: '10px' }}>Đang xác thực phiên đăng nhập...</p>
                </div>
            </div>
        );
    }

    // 2. Nếu đã nạp xong mà không có user -> quay về login
    if (!user) return <Navigate to="/login" replace />;

    // 3. Kiểm tra quyền truy cập (Role)
    if (allowedRoles) {
        const userRole = (user.role || '').toLowerCase();
        const normalizedAllowedRoles = allowedRoles.map(r => r.toLowerCase());
        if (!normalizedAllowedRoles.includes(userRole)) {
            return <Navigate to="/login" replace />; 
        }
    }

    return children;
};

const AppRoutes = () => {
    return (
        <Routes>
            <Route path="/login" element={<AuthPage />} />
            <Route path="/" element={<Navigate to="/login" replace />} />

            <Route path="/doctor" element={
                <ProtectedRoute allowedRoles={['Doctor']}>
                    <DoctorWorkstation />
                </ProtectedRoute>
            } />

            <Route path="/patient/dashboard/*" element={
                <ProtectedRoute allowedRoles={['Patient']}>
                    <PatientLayout />
                </ProtectedRoute>
            } />

            <Route path="/admin" element={
                <ProtectedRoute allowedRoles={['Admin', 'Administrator']}>
                    <div style={{padding: '50px', textAlign: 'center'}}>
                        <h1>🛡️ TRANG QUẢN TRỊ ADMIN</h1>
                    </div>
                </ProtectedRoute>
            } />

            <Route path="*" element={<div>404 Not Found</div>} />
        </Routes>
    );
};

export default AppRoutes;