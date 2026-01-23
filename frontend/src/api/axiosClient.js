// frontend/src/api/axiosClient.js
import axios from 'axios';

const axiosClient = axios.create({
    // baseURL chỉ dừng ở /api
    baseURL: 'http://localhost/api', 
    headers: {
        'Content-Type': 'application/json',
    },
});

// Thêm interceptors nếu cần (để đính kèm Token JWT)
axiosClient.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export default axiosClient;