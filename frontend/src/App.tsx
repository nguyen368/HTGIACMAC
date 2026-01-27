import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { AuthProvider } from './context/AuthContext';
import { SignalRProvider } from './context/SignalRContext';
import AppRoutes from './routes/AppRoutes';
import './App.css';

const App: React.FC = () => {
  // Client ID của bạn
  const GOOGLE_CLIENT_ID = "738290642667-5ijkcle6dmrk4rboc9i7djnombohemcv.apps.googleusercontent.com";

  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <Router>
        <AuthProvider>
          <SignalRProvider>
            <div className="App">
              <AppRoutes />
            </div>
          </SignalRProvider>
        </AuthProvider>
      </Router>
    </GoogleOAuthProvider>
  );
}

export default App;