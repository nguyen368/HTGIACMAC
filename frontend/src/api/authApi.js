// src/api/authApi.js
import axiosClient from "./axiosClient";

const authApi = {
    // Gọi vào AuthController.cs [HttpPost("login")]
    login(data) {
        return axiosClient.post('/auth/login', data);
    },

    // Gọi vào AuthController.cs [HttpPost("register")]
    register(data) {
        return axiosClient.post('/auth/register', data);
    }
};

export default authApi;