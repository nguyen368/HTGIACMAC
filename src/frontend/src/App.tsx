import React from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import { Button, Result } from 'antd';
import MainLayout from './MainLayout';
import ImageUpload from './features/doctor/components/ImageUpload';
import DiagnosisViewer from './features/doctor/components/DiagnosisViewer';

// Import các component quản lý (Đảm bảo file StatisticsDashboard.tsx đã được tạo)
import HistoryList from './features/management/HistoryList';
import StatisticsDashboard from './features/management/StatisticsDashboard';

// Component trang chủ đơn giản
const Dashboard = () => {
  const navigate = useNavigate();
  return (
    <div style={{ padding: '50px', background: 'white', borderRadius: 12, textAlign: 'center', margin: 24 }}>
      <Result
        status="success"
        title="Hệ Thống Sẵn Sàng"
        subTitle="Chào mừng bạn đến với hệ thống hỗ trợ chẩn đoán bệnh lý giác mạc."
        extra={[
          <Button type="primary" key="console" onClick={() => navigate('/upload')} size="large" style={{ background: '#0050b3' }}>
            Bắt đầu chẩn đoán ngay
          </Button>,
        ]}
      />
    </div>
  );
};

const App: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<MainLayout />}>
        {/* Route index là trang chủ mặc định */}
        <Route index element={<Dashboard />} />
        
        {/* Các route chức năng của Bác sĩ */}
        <Route path="upload" element={<ImageUpload />} />
        <Route path="diagnosis/:id" element={<DiagnosisViewer />} />
        
        {/* Các route Quản lý (TV5 & TV6) */}
        <Route path="history" element={<HistoryList />} />
        <Route path="stats" element={<StatisticsDashboard />} />
        
        {/* Trang 404 nếu nhập sai đường dẫn */}
        <Route path="*" element={
            <div style={{ padding: 24, textAlign: "center" }}>
                <h2>404 - Không tìm thấy trang</h2>
                <Button type="link" href="/">Quay về trang chủ</Button>
            </div>
        } />
      </Route>
    </Routes>
  );
};

export default App;