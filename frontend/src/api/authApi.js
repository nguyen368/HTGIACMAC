import axiosClient from './axiosClient';

const authApi = {
    login(data) {
        return axiosClient.post('/auth/login', data);
    },
    register(data) {
        return axiosClient.post('/auth/register', data);
    },
    // Hàm mới cho Quản lý
    registerPartner(data) {
        return axiosClient.post('/auth/register-partner', data);
    },
    googleLogin(data) {
        return axiosClient.post('/auth/google-login', data);
    },
    getAllPatients() {
        return axiosClient.get('/auth/patients');
    }
};

export default authApi;