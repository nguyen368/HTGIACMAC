import React from 'react';
import ReactDOM from 'react-dom/client'; 
import './index.css';
import App from './App';

// Tạo root theo chuẩn React 18
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  // Tạm tắt StrictMode để tránh log 2 lần trong môi trường Dev, giúp SignalR ổn định hơn
  <App />
);