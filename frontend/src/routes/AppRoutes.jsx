// src/routes/AppRoutes.jsx
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import AuthPage from '../modules/PatientWebApp/pages/Auth/AuthPage';

const AppRoutes = () => {
    return (
        <Routes>
            <Route path="/login" element={<AuthPage />} />
            {/* Mặc định vào trang login */}
            <Route path="/" element={<Navigate to="/login" />} />
        </Routes>
    );
};

export default AppRoutes;