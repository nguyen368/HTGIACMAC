import React from 'react';
import ReactDOM from 'react-dom/client'; // 👈 Dùng client mới của React 18
import './index.css';
import App from './App';

// Tạo root theo chuẩn React 18
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  // <React.StrictMode> // Tạm tắt StrictMode để tránh log 2 lần, bật lại sau nếu cần
    <App />
  // </React.StrictMode>
);