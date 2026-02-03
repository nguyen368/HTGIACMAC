import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { jwtDecode } from "jwt-decode";
import { useAuth } from '../context/AuthContext';

// Import Pages
import AuthPage from '../modules/PatientWebApp/pages/Auth/AuthPage';
import ClinicLayout from '../modules/ClinicWebApp/layouts/ClinicLayout';
import ClinicDashboard from '../modules/ClinicWebApp/pages/Dashboard/ClinicDashboard';
import DoctorManagement from '../modules/ClinicWebApp/pages/Management/DoctorManagement';
import ExaminationQueue from '../modules/ClinicWebApp/pages/Doctor/ExaminationQueue';
import ClinicUploadPage from '../modules/ClinicWebApp/pages/Upload/ClinicUploadPage';
import ClinicExamDetail from '../modules/ClinicWebApp/pages/Exam/ClinicExamDetail';
import HardwareSimulator from '../modules/ClinicWebApp/pages/Upload/HardwareSimulator';

// Import Patient Pages
import PatientLayout from '../modules/PatientWebApp/pages/Dashboard/PatientLayout';
import PatientHome from '../modules/PatientWebApp/pages/Dashboard/PatientHome';
import PatientProfile from '../modules/PatientWebApp/pages/Dashboard/PatientProfile';
import PatientHistory from '../modules/PatientWebApp/pages/Dashboard/PatientHistory';
import PatientUpload from '../modules/PatientWebApp/pages/Dashboard/PatientUpload';
// [MỚI - Đã có] Import trang chi tiết khám cho bệnh nhân
import PatientExamDetail from '../modules/PatientWebApp/pages/Dashboard/PatientExamDetail';
// [MỚI - Bổ sung] Import trang Thanh toán
import PaymentPage from '../modules/PatientWebApp/pages/Payment/PaymentPage';

const ProtectedRoute = ({ children, allowedRoles }: { children: JSX.Element, allowedRoles: string[] }) => {
    const token = localStorage.getItem('aura_token');
    if (!token) return <Navigate to="/auth" replace />;
    try {
        const decoded: any = jwtDecode(token);
        const roleKey = "http://schemas.microsoft.com/ws/2008/06/identity/claims/role";
        const userRole = (decoded[roleKey] || decoded.role || '').toLowerCase();
        const normalizedRoles = allowedRoles.map(r => r.toLowerCase());
        if (!normalizedRoles.includes(userRole)) return <Navigate to="/" replace />;
        return children;
    } catch { return <Navigate to="/auth" replace />; }
};

const AppRoutes: React.FC = () => {
    const { user, loading, isAuthenticated } = useAuth();

    if (loading) return <div style={{padding: 50, textAlign: 'center'}}>Đang khởi động hệ thống AURA...</div>;

    return (
        <Routes>
            <Route path="/auth" element={!isAuthenticated ? <AuthPage /> : <Navigate to="/" />} />

            {/* CLINIC & DOCTOR */}
            <Route path="/clinic" element={<ProtectedRoute allowedRoles={['ClinicAdmin', 'ClinicOwner']}><ClinicLayout /></ProtectedRoute>}>
                <Route index element={<ClinicDashboard />} />
                <Route path="dashboard" element={<ClinicDashboard />} />
                <Route path="doctors" element={<DoctorManagement />} />
                <Route path="queue" element={<ExaminationQueue />} />
                <Route path="upload" element={<ClinicUploadPage />} />
                <Route path="exam/:id" element={<ClinicExamDetail />} />
            </Route>

            <Route path="/doctor" element={<ProtectedRoute allowedRoles={['Doctor']}><ClinicLayout /></ProtectedRoute>}>
                <Route index element={<ExaminationQueue />} />
                <Route path="queue" element={<ExaminationQueue />} />
                <Route path="exam/:id" element={<ClinicExamDetail />} />
            </Route>

            {/* PATIENT */}
            {/* PHÂN HỆ BỆNH NHÂN */}
            <Route path="/patient" element={<ProtectedRoute allowedRoles={['Patient']}><PatientLayout /></ProtectedRoute>}>
                <Route index element={<PatientHome user={user} setTab={() => {}} />} />
                <Route path="dashboard" element={<PatientHome user={user} setTab={() => {}} />} /> 
                <Route path="profile" element={<PatientProfile />} />
                <Route path="history" element={<PatientHistory />} />
                <Route path="upload" element={<PatientUpload onUploadSuccess={() => {}} />} />
                
                {/* [Đã có] Route xem chi tiết kết quả khám & Tải PDF */}
                <Route path="exam/:id" element={<PatientExamDetail />} />

                {/* [MỚI - Bổ sung] Route Thanh toán & Mua gói */}
                <Route path="payment" element={<PaymentPage />} />
            </Route>

            <Route path="/hardware-simulator" element={<HardwareSimulator />} />
            
            <Route path="/" element={
                isAuthenticated 
                ? <Navigate to={user?.role === 'patient' ? '/patient' : (user?.role === 'doctor' ? '/doctor' : '/clinic')} />
                : <Navigate to="/auth" />
            } />
        </Routes>
    );
};

export default AppRoutes;