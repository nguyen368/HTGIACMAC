import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
// SỬA: Bỏ dấu ngoặc {} để khớp với phiên bản 3.1.2
import jwtDecode from "jwt-decode"; 

// --- Import Pages: Auth ---
import AuthPage from '../modules/PatientWebApp/pages/Auth/AuthPage';

// --- Import Pages: Patient ---
import PatientLayout from '../modules/PatientWebApp/pages/Dashboard/PatientLayout';
import PatientHome from '../modules/PatientWebApp/pages/Dashboard/PatientHome';
import PatientProfile from '../modules/PatientWebApp/pages/Dashboard/PatientProfile';
import PatientHistory from '../modules/PatientWebApp/pages/Dashboard/PatientHistory';
import PatientUpload from '../modules/PatientWebApp/pages/Dashboard/PatientUpload';

// --- Import Pages: Clinic (Doctor) ---
import DoctorWorkstation from '../modules/ClinicWebApp/pages/components/DoctorWorkstation';

// --- Import Pages: Admin ---
import AdminLayout from '../modules/AdminWebApp/layouts/AdminLayout';
import AdminDashboard from '../modules/AdminWebApp/pages/Dashboard/AdminDashboard';
import UserManagement from '../modules/AdminWebApp/pages/Users/UserManagement';

// =================================================================
// 1. COMPONENT BẢO VỆ ROUTE (Authorization Guard)
// =================================================================
const ProtectedRoute = ({ children, allowedRoles }) => {
    const token = localStorage.getItem('aura_token');
    
    if (!token) return <Navigate to="/auth" replace />;

    try {
        const decoded = jwtDecode(token);
        const roleKey = "http://schemas.microsoft.com/ws/2008/06/identity/claims/role";
        const userRole = (decoded[roleKey] || decoded.role || '').toLowerCase();
        
        const normalizedAllowedRoles = allowedRoles.map(r => r.toLowerCase());

        if (allowedRoles && !normalizedAllowedRoles.includes(userRole)) {
            localStorage.removeItem('aura_token'); 
            return <Navigate to="/auth" replace />; 
        }

        return children;
    } catch (error) {
        localStorage.removeItem('aura_token');
        return <Navigate to="/auth" replace />;
    }
};

// =================================================================
// 2. COMPONENT ĐIỀU HƯỚNG TRANG CHỦ THÔNG MINH
// =================================================================
const HomeRedirect = () => {
    const token = localStorage.getItem('aura_token');
    
    if (!token) {
        return <Navigate to="/auth" replace />;
    }

    try {
        const decoded = jwtDecode(token);
        const roleKey = "http://schemas.microsoft.com/ws/2008/06/identity/claims/role";
        const role = (decoded[roleKey] || decoded.role || '').toLowerCase();

        if (role === 'superadmin' || role === 'admin' || role === 'administrator') {
            return <Navigate to="/admin" replace />;
        }
        if (role === 'doctor') {
            return <Navigate to="/doctor" replace />;
        }
        if (role === 'patient') {
            return <Navigate to="/patient" replace />;
        }
        
        return <Navigate to="/auth" replace />;
    } catch {
        return <Navigate to="/auth" replace />;
    }
};

// =================================================================
// 3. CẤU HÌNH ROUTES CHÍNH
// =================================================================
const AppRoutes = () => {
    return (
        <Routes>
            <Route path="/" element={<HomeRedirect />} />
            
            <Route path="/auth" element={<AuthPage />} />
            <Route path="/login" element={<Navigate to="/auth" replace />} />

            {/* Route Bác sĩ */}
            <Route 
                path="/doctor" 
                element={
                    <ProtectedRoute allowedRoles={['Doctor']}>
                        <DoctorWorkstation />
                    </ProtectedRoute>
                } 
            />

            {/* Route Bệnh nhân */}
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

            {/* Route Admin */}
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