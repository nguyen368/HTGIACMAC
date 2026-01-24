import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { jwtDecode } from "jwt-decode"; // Sửa import cho đúng chuẩn TS
import { useAuth } from '../context/AuthContext';

// --- Import Pages ---
import AuthPage from '../modules/PatientWebApp/pages/Auth/AuthPage';
import PatientLayout from '../modules/PatientWebApp/pages/Dashboard/PatientLayout';
import PatientHome from '../modules/PatientWebApp/pages/Dashboard/PatientHome';
import PatientProfile from '../modules/PatientWebApp/pages/Dashboard/PatientProfile';
import PatientHistory from '../modules/PatientWebApp/pages/Dashboard/PatientHistory';
import PatientUpload from '../modules/PatientWebApp/pages/Dashboard/PatientUpload';

// --- Clinic & Doctor Pages ---
import DoctorWorkstation from '../modules/ClinicWebApp/pages/components/DoctorWorkstation';
import ClinicLayout from '../modules/ClinicWebApp/layouts/ClinicLayout';
import ClinicDashboard from '../modules/ClinicWebApp/pages/Dashboard/ClinicDashboard';
import ExaminationQueue from '../modules/ClinicWebApp/pages/Doctor/ExaminationQueue';
import ClinicUploadPage from '../modules/ClinicWebApp/pages/Upload/ClinicUploadPage'; // Import trang Upload
import ClinicExamDetail from '../modules/ClinicWebApp/pages/Exam/ClinicExamDetail'; // Import trang xem kết quả
import HardwareSimulator from '../modules/ClinicWebApp/pages/Upload/HardwareSimulator';

// --- Admin Pages ---
import AdminLayout from '../modules/AdminWebApp/layouts/AdminLayout';
import AdminDashboard from '../modules/AdminWebApp/pages/Dashboard/AdminDashboard';
import UserManagement from '../modules/AdminWebApp/pages/Users/UserManagement';

interface ProtectedRouteProps {
    children: React.ReactElement;
    allowedRoles: string[];
}

// 1. COMPONENT BẢO VỆ ROUTE
const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
    const token = localStorage.getItem('aura_token'); 
    if (!token) return <Navigate to="/auth" replace />;

    try {
        const decoded: any = jwtDecode(token);
        const roleKey = "http://schemas.microsoft.com/ws/2008/06/identity/claims/role";
        const userRole = (decoded[roleKey] || decoded.role || '').toLowerCase();
        const normalizedAllowedRoles = allowedRoles.map(r => r.toLowerCase());

        if (allowedRoles.length > 0 && !normalizedAllowedRoles.includes(userRole)) {
            return <Navigate to="/" replace />; 
        }
        return children;
    } catch (error) {
        localStorage.removeItem('aura_token');
        return <Navigate to="/auth" replace />;
    }
};

// 2. COMPONENT ĐIỀU HƯỚNG TRANG CHỦ
const HomeRedirect: React.FC = () => {
    const token = localStorage.getItem('aura_token');
    if (!token) return <Navigate to="/auth" replace />;

    try {
        const decoded: any = jwtDecode(token);
        const roleKey = "http://schemas.microsoft.com/ws/2008/06/identity/claims/role";
        const role = (decoded[roleKey] || decoded.role || '').toLowerCase();

        if (['superadmin', 'admin', 'administrator'].includes(role)) return <Navigate to="/admin" replace />;
        if (role === 'clinicowner' || role === 'clinicadmin') return <Navigate to="/clinic" replace />; 
        if (role === 'doctor') return <Navigate to="/doctor" replace />;
        if (role === 'patient') return <Navigate to="/patient" replace />;
        
        return <Navigate to="/auth" replace />;
    } catch { return <Navigate to="/auth" replace />; }
};

// 3. CẤU HÌNH ROUTES CHÍNH
const AppRoutes: React.FC = () => {
    const { user } = useAuth();

    return (
        <Routes>
            <Route path="/" element={<HomeRedirect />} />
            <Route path="/auth" element={<AuthPage />} />

            {/* --- PHÂN HỆ PHÒNG KHÁM (Clinic Owner) --- */}
            <Route path="/clinic" element={<ProtectedRoute allowedRoles={['ClinicOwner', 'ClinicAdmin']}><ClinicLayout /></ProtectedRoute>}>
                <Route index element={<ClinicDashboard />} />
                <Route path="dashboard" element={<ClinicDashboard />} />
                <Route path="upload" element={<ClinicUploadPage />} />
                
                {/* Quan trọng: Route xem chi tiết ca khám */}
                <Route path="exam/:id" element={<ClinicExamDetail />} />
                <Route path="doctors" element={<div style={{padding:20}}>Quản lý bác sĩ (Coming soon)</div>} />
            </Route>

            {/* --- PHÂN HỆ BÁC SĨ --- */}
            <Route path="/doctor" element={<ProtectedRoute allowedRoles={['Doctor']}><DoctorWorkstation /></ProtectedRoute>}>
                <Route index element={<ExaminationQueue />} />
                <Route path="queue" element={<ExaminationQueue />} />
                <Route path="exam/:id" element={<DoctorWorkstation />} />
            </Route>

            {/* --- Route Test IoT --- */}
            <Route path="/hardware-simulator" element={
                <ProtectedRoute allowedRoles={['Doctor', 'ClinicOwner', 'ClinicAdmin', 'Admin']}>
                    <HardwareSimulator />
                </ProtectedRoute>
            } />

            {/* --- PHÂN HỆ BỆNH NHÂN --- */}
            <Route path="/patient" element={<ProtectedRoute allowedRoles={['Patient']}><PatientLayout /></ProtectedRoute>}>
                <Route index element={<PatientHome user={user} setTab={() => {}} />} /> 
                <Route path="dashboard" element={<PatientHome user={user} setTab={() => {}} />} />
                <Route path="profile" element={<PatientProfile />} />
                <Route path="history" element={<PatientHistory />} />
                <Route path="upload" element={<PatientUpload onUploadSuccess={() => {}} />} />
            </Route>

            {/* --- PHÂN HỆ QUẢN TRỊ --- */}
            <Route path="/admin" element={<ProtectedRoute allowedRoles={['SuperAdmin', 'Admin']}><AdminLayout /></ProtectedRoute>}>
                 <Route index element={<AdminDashboard />} />
                 <Route path="dashboard" element={<AdminDashboard />} />
                 <Route path="users" element={<UserManagement />} />
            </Route>

            <Route path="*" element={<div style={{textAlign: 'center', marginTop: '50px'}}><h1>404 Not Found</h1></div>} />
        </Routes>
    );
};

export default AppRoutes;