import { PatientProfile, Clinic, Examination, ClinicStats } from "../types/medical";
import axiosClient from "./axiosClient";

const medicalApi = {
    // --- PHÂN HỆ BỆNH NHÂN ---
    getPatientProfile: (): Promise<PatientProfile> => 
        axiosClient.get("/patients/me"),
    
    updateProfile: (data: PatientProfile): Promise<void> => 
        axiosClient.put("/patients/me", data),

    getExaminationHistory: (): Promise<Examination[]> => 
        axiosClient.get("/patients/examinations"),

    getReportData: (examId: string): Promise<any> => 
        axiosClient.get(`/medical-records/reports/${examId}`),

    // --- PHÂN HỆ PHÒNG KHÁM & BÁC SĨ ---
    getClinics: (): Promise<Clinic[]> => 
        axiosClient.get("/auth/clinics"),

    // FIX LỖI 400: clinicId là bắt buộc để Backend lọc danh sách hàng đợi
    getWaitingList: (clinicId: string): Promise<Examination[]> => 
        axiosClient.get("/medical-records/examinations/queue", { 
            params: { clinicId } 
        }),

    // API xác nhận chẩn đoán (Verify)
    verifyDiagnosis: (id: string, data: { doctorNotes: string; finalDiagnosis: string }): Promise<any> => 
        axiosClient.put(`/medical-records/examinations/${id}/verify`, data),

    // FIX LỖI 400: clinicId là bắt buộc cho báo cáo Dashboard
    getStats: (clinicId: string): Promise<ClinicStats> => {
        if (!clinicId) return Promise.reject("ClinicId is required");
        return axiosClient.get("/medical-records/examinations/stats", { 
            params: { clinicId } 
        });
    },

    // Cập nhật chẩn đoán (Diagnosis)
    updateDiagnosis: (id: string, data: { diagnosisResult: string; doctorNotes: string }): Promise<any> =>
        axiosClient.put(`/medical-records/examinations/${id}/diagnosis`, data),

    // Hàm tạo bác sĩ mới (Dùng cho Clinic Admin)
    createDoctor: (data: any): Promise<void> => 
        axiosClient.post("/auth/create-doctor", data),

    // Lấy chi tiết ca khám theo ID
    getExaminationById: (id: string): Promise<Examination> =>
        axiosClient.get(`/medical-records/examinations/${id}`),

    // Hàm alias cho getExaminationById (nếu các file khác đang gọi tên này)
    getExaminationDetail: (id: string): Promise<any> =>
        axiosClient.get(`/medical-records/examinations/${id}`),

    // --- HỖ TRỢ PHẦN CỨNG & ẢNH ---
    hardwareCapture: (formData: FormData): Promise<{ imageId: string }> => 
        axiosClient.post("/imaging/hardware/capture", formData, {
            headers: { "Content-Type": "multipart/form-data" }
        }),
};

export default medicalApi;