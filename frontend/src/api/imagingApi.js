// src/api/imagingApi.js
import axios from "axios";

// 1. Tạo kết nối RIÊNG cho Imaging Service (Chạy cổng 5003)
const imagingClient = axios.create({
  baseURL: "http://localhost:5003/api", // Base URL đã có sẵn /api
  headers: {
    "Content-Type": "application/json",
  },
});

// Thêm interceptor để xử lý phản hồi trả về data trực tiếp (giúp code gọn hơn)
imagingClient.interceptors.response.use(
  (response) => {
    if (response && response.data) {
      return response.data;
    }
    return response;
  },
  (error) => {
    // Ném lỗi ra để component bắt được (catch)
    throw error;
  }
);

const imagingApi = {
  // --- API 1: Upload file Zip (Batch Processing) ---
  batchUpload: (zipFile, clinicId, patientId) => {
    const formData = new FormData();
    // Tên 'zipFile' này PHẢI KHỚP với tên tham số trong Controller (IFormFile zipFile)
    formData.append("zipFile", zipFile); 
    formData.append("clinicId", clinicId);
    formData.append("patientId", patientId);

    // [QUAN TRỌNG]: Đã sửa thành '/imaging/...' cho đúng với Route Backend
    return imagingClient.post("/imaging/batch-upload", formData, {
      headers: {
        "Content-Type": "multipart/form-data", // Bắt buộc khi gửi file
      },
    });
  },

  // --- API 2: Lấy thống kê (Stats) ---
  getStats: (clinicId) => {
    // [QUAN TRỌNG]: Đã sửa thành '/imaging/...'
    return imagingClient.get(`/imaging/stats/${clinicId}`);
  }
};

export default imagingApi;