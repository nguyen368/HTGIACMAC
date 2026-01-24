import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { AuthProvider } from './context/AuthContext';
import { SignalRProvider } from './context/SignalRContext'; // BỔ SUNG: Thư viện kết nối Real-time
import AppRoutes from './routes/AppRoutes';
import './App.css';

function App() {
  // Client ID Google của dự án AURA
  const GOOGLE_CLIENT_ID = "738290642667-5ijkcle6dmrk4rboc9i7djnombohemcv.apps.googleusercontent.com";

  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <BrowserRouter>
        <AuthProvider>
          {/* BỔ SUNG: Bao bọc SignalRProvider để tránh lỗi trắng trang khi dùng useSignalR */}
          <SignalRProvider> 
            <AppRoutes />
          </SignalRProvider>
        </AuthProvider>
      </BrowserRouter>
    </GoogleOAuthProvider>
  );
}

export default App;