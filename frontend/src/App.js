import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import AppRoutes from './routes/AppRoutes'; // Router của nhóm
import './App.css';
import { AuthProvider } from './context/AuthContext'; // Context của nhóm

// Import hiệu ứng Tết của bạn
import TetAtmosphere from './modules/ClinicWebApp/pages/components/TetAtmosphere';

function App() {
  return (
    <BrowserRouter>
      {/* 1. Hiệu ứng Tết (Đặt ở đây để nó phủ lên toàn bộ ứng dụng dù ở trang nào) */}
      <TetAtmosphere />

      {/* 2. Cấu trúc Auth và Routing chuẩn của nhóm */}
      <AuthProvider>
          <AppRoutes />
      </AuthProvider>
    </BrowserRouter>  
  );
}

export default App; 