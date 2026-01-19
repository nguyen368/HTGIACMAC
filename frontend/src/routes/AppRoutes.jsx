import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// 1. Import trang Login
import AuthPage from '../modules/PatientWebApp/pages/Auth/AuthPage';

// 2. Import các trang Clinic
import ClinicUploadPage from '../modules/ClinicWebApp/pages/Upload/ClinicUploadPage'; 

// [QUAN TRỌNG 1] Import file Dashboard xịn bạn vừa gửi
import ClinicDashboard from '../modules/ClinicWebApp/pages/Dashboard/ClinicDashboard'; // Kiểm tra đúng đường dẫn file của bạn

// [QUAN TRỌNG 2] Import file Bàn làm việc (Dùng để xem chi tiết)
import DoctorWorkstation from '../modules/ClinicWebApp/pages/components/DoctorWorkstation'; 

// 3. Import trang Patient
import PatientLayout from '../modules/PatientWebApp/pages/Dashboard/PatientLayout';

const PrivateRoute = ({ children }) => {
    const { user } = useAuth(); 
    return user ? children : <Navigate to="/login" />;
};

const AppRoutes = () => {
    return (
        <Routes>
            <Route path="/login" element={<AuthPage />} />
            <Route path="/auth" element={<Navigate to="/login" />} />
            <Route path="/" element={<Navigate to="/login" />} />

            {/* --- CLINIC ROUTES --- */}
            
            {/* 👉 1. Trang chủ Dashboard dùng file ClinicDashboard */}
            <Route path="/clinic/dashboard" element={<ClinicDashboard />} />

            {/* 2. Trang Upload */}
            <Route path="/clinic/upload" element={<ClinicUploadPage />} />
            
            {/* 3. Trang Chi tiết khám dùng DoctorWorkstation */}
            <Route path="/clinic/exam/:id" element={<DoctorWorkstation />} />

            {/* --- PATIENT ROUTES --- */}
            <Route path="/patient/dashboard" element={<PatientLayout /> } />
            
            <Route path="*" element={<div>404 - Không tìm thấy trang</div>} />
        </Routes>
    );
};

export default AppRoutes;