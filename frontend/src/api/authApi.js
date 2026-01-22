import axiosClient from './axiosClient';

const authApi = {
    login: (data) => {
        const url = '/auth/login';
        return axiosClient.post(url, data);
    },
    register: (data) => {
        const url = '/auth/register';
        return axiosClient.post(url, data);
    },
    
    // --- THÊM HÀM NÀY ĐỂ GỌI BACKEND ---
    googleLogin: (googleToken) => {
        // Đây là API mà Backend của bạn PHẢI CÓ
        const url = '/auth/google-login'; 
        // Gửi token sang backend dưới dạng JSON
        return axiosClient.post(url, { token: googleToken }); 
    }
};

export default authApi;