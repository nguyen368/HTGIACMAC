import axios from "axios";

// Tạo instance riêng gọi thẳng vào Port 5003 (Imaging Service)
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
  (response) => {
    if (response && response.data) return response.data;
    return response;
  },
  (error) => { throw error; }
);

const imagingApi = {
  uploadSingle: (file, clinicId, patientId) => {
    const formData = new FormData();
    formData.append("File", file); 
    formData.append("ClinicId", clinicId);
    formData.append("PatientId", patientId); 
    return imagingClient.post("/imaging/upload", formData);
  },

  batchUpload: (file, clinicId, patientId) => {
      const formData = new FormData();
      formData.append("zipFile", file);
      formData.append("clinicId", clinicId);
      formData.append("patientId", patientId);
      return imagingClient.post("/imaging/batch-upload", formData);
  },

  getImagesByPatient: (patientId) => {
    return imagingClient.get(`/imaging/patient/${patientId}`);
  },
  
  // [MỚI] Lấy chi tiết ảnh
  getDetail: (imageId) => {
    return imagingClient.get(`/imaging/${imageId}`);
  },

  getStats: (clinicId) => {
      return imagingClient.get(`/imaging/stats/${clinicId}`);
  },
  
  deleteImage: (imageId) => {
    return imagingClient.delete(`/imaging/${imageId}`);
  }
};

export default imagingApi;