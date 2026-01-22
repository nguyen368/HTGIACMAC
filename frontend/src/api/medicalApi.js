// frontend/src/api/medicalApi.js
import axiosClient from "./axiosClient";

const medicalApi = {
  // Lấy danh sách tất cả bệnh nhân
  getAllPatients: () => {
    return axiosClient.get("/patients"); 
    // -> /api/patients (Gateway sẽ chuyển sang Medical Service)
  },
  
  // Lấy chi tiết 1 bệnh nhân
  getPatientById: (id) => {
    return axiosClient.get(`/patients/${id}`);
  },

  // Cập nhật hồ sơ cá nhân
  updateProfile: (data) => {
    return axiosClient.put("/patients/me", data);
  },

  // Lưu kết quả khám
  saveExamination: (data) => {
    // Lưu ý: Đường dẫn này phải khớp với Nginx location
    // Nếu Nginx cấu hình /api/examinations/ -> thì ở đây gọi /examinations
    return axiosClient.post("/examinations", data);
  }
};

export default medicalApi;