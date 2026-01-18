import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// 1. Import trang Login (Giữ nguyên vị trí trong thư mục PatientWebApp)
import AuthPage from '../modules/PatientWebApp/pages/Auth/AuthPage';

// 2. Import các trang Clinic
import ClinicDashboard from '../modules/ClinicWebApp/pages/Dashboard/ClinicDashboard'; // [MỚI] Trang chủ Dashboard
import ClinicUploadPage from '../modules/ClinicWebApp/pages/Upload/ClinicUploadPage'; 
import ClinicExamDetail from '../modules/ClinicWebApp/pages/Exam/ClinicExamDetail'; 

// 3. Import trang Patient
import PatientLayout from '../modules/PatientWebApp/pages/Dashboard/PatientLayout';

const AppRoutes = () => {
    return (
        <Routes>
            {/* --- Phần Authentication --- */}
            <Route path="/login" element={<AuthPage />} />
            
            {/* Mặc định vào Login */}
            <Route path="/" element={<Navigate to="/login" />} />

            {/* --- Phần Clinic Manager --- */}
            {/* Trang chủ Dashboard */}
            <Route path="/clinic/dashboard" element={<ClinicDashboard />} />
            
            {/* Trang Upload & Quản lý ảnh */}
            <Route path="/clinic/upload" element={<ClinicUploadPage />} />
            
            {/* Trang chẩn đoán chi tiết (nhận ID ảnh) */}
            <Route path="/clinic/exam/:imageId" element={<ClinicExamDetail />} />

            {/* --- Phần Patient --- */}
            <Route path="/patient/dashboard" element={<PatientLayout /> } />
        </Routes>
    );
};

export default AppRoutes;