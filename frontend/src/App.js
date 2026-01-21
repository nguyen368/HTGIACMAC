import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import AppRoutes from './routes/AppRoutes';
import './App.css';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider> {/* AuthProvider nằm trong Router nếu nó dùng hook điều hướng */}
        <div className="App">
          <AppRoutes />
          <ToastContainer position="top-right" autoClose={3000} />
        </div>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;