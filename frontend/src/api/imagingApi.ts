import axiosClient from "./axiosClient";

const imagingApi = {
    // --- Code cũ của bạn (Giữ nguyên) ---
    getStats: (clinicId: string) => axiosClient.get(`/imaging/stats`, { params: { clinicId } }),
    
    uploadSingle: (file: File, clinicId: string, patientId: string) => {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("patientId", patientId);
        formData.append("clinicId", clinicId);
        return axiosClient.post("/imaging/upload", formData, { headers: { "Content-Type": "multipart/form-data" } });
    },

    uploadBatch: (formData: FormData) => axiosClient.post("/imaging/batch-upload", formData, { headers: { "Content-Type": "multipart/form-data" } }),

    // KHÔI PHỤC HÀM NÀY ĐỂ HẾT LỖI BUILD (Giữ nguyên)
    getImagesByPatient: (patientId: string) => axiosClient.get(`/imaging/patient/${patientId}`),

    // --- MỚI: Thêm hàm này để trang ClinicUploadPage.tsx hoạt động được tab "Kho dữ liệu" ---
    getImagesByClinic: (clinicId: string) => axiosClient.get(`/imaging/clinic/${clinicId}`),

    deleteImage: (imageId: string) => axiosClient.delete(`/imaging/${imageId}`)
};

export default imagingApi;