import axios from "axios";

// 1. Tạo instance axios trỏ đến Port 5002 (Medical Service)
const medicalClient = axios.create({
  baseURL: "http://localhost:5002/api", 
  headers: {
    "Content-Type": "application/json",
  },
});

// 2. [QUAN TRỌNG] Interceptor: Tự động gắn Token vào Header trước khi gửi
// Nếu thiếu đoạn này => Server sẽ trả về 401 Unauthorized
medicalClient.interceptors.request.use(async (config) => {
    const token = localStorage.getItem('aura_token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// 3. Xử lý phản hồi gọn gàng (Trả về data luôn, bỏ qua wrapper của axios)
medicalClient.interceptors.response.use(
  (response) => response.data,
  (error) => { throw error; }
);

// 4. Khai báo các hàm gọi API
const medicalApi = {
  // Lấy danh sách tất cả bệnh nhân
  getAllPatients: () => {
    return medicalClient.get("/patients");
  },
  
  // Lấy chi tiết 1 bệnh nhân
  getPatientById: (id) => {
    return medicalClient.get(`/patients/${id}`);
  },

  // Cập nhật hồ sơ cá nhân
  updateProfile: (data) => {
    return medicalClient.put("/patients/me", data);
  },

  // [MỚI] Hàm lưu kết quả khám (Examinations)
  // Route này khớp với [Route("api/medical-records/examinations")] trong Controller Backend
  saveExamination: (data) => {
    // data gồm: { patientId, imageId, diagnosis, doctorNotes, doctorId }
    return medicalClient.post("/medical-records/examinations", data);
  }
};

export default medicalApi;