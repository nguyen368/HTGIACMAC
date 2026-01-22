import axios from 'axios';

const axiosClient = axios.create({
    // Quan trọng: baseURL trỏ vào /api của Gateway (cổng 80)
    // Trình duyệt sẽ tự điền domain: http://localhost/api
    baseURL: '/api', 
    headers: {
        'Content-Type': 'application/json',
    },
});

axiosClient.interceptors.request.use((config) => {
    const token = localStorage.getItem('aura_token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Thêm interceptor response để trả về data gọn gàng (giống file cũ của bạn)
axiosClient.interceptors.response.use(
    (response) => response.data || response, // Ưu tiên trả về data
    (error) => { throw error; }
);

export default axiosClient;