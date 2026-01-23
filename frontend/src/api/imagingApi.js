import axios from "axios";

const imagingClient = axios.create({
  baseURL: "http://localhost:5003/api", 
});

imagingClient.interceptors.request.use(async (config) => {
    const token = localStorage.getItem('aura_token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

imagingClient.interceptors.response.use(
  (response) => response.data,
  (error) => { throw error; }
);

const imagingApi = {
  // Lấy danh sách ảnh theo ID bệnh nhân
  getImagesByPatient: (patientId) => {
    return imagingClient.get(`/imaging/patient/${patientId}`);
  },
  
  // Xóa ảnh theo ID
  deleteImage: (imageId) => {
    return imagingClient.delete(`/imaging/${imageId}`);
  },

  // Tải ảnh đơn lẻ
  uploadSingle: (file, clinicId, patientId) => {
    const formData = new FormData();
    formData.append("File", file); 
    formData.append("ClinicId", clinicId);
    formData.append("PatientId", patientId); 
    return imagingClient.post("/imaging/upload", formData);
  }
};

export default imagingApi;