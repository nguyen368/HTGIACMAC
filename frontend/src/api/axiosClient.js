// src/api/axiosClient.js
import axios from 'axios';

const axiosClient = axios.create({
    // Port 5001 là port của Identity Service trong file docker-compose.yml
    baseURL: 'http://localhost:5001/api', 
    headers: {
        'Content-Type': 'application/json',
    },
}); 

// Tự động đính kèm Token nếu user đã đăng nhập
axiosClient.interceptors.request.use(async (config) => {
    const token = localStorage.getItem('aura_token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export default axiosClient;