import axios from "axios";

// Tạo instance riêng gọi thẳng vào Port 5003 (Imaging Service)
const imagingClient = axios.create({
  baseURL: "http://localhost:5003/api", 
  // Content-Type: multipart/form-data axios sẽ tự set khi thấy FormData
});

// 1. [QUAN TRỌNG] Thêm Interceptor Token (Giống hệt medicalApi)
// Nếu không có cái này -> Lỗi 400 hoặc 401 ngay
imagingClient.interceptors.request.use(async (config) => {
    const token = localStorage.getItem('aura_token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

imagingClient.interceptors.response.use(
  (response) => {
    if (response && response.data) {
      return response.data;
    }
    return response;
  },
  (error) => {
    throw error;
  }
);

const imagingApi = {
  uploadSingle: (file, clinicId, patientId) => {
    const formData = new FormData();
    formData.append("File", file); 
    formData.append("ClinicId", clinicId);
    formData.append("PatientId", patientId); // Server cần đúng tên này
    
    return imagingClient.post("/imaging/upload", formData);
  },

  // Lấy danh sách ảnh của một bệnh nhân
  getImagesByPatient: (patientId) => {
    return imagingClient.get(`/imaging/patient/${patientId}`);
  },
  
  // Xóa ảnh
  deleteImage: (imageId) => {
    return imagingClient.delete(`/imaging/${imageId}`);
  }
};

export default imagingApi;