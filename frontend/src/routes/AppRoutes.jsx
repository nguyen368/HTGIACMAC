import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

// Import Pages - Auth & Patient
import AuthPage from '../modules/PatientWebApp/pages/Auth/AuthPage';
import PatientLayout from '../modules/PatientWebApp/pages/Dashboard/PatientLayout';
import PatientHome from '../modules/PatientWebApp/pages/Dashboard/PatientHome';
import PatientProfile from '../modules/PatientWebApp/pages/Dashboard/PatientProfile';
import PatientHistory from '../modules/PatientWebApp/pages/Dashboard/PatientHistory';
import PatientUpload from '../modules/PatientWebApp/pages/Dashboard/PatientUpload';

// Import Pages - Clinic (Doctor)
import ClinicLayout from '../modules/ClinicWebApp/layouts/ClinicLayout';
import ClinicDashboard from '../modules/ClinicWebApp/pages/Dashboard/ClinicDashboard';
import DoctorWorkstation from '../modules/ClinicWebApp/pages/components/DoctorWorkstation';
import ClinicUploadPage from '../modules/ClinicWebApp/pages/Upload/ClinicUploadPage';
import ClinicExamDetail from '../modules/ClinicWebApp/pages/Exam/ClinicExamDetail';

// Import Pages - Admin (MỚI)
import AdminLayout from '../modules/AdminWebApp/layouts/AdminLayout';
import AdminDashboard from '../modules/AdminWebApp/pages/Dashboard/AdminDashboard';
import UserManagement from '../modules/AdminWebApp/pages/Users/UserManagement';

const AppRoutes = () => {
  return (
    <Routes>
      {/* 1. Mặc định vào trang đăng nhập */}
      <Route path="/" element={<Navigate to="/auth" replace />} />
      <Route path="/auth" element={<AuthPage />} />

      {/* 2. Routes cho Bệnh nhân */}
      <Route path="/patient" element={<PatientLayout />}>
        <Route index element={<Navigate to="home" replace />} />
        <Route path="home" element={<PatientHome />} />
        <Route path="profile" element={<PatientProfile />} />
        <Route path="history" element={<PatientHistory />} />
        <Route path="upload" element={<PatientUpload />} />
      </Route>

      {/* 3. Routes cho Phòng khám/Bác sĩ */}
      <Route path="/clinic" element={<ClinicLayout />}>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<ClinicDashboard />} />
        <Route path="doctor-workstation" element={<DoctorWorkstation />} />
        <Route path="upload" element={<ClinicUploadPage />} />
        <Route path="exam/:examId" element={<ClinicExamDetail />} />
      </Route>

      {/* 4. Routes cho Admin (MỚI THÊM) */}
      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<AdminDashboard />} />
        <Route path="users" element={<UserManagement />} />
      </Route>

      {/* 5. Trang 404 */}
      <Route path="*" element={<Navigate to="/auth" replace />} />
    </Routes>
  );
};

export default AppRoutes;