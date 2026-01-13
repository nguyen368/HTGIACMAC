// src/routes/AppRoutes.jsx
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

// 1. Import trang Login (Giữ nguyên của TV1)
import AuthPage from '../modules/PatientWebApp/pages/Auth/AuthPage';

// 2. [QUAN TRỌNG] Import trang Clinic bạn vừa làm
// Hãy chắc chắn đường dẫn này đúng với nơi bạn tạo file
import ClinicUploadPage from '../modules/ClinicWebApp/pages/Upload/ClinicUploadPage'; 

const AppRoutes = () => {
    return (
        <Routes>
            {/* --- Phần Authentication --- */}
            <Route path="/login" element={<AuthPage />} />
            <Route path="/" element={<Navigate to="/login" />} />

            {/* --- Phần Clinic Manager (PHẢI CÓ DÒNG NÀY MỚI CHẠY) --- */}
            <Route path="/clinic/upload" element={<ClinicUploadPage />} />
            
        </Routes>
    );
};

export default AppRoutes;