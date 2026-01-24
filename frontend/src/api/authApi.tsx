import axiosClient from './axiosClient';

// Định nghĩa kiểu dữ liệu cho các yêu cầu
interface LoginRequest {
    phoneNumber?: string;
    email?: string;
    password?: string;
}

const authApi = {
    login(data: LoginRequest) {
        return axiosClient.post('/auth/login', data);
    },
    register(data: any) {
        return axiosClient.post('/auth/register', data);
    },
    registerPartner(data: any) {
        return axiosClient.post('/auth/register-partner', data);
    },
    googleLogin(data: { token: string }) {
        return axiosClient.post('/auth/google-login', data);
    },
    getAllPatients() {
        return axiosClient.get('/auth/patients');
    }
};

export default authApi;