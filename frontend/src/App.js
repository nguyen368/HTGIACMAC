import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import AppRoutes from './routes/AppRoutes';
// Bạn nên cài đặt thư viện react-hot-toast để hiện thông báo đẹp hơn cho y tế
// Lệnh cài: npm install react-hot-toast
import { Toaster } from 'react-hot-toast'; 
import './App.css';

function App() {
  return (
    /* 1. BrowserRouter: Bao bọc cao nhất để quản lý điều hướng toàn ứng dụng.
    */
    <BrowserRouter>
      {/* 2. AuthProvider: Bao bọc AppRoutes để mọi trang (Dashboard, Profile, Imaging) 
            đều có thể truy cập thông tin biến 'user' từ Database.
      */}
      <AuthProvider>
        <div className="App">
          {/* 3. Toaster: Thành phần hiển thị thông báo nổi (Toast).
                Rất quan trọng để báo cho bệnh nhân biết AI đã chẩn đoán xong hay chưa.
          */}
          <Toaster 
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#363636',
                color: '#fff',
                fontFamily: 'Inter, sans-serif'
              },
            }}
          />

          {/* 4. AppRoutes: Chứa logic phân quyền. 
                Nếu 'user' trong AuthContext là null -> Chặn không cho vào Dashboard.
                Nếu 'user' có role 'Doctor' -> Cho phép vào trang Bác sĩ.
          */}
          <AppRoutes />
        </div>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;