import axiosClient from "./axiosClient";

// Định nghĩa Interface dữ liệu trả về từ API
export interface PatientQueueItem {
  reportId: number | string;
  patientName: string;
  createdAt: string;
  riskLevel: string;
  status?: string;
}

export const doctorApi = {
  // --- SỬA LỖI 404: Gọi đúng Route định nghĩa trong DoctorController.cs ---
  // Backend: [HttpGet("assigned-patients/{doctorId}")]
  getAssignedPatients: (doctorId: string) => {
    return axiosClient.get<PatientQueueItem[]>(`/Doctor/assigned-patients/${doctorId}`);
  },

  // --- CÁC HÀM KHÁC (Giữ lại để phát triển tính năng) ---
  // Lưu ý: Bạn cần đảm bảo Backend cũng đã có các Controller tương ứng cho các path bên dưới
  
  // Cập nhật trạng thái khám (ví dụ: đang khám, hoàn thành)
  updateStatus: (queueId: number | string, status: string) => {
    return axiosClient.put(`/doctor/queue/${queueId}/status`, { status });
  },

  // Lưu kết quả chẩn đoán (MedicalReport)
  saveDiagnosis: (data: any) => {
    return axiosClient.post('/doctor/diagnosis', data);
  },
  
  // Lấy lịch sử khám bệnh
  getHistory: (doctorId?: string) => {
     const url = doctorId 
      ? `/doctor/history?doctorId=${doctorId}` 
      : '/doctor/history';
    return axiosClient.get(url);
  }
};