import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import jwtDecode from "jwt-decode"; 
import { useAuth } from '../context/AuthContext'; // Import để lấy dữ liệu user truyền cho các component con

// --- Import Pages ---
import AuthPage from '../modules/PatientWebApp/pages/Auth/AuthPage';
import PatientLayout from '../modules/PatientWebApp/pages/Dashboard/PatientLayout';
import PatientHome from '../modules/PatientWebApp/pages/Dashboard/PatientHome';
import PatientProfile from '../modules/PatientWebApp/pages/Dashboard/PatientProfile';
import PatientHistory from '../modules/PatientWebApp/pages/Dashboard/PatientHistory';
import PatientUpload from '../modules/PatientWebApp/pages/Dashboard/PatientUpload';
import DoctorWorkstation from '../modules/ClinicWebApp/pages/components/DoctorWorkstation';
import AdminLayout from '../modules/AdminWebApp/layouts/AdminLayout';
import AdminDashboard from '../modules/AdminWebApp/pages/Dashboard/AdminDashboard';
import UserManagement from '../modules/AdminWebApp/pages/Users/UserManagement';

// --- Import Clinic Pages ---
import ClinicLayout from '../modules/ClinicWebApp/layouts/ClinicLayout';
import ClinicDashboard from '../modules/ClinicWebApp/pages/Dashboard/ClinicDashboard';
import ExaminationQueue from '../modules/ClinicWebApp/pages/Doctor/ExaminationQueue';

// --- SỬA LỖI ĐƯỜNG DẪN: HardwareSimulator nằm trong thư mục Upload ---
import HardwareSimulator from '../modules/ClinicWebApp/pages/Upload/HardwareSimulator';

interface ProtectedRouteProps {
    children: React.ReactElement;
    allowedRoles: string[];
}

// 1. COMPONENT BẢO VỆ ROUTE (Giữ nguyên logic cũ 100%)
const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
    const token = localStorage.getItem('aura_token'); 
    
    if (!token) return <Navigate to="/auth" replace />;

    try {
        const decoded: any = jwtDecode(token);
        const roleKey = "http://schemas.microsoft.com/ws/2008/06/identity/claims/role";
        const userRole = (decoded[roleKey] || decoded.role || '').toLowerCase();
        
        const normalizedAllowedRoles = allowedRoles.map(r => r.toLowerCase());

        if (!normalizedAllowedRoles.includes(userRole)) {
            // Nếu không có quyền, đẩy về trang chủ để HomeRedirect tính toán lại
            return <Navigate to="/" replace />; 
        }

        return children;
    } catch (error) {
        localStorage.removeItem('aura_token');
        return <Navigate to="/auth" replace />;
    }
};

// 2. COMPONENT ĐIỀU HƯỚNG TRANG CHỦ THÔNG MINH (Giữ nguyên cấu trúc 100%)
const HomeRedirect: React.FC = () => {
    const token = localStorage.getItem('aura_token');
    if (!token) return <Navigate to="/auth" replace />;

    try {
        const decoded: any = jwtDecode(token);
        const roleKey = "http://schemas.microsoft.com/ws/2008/06/identity/claims/role";
        const role = (decoded[roleKey] || decoded.role || '').toLowerCase();

        // Điều hướng dựa trên vai trò thực tế từ Token
        if (['superadmin', 'admin', 'administrator'].includes(role)) return <Navigate to="/admin" replace />;
        if (role === 'clinicadmin') return <Navigate to="/clinic" replace />; 
        if (role === 'doctor') return <Navigate to="/doctor" replace />;
        if (role === 'patient') return <Navigate to="/patient" replace />;
        
        return <Navigate to="/auth" replace />;
    } catch {
        return <Navigate to="/auth" replace />;
    }
};

// 3. CẤU HÌNH ROUTES CHÍNH
const AppRoutes: React.FC = () => {
    // Lấy user từ AuthContext để truyền cho các trang yêu cầu props (như PatientHome)
    const { user } = useAuth();

    return (
        <Routes>
            {/* Cổng vào mặc định */}
            <Route path="/" element={<HomeRedirect />} />
            <Route path="/auth" element={<AuthPage />} />

            {/* Route dành riêng cho việc Test Hardware (IoT) */}
            <Route 
                path="/hardware-simulator" 
                element={
                    <ProtectedRoute allowedRoles={['Doctor', 'ClinicAdmin', 'Admin']}>
                        <HardwareSimulator />
                    </ProtectedRoute>
                } 
            />

            {/* PHÂN HỆ PHÒNG KHÁM (ClinicAdmin) */}
            <Route 
                path="/clinic" 
                element={
                    <ProtectedRoute allowedRoles={['ClinicAdmin']}>
                        <ClinicLayout />
                    </ProtectedRoute>
                }
            >
                <Route index element={<ClinicDashboard />} />
                <Route path="dashboard" element={<ClinicDashboard />} />
            </Route>

            {/* PHÂN HỆ BÁC SĨ (Doctor) */}
            <Route 
                path="/doctor" 
                element={
                    <ProtectedRoute allowedRoles={['Doctor']}>
                        <DoctorWorkstation />
                    </ProtectedRoute>
                } 
            >
                {/* Mặc định vào hàng đợi */}
                <Route index element={<ExaminationQueue />} />
                <Route path="queue" element={<ExaminationQueue />} />
                
                {/* Link chi tiết ca khám: Bác sĩ xem ảnh và nhập kết luận */}
                <Route path="exam/:id" element={<DoctorWorkstation />} />
            </Route>

            {/* PHÂN HỆ BỆNH NHÂN (Patient) */}
            <Route 
                path="/patient" 
                element={
                    <ProtectedRoute allowedRoles={['Patient']}>
                        <PatientLayout />
                    </ProtectedRoute>
                }
            >
                {/* Bổ sung props mặc định để sửa lỗi TypeScript (Type {} is missing properties) */}
                <Route index element={<PatientHome user={user} setTab={() => {}} />} /> 
                <Route path="dashboard" element={<PatientHome user={user} setTab={() => {}} />} />
                <Route path="profile" element={<PatientProfile />} />
                <Route path="history" element={<PatientHistory />} />
                <Route path="upload" element={<PatientUpload onUploadSuccess={() => {}} />} />
            </Route>

            {/* PHÂN HỆ QUẢN TRỊ (System Admin) */}
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

            {/* Trang báo lỗi 404 */}
            <Route path="*" element={
                <div style={{ textAlign: 'center', marginTop: '100px', fontFamily: 'sans-serif' }}>
                    <h1 style={{ fontSize: '4rem', color: '#ccc' }}>404</h1>
                    <h2>Ối! Trang này không tồn tại</h2>
                    <p>Vui lòng kiểm tra lại đường dẫn hoặc quay về trang chủ.</p>
                    <button onClick={() => window.location.href = '/'} style={{ padding: '10px 20px', cursor: 'pointer', backgroundColor: '#007bff', color: '#fff', border: 'none', borderRadius: '5px' }}>
                        Quay về Trang chủ
                    </button>
                </div>
            } />
        </Routes>
    );
};

export default AppRoutes;