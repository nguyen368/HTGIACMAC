import React, { Suspense, lazy } from 'react';
import { Routes, Route, Link, Navigate } from 'react-router-dom'; // Thêm Navigate
import { Spin, Result, Button } from 'antd';
import MainLayout from './MainLayout';
import LoginPage from './Login'; // Import trang Login vừa tạo

// Import các component (giữ nguyên của bạn)
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
const ProtectedRoute = ({ children }: { children: JSX.Element }) => {
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
        {/* 1. Route Login nằm NGOÀI MainLayout (để không hiện sidebar) */}
        <Route path="/login" element={<LoginPage />} />

        {/* 2. Các Route chính nằm TRONG MainLayout và được BẢO VỆ */}
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

        {/* 3. Trang 404 */}
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