import React, { Suspense, lazy } from 'react';
import { Routes, Route, Link, Navigate } from 'react-router-dom';
import { Spin, Result, Button } from 'antd';
import MainLayout from './MainLayout';
import LoginPage from './features/auth/LoginPage';
import RegisterPage from './features/auth/RegisterPage'; // <--- MỚI THÊM: Import trang đăng ký
import ProfilePage from './features/user/ProfilePage';

// Import các component (Lazy load)
const Dashboard = lazy(() => import('./features/doctor/components/Dashboard')); 
const ImageUpload = lazy(() => import('./features/doctor/components/ImageUpload'));
const DiagnosisViewer = lazy(() => import('./features/doctor/components/DiagnosisViewer'));
const HistoryList = lazy(() => import('./features/management/HistoryList'));
const StatisticsDashboard = lazy(() => import('./features/management/StatisticsDashboard'));

const PageLoader = () => (
  <div style={{ height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
    <Spin size="large" />
  </div>
);

// Component bảo vệ: Nếu chưa đăng nhập thì đá về Login
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const token = localStorage.getItem('accessToken');
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

const App: React.FC = () => {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* --- NHÓM PUBLIC ROUTES (Không cần đăng nhập) --- */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} /> {/* <--- MỚI THÊM: Route Đăng ký */}

        {/* --- NHÓM PRIVATE ROUTES (Cần đăng nhập) --- */}
        <Route path="/" element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }>
          <Route index element={<Dashboard />} />
          <Route path="upload" element={<ImageUpload />} />
          <Route path="diagnosis/:id" element={<DiagnosisViewer />} />
          <Route path="history" element={<HistoryList />} />
          <Route path="stats" element={<StatisticsDashboard />} />
        </Route>
        
        <Route path="/profile" element={
            <ProtectedRoute>
                <ProfilePage />
            </ProtectedRoute>
        } />

        {/* --- TRANG 404 --- */}
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