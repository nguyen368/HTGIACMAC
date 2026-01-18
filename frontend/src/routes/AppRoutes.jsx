import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import AuthPage from '../modules/PatientWebApp/pages/Auth/AuthPage';
import ClinicUploadPage from '../modules/ClinicWebApp/pages/Upload/ClinicUploadPage'; 
import PatientLayout from '../modules/PatientWebApp/pages/Dashboard/PatientLayout';
import DoctorWorkstation from '../modules/ClinicWebApp/pages/components/DoctorWorkstation';

const AppRoutes = () => {
    const testExamId = "600bacf7-85e5-4be0-97ae-22b2bbc28189";

    return (
        <Routes>
            
            <Route path="/login" element={<AuthPage />} />
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route 
                path="/doctor" 
                element={<DoctorWorkstation examId={testExamId} />} 
            />
        
            <Route path="/clinic/upload" element={<ClinicUploadPage />} />
            <Route path="/patient/dashboard" element={<PatientLayout /> } />
            <Route path="*" element={<div style={{padding:'20px'}}>404 - Trang không tìm thấy</div>} />
        </Routes>
    );
};

export default AppRoutes;