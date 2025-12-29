// src/frontend/src/api/axiosClient.ts
import axios from 'axios';

const axiosClient = axios.create({
  // Địa chỉ backend của bạn (Check file launchSettings.json trong backend để biết port)
  // Thường là https://localhost:7001 hoặc http://localhost:5000
// Cập nhật cổng thành 5099
baseURL: 'http://localhost:5099/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor: Tự động gắn Token vào header mỗi khi gọi API
axiosClient.interceptors.request.use(async (config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor: Xử lý lỗi trả về (VD: Token hết hạn thì tự logout)
axiosClient.interceptors.response.use(
  (response) => {
    return response.data;
  },
  (error) => {
    if (error.response && error.response.status === 401) {
      // Token hết hạn hoặc không hợp lệ -> Xóa storage và reload
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      // window.location.href = '/login'; // Tùy chọn: force logout
    }
    throw error;
  }
);

export default axiosClient;