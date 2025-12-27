import React, { Suspense, lazy } from 'react';
import { Routes, Route, Link } from 'react-router-dom';
import { Spin, Result, Button } from 'antd';
import MainLayout from './MainLayout';

// Import các component
const Dashboard = lazy(() => import('./features/doctor/components/Dashboard')); 
const ImageUpload = lazy(() => import('./features/doctor/components/ImageUpload'));
const DiagnosisViewer = lazy(() => import('./features/doctor/components/DiagnosisViewer'));

// Import đúng file thật của bạn
const HistoryList = lazy(() => import('./features/management/HistoryList'));
const StatisticsDashboard = lazy(() => import('./features/management/StatisticsDashboard'));

// Màn hình chờ
const PageLoader = () => (
  <div style={{ height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
    <Spin size="large" />
  </div>
);

const App: React.FC = () => {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route path="/" element={<MainLayout />}>
          <Route index element={<Dashboard />} />
          
          <Route path="upload" element={<ImageUpload />} />
          <Route path="diagnosis/:id" element={<DiagnosisViewer />} />
          
          {/* Route trỏ thẳng vào file của bạn để test riêng */}
          <Route path="history" element={<HistoryList />} />
          <Route path="stats" element={<StatisticsDashboard />} />
          
          <Route path="*" element={
            <Result
              status="404"
              title="404"
              subTitle="Trang không tồn tại"
              extra={<Button type="primary"><Link to="/">Về trang chủ</Link></Button>}
            />
          } />
        </Route>
      </Routes>
    </Suspense>
  );
};

export default App;