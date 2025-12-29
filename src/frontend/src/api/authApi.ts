import axiosClient from './axiosClient';

// --- QUAN TRỌNG: Phải có chữ export ở đầu ---
export interface LoginRequest {
  username: string;
  password?: string;
}

export interface LoginResponse {
  token: string;
  user: {
    username: string;
    fullName: string;
    role: 'bacsi' | 'kythuat';
  };
}
// ---------------------------------------------

const authApi = {
  login(data: LoginRequest): Promise<LoginResponse> {
    return axiosClient.post('/Auth/login', data);
  },
  
  getProfile() {
    return axiosClient.get('/Auth/me');
  }
};

export default authApi;