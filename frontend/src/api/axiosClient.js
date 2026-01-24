import axios from 'axios';

const axiosClient = axios.create({
  // URL của API Gateway (Ocelot) để điều hướng đến các Microservices
  baseURL: 'http://localhost:8000/api', 
  headers: { 
    'Content-Type': 'application/json' 
  },
});

// Xử lý dữ liệu trả về tự động để không phải gọi .data nhiều lần ở tầng giao diện
axiosClient.interceptors.response.use(
  (response) => {
    // Nếu API trả về dữ liệu, lấy trực tiếp phần body
    return response.data;
  },
  (error) => {
    // Xử lý lỗi tập trung nếu cần (ví dụ: mất kết nối, token hết hạn)
    console.error('API Error:', error.response ? error.response.data : error.message);
    return Promise.reject(error);
  }
);

export default axiosClient;