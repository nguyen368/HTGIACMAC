import axiosClient from './axiosClient';

// Interface cho Request Login
export interface LoginRequest {
  email: string;     // Sửa username -> email cho khớp Backend
  password: string;
}

// Interface cho Request Register (Mới thêm)
export interface RegisterRequest {
  fullName: string;
  email: string;
  password: string;
}

export interface AuthResponse {
  message: string;
  userId: string;
  // token: string; // Tuần sau sẽ có token
}

const authApi = {
  // Gọi API Đăng nhập
  login(data: LoginRequest) {
    return axiosClient.post('/Auth/login', data);
  },

  // Gọi API Đăng ký (Mới thêm)
  register(data: RegisterRequest) {
    return axiosClient.post('/Auth/register', data);
  }
};

export default authApi;