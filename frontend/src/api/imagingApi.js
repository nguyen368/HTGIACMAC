import axiosClient from "./axiosClient";

const imagingApi = {
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
};

export default imagingApi;