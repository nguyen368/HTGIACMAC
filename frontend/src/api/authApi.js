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
    
    googleLogin: (googleToken) => {
        const url = '/auth/google-login'; 
        return axiosClient.post(url, { token: googleToken }); 
    },

    // --- Lấy danh sách bệnh nhân ---
    getAllPatients: () => {
        return axiosClient.get('/users/patients'); 
    },

    // --- [MỚI] Tạo bệnh nhân mới ---
    createPatient: (data) => {
        return axiosClient.post('/users/patients', data);
    }
};

export default authApi;