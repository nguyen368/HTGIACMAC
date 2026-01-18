import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import AppRoutes from './routes/AppRoutes';
import './App.css';
import { AuthProvider } from './context/AuthContext';
function App() {
  return (
    <BrowserRouter>
      {/* Bọc AuthProvider ở đây để toàn bộ app dùng được user, login, logout */}
      <AuthProvider>
          <AppRoutes />
      </AuthProvider>
    </BrowserRouter>  
  );
}

export default App;