import axios from "axios";

// 1. Tạo instance axios trỏ đến Port 5002 (Hoặc dùng "/api" nếu chạy qua Gateway)
const medicalClient = axios.create({
  baseURL: "http://localhost:5002/api", 
  headers: {
    "Content-Type": "application/json",
  },
});

// 2. Interceptor gắn Token
medicalClient.interceptors.request.use(async (config) => {
    const token = localStorage.getItem('aura_token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// 3. Xử lý phản hồi
medicalClient.interceptors.response.use(
  (response) => response.data,
  (error) => { throw error; }
);

// 4. Khai báo các hàm gọi API
const medicalApi = {
  getPatientProfile: () => {
    return medicalClient.get("/patients/me");
  },

  getExaminationHistory: () => {
    return medicalClient.get("/patients/examinations");
  },

  updateProfile: (data) => {
    return medicalClient.put("/patients/me", data);
  },

  addMedicalHistory: (patientId, data) => {
    return medicalClient.post(`/patients/${patientId}/history`, data);
  },

  // SỬA TẠI ĐÂY: Đổi axiosClient thành medicalClient
  getAllPatients: () => {
    return medicalClient.get("/patients"); 
  },

  getPatientById: (id) => {
    return medicalClient.get(`/patients/${id}`);
  },

  saveExamination: (data) => {
    return medicalClient.post("/medical-records/examinations", data);
  }
};

export default medicalApi;