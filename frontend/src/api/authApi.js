import axiosClient from "./axiosClient";

const authApi = {
    login(data) {
        return axiosClient.post('/auth/login', data);
    },
    register(data) {
        return axiosClient.post('/auth/register', data);
    },
    getAllPatients() {
        return axiosClient.get('/auth/patients');
    }
};

export default authApi;