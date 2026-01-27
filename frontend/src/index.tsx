import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min';
import '@fortawesome/fontawesome-free/css/all.min.css';
import 'react-toastify/dist/ReactToastify.css'; // Import CSS cho Toast

const rootElement = document.getElementById('root');

// [FIX LỖI] Kiểm tra null trước khi render
if (!rootElement) {
    throw new Error('Failed to find the root element');
}

const root = ReactDOM.createRoot(rootElement as HTMLElement);
root.render(
    // <React.StrictMode> // Đã comment lại để tránh log 2 lần trong Dev mode
        <App />
    // </React.StrictMode>
);