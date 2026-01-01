import React, { Suspense, lazy } from 'react';
import { Routes, Route, Link, Navigate } from 'react-router-dom';
import { Spin, Result, Button } from 'antd';
import MainLayout from './MainLayout';
import LoginPage from './features/auth/LoginPage';
import RegisterPage from './features/auth/RegisterPage';
import ProfilePage from './features/user/ProfilePage';

const Dashboard = lazy(() => import('./features/doctor/components/Dashboard')); 
const ImageUpload = lazy(() => import('./features/doctor/components/ImageUpload'));
const DiagnosisViewer = lazy(() => import('./features/doctor/components/DiagnosisViewer'));
const HistoryList = lazy(() => import('./features/management/HistoryList'));
const StatisticsDashboard = lazy(() => import('./features/management/StatisticsDashboard'));

// Trang của TV3
const PatientQueuePage = lazy(() => import('./features/doctor/components/PatientQueuePage'));

const PageLoader = () => (
  <div style={{ height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
    <Spin size="large" tip="Đang tải dữ liệu..." />
  </div>
);

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const token = localStorage.getItem('accessToken');
  if (!token) return <Navigate to="/login" replace />;
  return children;
};

const App: React.FC = () => {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        <Route path="/" element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }>
          <Route index element={<Dashboard />} />
          <Route path="patient-queue" element={<PatientQueuePage />} />
          <Route path="upload" element={<ImageUpload />} />
          <Route path="diagnosis/:id" element={<DiagnosisViewer />} />
          <Route path="history" element={<HistoryList />} />
          <Route path="stats" element={<StatisticsDashboard />} />
        </Route>
        
        <Route path="/profile" element={
            <ProtectedRoute><ProfilePage /></ProtectedRoute>
        } />

        <Route path="*" element={
          <Result
            status="404"
            title="404"
            subTitle="Trang không tồn tại"
            extra={<Button type="primary"><Link to="/">Về trang chủ</Link></Button>}
          />
        } />
      </Routes>
    </Suspense>
  );
};

export default App;