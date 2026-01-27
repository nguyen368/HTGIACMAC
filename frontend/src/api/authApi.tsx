import axiosClient from './axiosClient';

// [QUAN TRỌNG] Khai báo đầy đủ các trường có thể gửi lên khi login
interface LoginRequest {
    phoneNumber?: string; 
    email?: string;       // <-- Bắt buộc phải có dòng này
    username?: string;    // Thêm luôn username cho chắc chắn
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
    },

    // Hàm tạo bệnh nhân nhanh (cho trang Upload)
    createPatient(data: any) {
        const payload = {
            fullName: data.fullName,
            // Tự sinh email giả nếu không có
            email: data.email || `${data.citizenId || Date.now()}@patient.local`,
            password: 'Password@123',
            confirmPassword: 'Password@123',
            ...data
        };
        return axiosClient.post('/auth/register', payload);
    }
};

export default authApi;