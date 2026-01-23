import axiosClient from "./axiosClient";

const authApi = {
    // Không để dấu / ở đầu route để axiosClient nối chuỗi chuẩn
    login(data) {
        return axiosClient.post('auth/login', data);
    },
    register(data) {
        return axiosClient.post('auth/register', data);
    },
    getAllPatients() {
        return axiosClient.get('auth/patients');
    }
};

export default authApi;