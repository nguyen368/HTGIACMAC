import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
// 1. Import trang Login (Giữ nguyên của TV1)
import AuthPage from '../modules/PatientWebApp/pages/Auth/AuthPage';

// 2. [QUAN TRỌNG] Import trang Clinic bạn vừa làm
// Hãy chắc chắn đường dẫn này đúng với nơi bạn tạo file
import ClinicUploadPage from '../modules/ClinicWebApp/pages/Upload/ClinicUploadPage'; 
import ClinicExamDetail from '../modules/ClinicWebApp/pages/Exam/ClinicExamDetail'; 

// 3. Import trang Patient
import PatientLayout from '../modules/PatientWebApp/pages/Dashboard/PatientLayout';
const PrivateRoute = ({ children }) => {
    const { user } = useAuth(); // Giả sử context có biến user
    return user ? children : <Navigate to="/login" />;
};
const AppRoutes = () => {
    const testExamId = "600bacf7-85e5-4be0-97ae-22b2bbc28189";

    return (
        <Routes>
            {/* --- Public Routes --- */}
            <Route path="/login" element={<AuthPage />} />
            <Route path="/" element={<Navigate to="/login" />} />

            {/* --- Phần Clinic Manager (PHẢI CÓ DÒNG NÀY MỚI CHẠY) --- */}
            <Route path="/clinic/upload" element={<ClinicUploadPage />} />
            <Route path="/patient/dashboard" element={<PatientLayout /> } />
        </Routes>
    );
};

export default AppRoutes;