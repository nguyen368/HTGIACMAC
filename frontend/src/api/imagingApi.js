import axios from "axios";

// Tạo instance riêng gọi thẳng vào Port 5003 (Imaging Service)
const imagingClient = axios.create({
  baseURL: "http://localhost:5003/api", 
  // Lưu ý: Content-Type: multipart/form-data chủ yếu cho Upload.
  // Các request GET/DELETE thông thường axios sẽ tự xử lý header phù hợp.
  headers: {
    "Content-Type": "multipart/form-data", 
  },
});

// Interceptor để lấy data gọn gàng
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
  // 1. Upload Hàng loạt (Zip)
  batchUpload: (zipFile, clinicId, patientId) => {
    const formData = new FormData();
    formData.append("zipFile", zipFile);
    formData.append("clinicId", clinicId);
    formData.append("patientId", patientId);
    return imagingClient.post("/imaging/batch-upload", formData);
  },

  // 2. Upload Đơn lẻ (Ảnh)
  uploadSingle: (file, clinicId, patientId) => {
    const formData = new FormData();
    formData.append("File", file); // Tên 'File' phải khớp với UploadImageRequest trong C#
    formData.append("ClinicId", clinicId);
    formData.append("PatientId", patientId);
    return imagingClient.post("/imaging/upload", formData);
  },

  // 3. Lấy thống kê Dashboard
  getStats: (clinicId) => {
    return imagingClient.get(`/imaging/stats/${clinicId}`);
  },

  // --- [MỚI BỔ SUNG] ---
  
  // 4. Lấy danh sách ảnh của một bệnh nhân (Dùng cho Hồ sơ bệnh án)
  getImagesByPatient: (patientId) => {
    return imagingClient.get(`/imaging/patient/${patientId}`);
  },

  // 5. Xóa ảnh (Dùng khi upload nhầm)
  deleteImage: (imageId) => {
    return imagingClient.delete(`/imaging/${imageId}`);
  }
};

export default imagingApi;