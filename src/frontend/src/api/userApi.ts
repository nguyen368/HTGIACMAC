import axiosClient from './axiosClient';

// --- QUAN TRỌNG: Phải có chữ "export" ở đây ---
export interface UserProfile {
  id: number;
  fullName: string;
  email: string;
  role: string;
}

const userApi = {
  getProfile: (id: number) => {
    return axiosClient.get(`/user/${id}`);
  },
  updateProfile: (id: number, data: { fullName: string; email: string }) => {
    return axiosClient.put(`/user/${id}`, data);
  },
  uploadBasic: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return axiosClient.post('/upload/basic', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
};

export default userApi;