import axios from "axios";

const axiosClient = axios.create({
  // BẮT BUỘC có dấu / ở cuối để làm gốc nối chính xác
  baseURL: "http://localhost/api/", 
  headers: {
    "Content-Type": "application/json",
  },
});

// Tự động gắn Token vào Header
axiosClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('aura_token') || localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Trả về data trực tiếp
axiosClient.interceptors.response.use(
  (response) => response.data,
  (error) => {
    console.error("[AxiosClient] API Error:", error.response?.status, error.config?.url);
    throw error;
  }
);

export default axiosClient;