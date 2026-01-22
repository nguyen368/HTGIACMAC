import axiosClient from "./axiosClient";

const imagingApi = {
  // Lấy danh sách ảnh theo ID bệnh nhân
  getImagesByPatient: (patientId) => {
    // SỬA: Đổi images -> imaging để khớp với Controller Backend
    return axiosClient.get(`/imaging/patient/${patientId}`);
  },
  
  // Xóa ảnh theo ID
  deleteImage: (imageId) => {
    return axiosClient.delete(`/imaging/${imageId}`);
  },

  // Tải ảnh đơn lẻ
  uploadSingle: (file, clinicId, patientId) => {
    const formData = new FormData();
    formData.append("File", file); 
    formData.append("ClinicId", clinicId);
    formData.append("PatientId", patientId); 
    
    return axiosClient.post("/imaging/upload", formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    });
  }
};

export default imagingApi;