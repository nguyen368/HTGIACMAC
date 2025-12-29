// src/components/ProtectedRoute.tsx
import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Spin } from 'antd';

const ProtectedRoute: React.FC = () => {
  const { isAuthenticated, user } = useAuth();
  
  // Có thể thêm logic loading nếu cần thiết
  if (user === undefined) {
      return <Spin size="large" style={{ display: 'flex', justifyContent: 'center', marginTop: '50px' }} />;
  }

  // Nếu đã đăng nhập -> Cho phép đi tiếp (Outlet), Nếu chưa -> Đá về login
  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
};

export default ProtectedRoute;