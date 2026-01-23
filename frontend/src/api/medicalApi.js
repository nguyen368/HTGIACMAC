import axios from "axios";

// 1. Tạo instance axios trỏ đến Gateway (Port 80)
// Lưu ý: Tất cả request phải đi qua Gateway Ocelot
const medicalClient = axios.create({
  baseURL: "http://localhost:80/api", 
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
  // --- PATIENT APIs ---
  getPatientProfile: () => medicalClient.get("/patients/me"),
  updateProfile: (data) => medicalClient.put("/patients/me", data),
  getExaminationHistory: () => medicalClient.get("/patients/examinations"),
  addMedicalHistory: (patientId, data) => medicalClient.post(`/patients/${patientId}/history`, data),
  getAllPatients: () => medicalClient.get("/patients"), 
  getPatientById: (id) => medicalClient.get(`/patients/${id}`),

  // --- DOCTOR / CLINIC APIs ---
  // Lấy danh sách chờ (Queue)
  getWaitingList: (clinicId) => medicalClient.get("/medical-records/examinations/queue", { params: { clinicId } }),

  // Lấy chi tiết ca khám (Bao gồm Heatmap)
  getExaminationDetail: (id) => medicalClient.get(`/medical-records/examinations/${id}`),

  // Bác sĩ lưu kết quả (Verify)
  // Lưu ý: Backend dùng PUT {id}/verify
  verifyDiagnosis: (id, data) => medicalClient.put(`/medical-records/examinations/${id}/verify`, data),

  // In báo cáo (Traceability)
  getReportData: (id) => medicalClient.get(`/medical-records/reports/${id}/print`),

  // Thống kê Dashboard
  getStats: () => medicalClient.get("/medical-records/examinations/stats"),

  // Hardware Upload (Giả lập)
  hardwareCapture: (formData) => {
    return medicalClient.post(`/hardware/capture`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  }
};

export default medicalApi;