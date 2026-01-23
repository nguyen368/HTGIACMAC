import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import AppRoutes from './routes/AppRoutes';
import './App.css'; 

function App() {
  return (
    <div className="App">
      {/* 1. Bọc BrowserRouter để kích hoạt tính năng định tuyến (Routing) */}
      <BrowserRouter>
        {/* 2. Bọc AuthProvider để quản lý trạng thái đăng nhập cho toàn bộ ứng dụng */}
        <AuthProvider>
          {/* 3. Gọi AppRoutes: Nơi chứa logic chuyển trang (Login, Dashboard, v.v.) */}
          <AppRoutes />
        </AuthProvider>
      </BrowserRouter>
    </div>
  );
}

export default App;