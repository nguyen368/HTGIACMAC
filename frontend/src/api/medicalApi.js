import axios from "axios";

// 1. Khởi tạo instance axios trỏ đến Gateway (Cổng 80)
const medicalClient = axios.create({
  baseURL: "http://localhost/api", 
  headers: {
    "Content-Type": "application/json",
  },
});

// 2. Interceptor cho Request: Đảm bảo đính kèm Token vào Header
medicalClient.interceptors.request.use(async (config) => {
    // Thử lấy token với cả 2 key phổ biến để tránh lỗi 401 do sai tên key lưu trữ
    const token = localStorage.getItem('aura_token') || localStorage.getItem('token');
    
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
        // Log để bạn kiểm tra trong F12 Console xem Token đã được gửi đi chưa
        console.log(`[MedicalAPI] Đang gọi: ${config.url} (Token: ${token.substring(0, 15)}...)`);
    } else {
        // Nếu không thấy Token, cảnh báo ngay tại Console
        console.warn("[MedicalAPI] Không tìm thấy Token trong LocalStorage! Yêu cầu sẽ bị trả về 401.");
    }
    return config;
}, (error) => {
    return Promise.reject(error);
});

// 3. Interceptor cho Response: Xử lý phản hồi và lỗi tập trung
medicalClient.interceptors.response.use(
  (response) => response.data,
  (error) => {
      // Xử lý riêng lỗi 401 để hướng dẫn người dùng debug
      if (error.response && error.response.status === 401) {
          console.error("[MedicalAPI] Lỗi 401: Unauthorized. Token có thể hết hạn hoặc không hợp lệ.");
      }
      throw error;
  }
);

// 4. Khai báo các hàm gọi API (Giữ nguyên logic cũ và bổ sung đầy đủ)
const medicalApi = {
  // Lấy hồ sơ cá nhân của bệnh nhân đang đăng nhập (Khớp [HttpGet("me")])
  getPatientProfile: () => {
    return medicalClient.get("/patients/me");
  },

  // Xem lịch sử các lần khám (Khớp [HttpGet("examinations")])
  getExaminationHistory: () => {
    return medicalClient.get("/patients/examinations");
  },

  // Cập nhật hoặc tạo mới hồ sơ (Khớp [HttpPut("me")])
  updateProfile: (data) => {
    return medicalClient.put("/patients/me", data);
  },

  // Thêm tiền sử bệnh (Khớp [HttpPost("{patientId}/history")])
  addMedicalHistory: (patientId, data) => {
    return medicalClient.post(`/patients/${patientId}/history`, data);
  },

  // Lấy danh sách tất cả bệnh nhân (Dành cho role Doctor/Admin)
  getAllPatients: () => {
    return medicalClient.get("/patients");
  },

  // Lấy chi tiết một bệnh nhân theo ID cụ thể
  getPatientById: (id) => {
    return medicalClient.get(`/patients/${id}`);
  }
};

export default medicalApi;