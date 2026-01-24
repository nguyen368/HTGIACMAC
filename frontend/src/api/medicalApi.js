import axiosClient from "./axiosClient";

const medicalApi = {
  // Lấy danh sách bệnh nhân
  getAllPatients: () => axiosClient.get("/patients"),
  
  // Lấy chi tiết bệnh nhân
  getPatientById: (id) => axiosClient.get(`/patients/${id}`),

  // Dashboard thống kê (FR-21)
  getStats: () => axiosClient.get("/medical-records/examinations/stats"),

  // Lấy danh sách hàng chờ (FR-13, FR-18)
  getQueue: (searchTerm = "") => 
    axiosClient.get(`/medical-records/examinations/queue${searchTerm ? `?searchTerm=${searchTerm}` : ""}`),

  // Lấy chi tiết ca khám (FR-14)
  getExaminationById: (id) => axiosClient.get(`/medical-records/examinations/${id}`),

  // Lưu/Duyệt kết quả chẩn đoán (FR-15, FR-16)
  verifyExamination: (id, data) => 
    axiosClient.put(`/medical-records/examinations/${id}/verify`, data),

  saveExamination: (data) => axiosClient.post("/medical-records/examinations", data),
  
  updateProfile: (data) => axiosClient.put("/patients/me", data),
};

export default medicalApi;