import axios from "axios";

const imagingClient = axios.create({
    baseURL: "http://localhost/api/", 
});

imagingClient.interceptors.request.use(async (config) => {
    const token = localStorage.getItem('aura_token') || localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

imagingClient.interceptors.response.use(
    (response) => response.data,
    (error) => {
        // Xử lý thông báo từ chối (400 BadRequest từ Backend)
        if (error.response && error.response.status === 400) {
            const msg = error.response.data.Message || "Ảnh không hợp lệ";
            console.warn("AI Validation Failed:", msg);
        }
        throw error;
    }
);

const imagingApi = {
    getImagesByPatient: (patientId) => {
        return imagingClient.get(`imaging/patient/${patientId}`);
    },
    
    uploadSingle: (file, clinicId, patientId) => {
        const formData = new FormData();
        formData.append("File", file); 
        formData.append("ClinicId", clinicId);
        formData.append("PatientId", patientId); 
        return imagingClient.post("imaging/upload", formData);
    }
};

export default imagingApi;