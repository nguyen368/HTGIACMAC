import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import jwtDecode from "jwt-decode"; 

// --- Import Pages: Auth ---
import AuthPage from '../modules/PatientWebApp/pages/Auth/AuthPage';

// --- Import Pages: Patient ---
import PatientLayout from '../modules/PatientWebApp/pages/Dashboard/PatientLayout';
import PatientHome from '../modules/PatientWebApp/pages/Dashboard/PatientHome';
import PatientProfile from '../modules/PatientWebApp/pages/Dashboard/PatientProfile';
import PatientHistory from '../modules/PatientWebApp/pages/Dashboard/PatientHistory';
import PatientUpload from '../modules/PatientWebApp/pages/Dashboard/PatientUpload';

// --- Import Pages: Clinic (Doctor & Owner) ---
import DoctorWorkstation from '../modules/ClinicWebApp/pages/components/DoctorWorkstation';
// [SỬA] Thêm /Upload vào đường dẫn import này
import ClinicUploadPage from '../modules/ClinicWebApp/pages/Upload/ClinicUploadPage'; 
import DoctorManagement from '../modules/ClinicWebApp/pages/Management/DoctorManagement';
// Import trang Chi tiết ca khám
import ClinicExamPage from '../modules/ClinicWebApp/pages/Exam/ClinicExamPage';

// --- Import Pages: Admin ---
import AdminLayout from '../modules/AdminWebApp/layouts/AdminLayout';
import AdminDashboard from '../modules/AdminWebApp/pages/Dashboard/AdminDashboard';
import UserManagement from '../modules/AdminWebApp/pages/Users/UserManagement';

// 1. COMPONENT BẢO VỆ ROUTE
const ProtectedRoute = ({ children, allowedRoles }) => {
    const token = localStorage.getItem('aura_token');
    if (!token) return <Navigate to="/auth" replace />;

    try {
        const decoded = jwtDecode(token);
        const roleKey = "http://schemas.microsoft.com/ws/2008/06/identity/claims/role";
        const userRole = (decoded[roleKey] || decoded.role || '').toLowerCase();
        
        const normalizedAllowedRoles = allowedRoles.map(r => r.toLowerCase());

        if (allowedRoles && !normalizedAllowedRoles.includes(userRole)) {
            return <Navigate to="/" replace />; 
        }

        return children;
    } catch (error) {
        localStorage.removeItem('aura_token');
        return <Navigate to="/auth" replace />;
    }
};

// 2. COMPONENT ĐIỀU HƯỚNG TRANG CHỦ THÔNG MINH
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
        if (role === 'clinicowner') return <Navigate to="/clinic/upload" replace />;
        
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
            
            {/* Route cho Bác sĩ */}
            <Route 
                path="/doctor" 
                element={
                    <ProtectedRoute allowedRoles={['Doctor']}>
                        <DoctorWorkstation />
                    </ProtectedRoute>
                } 
            />

            {/* Route cho Chủ phòng khám (Clinic Owner) */}
            <Route path="/clinic">
                <Route 
                    path="upload" 
                    element={
                        <ProtectedRoute allowedRoles={['ClinicOwner']}>
                            <ClinicUploadPage />
                        </ProtectedRoute>
                    } 
                />
                <Route 
                    path="doctors" 
                    element={
                        <ProtectedRoute allowedRoles={['ClinicOwner']}>
                            <DoctorManagement />
                        </ProtectedRoute>
                    } 
                />
                
                {/* Route Chi Tiết Ca Khám */}
                <Route 
                    path="exam/:id" 
                    element={
                        <ProtectedRoute allowedRoles={['ClinicOwner', 'Doctor']}>
                            <ClinicExamPage />
                        </ProtectedRoute>
                    } 
                />
            </Route>

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