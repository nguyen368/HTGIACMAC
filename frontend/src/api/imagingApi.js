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
<<<<<<< HEAD
    getImagesByPatient: (patientId) => {
        return axiosClient.get(`/imaging/patient/${patientId}`);
    },
    deleteImage: (imageId) => {
        return axiosClient.delete(`/imaging/${imageId}`);
    },
    uploadSingle: (file, clinicId, patientId) => {
        const formData = new FormData();
        formData.append("File", file); 
        formData.append("ClinicId", clinicId);
        formData.append("PatientId", patientId); 
        
        return axiosClient.post("/imaging/upload", formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
    },
    uploadBatch: (formData) => {
        return axiosClient.post("/imaging/batch-upload", formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
    },
    getStats: (clinicId) => {
        return axiosClient.get('/imaging/stats', {
            params: { clinicId } 
        });
    },
    getDetail: (id) => {
        return axiosClient.get(`/imaging/${id}`);
    },
    // --- [MỚI] Hàm lưu kết luận ---
    updateDiagnosis: (id, data) => {
        return axiosClient.put(`/imaging/${id}/diagnosis`, data);
    }
=======
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
  },
  getStats: (clinicId) => {
    return imagingClient.get(`/imaging/stats/${clinicId}`);
  },

  // Upload nhiều ảnh (Batch)
  batchUpload: (file, clinicId, patientId) => {
    const formData = new FormData();
    formData.append("File", file);
    formData.append("ClinicId", clinicId);
    formData.append("PatientId", patientId);
    return imagingClient.post("/imaging/upload/batch", formData);
  }
>>>>>>> 7d68b20f0738f90995a124216dde00831c1ce63d
};

export default imagingApi;