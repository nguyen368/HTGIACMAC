import axios from "axios";
import { PatientProfile, Clinic, Examination, ClinicStats } from "../types/medical";

const medicalClient = axios.create({
    baseURL: "http://localhost:80/api",
    headers: { "Content-Type": "application/json" },
});

medicalClient.interceptors.request.use((config) => {
    const token = localStorage.getItem('aura_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
});

const medicalApi = {
    getPatientProfile: (): Promise<PatientProfile> => 
        medicalClient.get("/medical-records/patients/me").then(res => res.data),
    
    updateProfile: (data: PatientProfile): Promise<void> => 
        medicalClient.put("/medical-records/patients/me", data),

    getExaminationHistory: (): Promise<Examination[]> => 
        medicalClient.get("/medical-records/patients/examinations").then(res => res.data),

    // BỔ SUNG HÀM NÀY
    getReportData: (examId: string): Promise<any> => 
        medicalClient.get(`/medical-records/reports/${examId}`).then(res => res.data),

    getClinics: (): Promise<Clinic[]> => 
        medicalClient.get("/auth/clinics").then(res => res.data),

    getWaitingList: (clinicId?: string): Promise<Examination[]> => 
        medicalClient.get("/medical-records/examinations/queue", { params: { clinicId } }).then(res => res.data),

    verifyDiagnosis: (id: string, data: { doctorNotes: string; finalDiagnosis: string }): Promise<any> => 
        medicalClient.put(`/medical-records/examinations/${id}/verify`, data),

    getStats: (clinicId: string): Promise<ClinicStats> => 
        medicalClient.get("/medical-records/examinations/stats", { params: { clinicId } }).then(res => res.data),

    hardwareCapture: (formData: FormData): Promise<{ imageId: string }> => 
        medicalClient.post("/imaging/hardware/capture", formData, {
            headers: { "Content-Type": "multipart/form-data" }
        }).then(res => res.data),
        getExaminationById: (id: string): Promise<Examination> =>
        medicalClient.get(`/medical-records/examinations/${id}`).then(res => res.data),

    // Dùng cho ClinicExamDetail (Alias cho getExaminationById hoặc endpoint riêng nếu có)
    getExaminationDetail: (id: string): Promise<any> =>
        medicalClient.get(`/medical-records/examinations/${id}`).then(res => res.data),

    // Dùng cho việc bác sĩ cập nhật chẩn đoán sơ bộ
    updateDiagnosis: (id: string, data: { diagnosisResult: string; doctorNotes: string }): Promise<any> =>
        medicalClient.put(`/medical-records/examinations/${id}/diagnosis`, data)
};

export default medicalApi;