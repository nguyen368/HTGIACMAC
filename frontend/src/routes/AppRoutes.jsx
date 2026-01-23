import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import jwtDecode from "jwt-decode"; // SỬA: Bỏ {} để khớp phiên bản 3.1.2
import AuthPage from '../modules/PatientWebApp/pages/Auth/AuthPage';

// --- Import Pages ---
import PatientLayout from '../modules/PatientWebApp/pages/Dashboard/PatientLayout';
import PatientHome from '../modules/PatientWebApp/pages/Dashboard/PatientHome';
import PatientProfile from '../modules/PatientWebApp/pages/Dashboard/PatientProfile';
import PatientHistory from '../modules/PatientWebApp/pages/Dashboard/PatientHistory';
import PatientUpload from '../modules/PatientWebApp/pages/Dashboard/PatientUpload';
import DoctorWorkstation from '../modules/ClinicWebApp/pages/components/DoctorWorkstation';
import AdminLayout from '../modules/AdminWebApp/layouts/AdminLayout';
import AdminDashboard from '../modules/AdminWebApp/pages/Dashboard/AdminDashboard';
import UserManagement from '../modules/AdminWebApp/pages/Users/UserManagement';

// 1. COMPONENT BẢO VỆ ROUTE
const ProtectedRoute = ({ children, allowedRoles }) => {
    const token = localStorage.getItem('aura_token'); // SỬA: Dùng đúng key 'aura_token'
    
    if (!token) return <Navigate to="/auth" replace />;

    try {
        const decoded = jwtDecode(token);
        const roleKey = "http://schemas.microsoft.com/ws/2008/06/identity/claims/role";
        const userRole = (decoded[roleKey] || decoded.role || '').toLowerCase();
        
        const normalizedAllowedRoles = allowedRoles.map(r => r.toLowerCase());

        if (!normalizedAllowedRoles.includes(userRole)) {
            // Nếu sai quyền, đẩy về trang chủ để HomeRedirect xử lý lại
            return <Navigate to="/" replace />; 
        }

        return children;
    } catch (error) {
        localStorage.removeItem('aura_token');
        return <Navigate to="/auth" replace />;
    }
};

// 2. COMPONENT ĐIỀU HƯỚNG TRANG CHỦ THÔNG MINH (Đã tách riêng)
const HomeRedirect = () => {
    const token = localStorage.getItem('aura_token');
    if (!token) return <Navigate to="/auth" replace />;

    try {
        const decoded = jwtDecode(token);
        const roleKey = "http://schemas.microsoft.com/ws/2008/06/identity/claims/role";
        const role = (decoded[roleKey] || decoded.role || '').toLowerCase();

        if (['superadmin', 'admin', 'administrator'].includes(role)) return <Navigate to="/admin" replace />;
        if (role === 'doctor') return <Navigate to="/doctor" replace />;
        if (role === 'patient') return <Navigate to="/patient" replace />;
        
        return <Navigate to="/auth" replace />;
    } catch {
        return <Navigate to="/auth" replace />;
    }
};

// 3. CẤU HÌNH ROUTES CHÍNH
const AppRoutes = () => {
    return (
        <Routes>
            <Route path="/" element={<HomeRedirect />} />
            <Route path="/auth" element={<AuthPage />} />

            {/* Route cho BÁC SĨ */}
            <Route 
                path="/doctor" 
                element={
                    <ProtectedRoute allowedRoles={['Doctor']}>
                        <DoctorWorkstation />
                    </ProtectedRoute>
                } 
            />

            {/* Route cho BỆNH NHÂN */}
            <Route 
                path="/patient" 
                element={
                    <ProtectedRoute allowedRoles={['Patient']}>
                        <PatientLayout />
                    </ProtectedRoute>
                }
            >
                <Route index element={<PatientHome />} /> 
                <Route path="dashboard" element={<PatientHome />} />
                <Route path="profile" element={<PatientProfile />} />
                <Route path="history" element={<PatientHistory />} />
                <Route path="upload" element={<PatientUpload />} />
            </Route>

            {/* Route cho ADMIN */}
            <Route 
                path="/admin" 
                element={
                    <ProtectedRoute allowedRoles={['SuperAdmin', 'Admin', 'Administrator']}>
                        <AdminLayout />
                    </ProtectedRoute>
                }
            >
                 <Route index element={<AdminDashboard />} />
                 <Route path="dashboard" element={<AdminDashboard />} />
                 <Route path="users" element={<UserManagement />} />
            </Route>

            <Route path="*" element={<div style={{textAlign: 'center', marginTop: '50px'}}><h1>404 Not Found</h1></div>} />
        </Routes>
    );
};

export default AppRoutes;