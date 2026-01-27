import axios, { InternalAxiosRequestConfig, AxiosResponse } from 'axios';

// Khởi tạo axios client
const axiosClient = axios.create({
    // Sử dụng cổng 8000 của Gateway. 
    // Lưu ý: process.env có thể bị đỏ nếu thiếu @types/node, nhưng khi build vẫn chạy đúng.
    baseURL: process.env.REACT_APP_API_URL || 'http://localhost:8000/api',
    headers: {
        'Content-Type': 'application/json',
    },
});

// Cấu hình Request Interceptor
axiosClient.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
        const token = localStorage.getItem('aura_token');
        if (token && config.headers) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        // BẮT BUỘC: Phải return config để request tiếp tục đi
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Cấu hình Response Interceptor
axiosClient.interceptors.response.use(
    (response: AxiosResponse) => {
        // Tự động bóc tách dữ liệu từ các wrapper của .NET (như Result, Value)
        if (response.data && response.data.value !== undefined) return response.data.value;
        if (response.data && response.data.result !== undefined) return response.data.result;
        return response.data;
    },
    (error) => {
        // Xử lý lỗi tập trung (ví dụ 401 khi hết hạn token)
        if (error.response?.status === 401) {
            console.error("Hết hạn phiên đăng nhập.");
            // Có thể thêm: window.location.href = '/login';
        }
        // BẮT BUỘC: Phải return Promise.reject để component bắt được lỗi qua catch()
        return Promise.reject(error);
    }
);

export default axiosClient;