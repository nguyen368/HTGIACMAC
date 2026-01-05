// src/frontend/src/api/axiosClient.ts
import axios from 'axios';

const axiosClient = axios.create({
  // Ưu tiên lấy từ biến môi trường (Docker), nếu không có thì dùng localhost:5038
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5038/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor: Tự động gắn Token
axiosClient.interceptors.request.use(async (config) => {
  const token = localStorage.getItem('accessToken'); // Lưu ý: Code Login bạn dùng key 'accessToken'
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

axiosClient.interceptors.response.use(
  (response) => {
    return response.data;
  },
  (error) => {
    // Log lỗi ra để dễ debug
    console.error("API Error:", error.response || error.message);
    
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('user');
    }
    throw error;
  }
);

export default axiosClient;