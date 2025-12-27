// Định nghĩa các đối tượng dữ liệu theo chuẩn OOP
export interface AIResult {
  riskLevel: 'High' | 'Medium' | 'Low' | 'Normal'; // Chỉ chấp nhận 4 giá trị này
  confidence: number;     // Độ tin cậy (%)
  findings: string[];     // Danh sách các phát hiện bệnh lý
  heatmapUrl?: string;    // Link ảnh heatmap (không bắt buộc)
  annotatedUrl?: string;  // Link ảnh khoanh vùng (không bắt buộc)
}

export interface Patient {
  id: string;
  name: string;
  age: number;
  gender: string;
  history?: string;       // Dấu ? nghĩa là có thể không có
  lastExam?: string;      // Dòng này sửa lỗi 'lastExam' màu đỏ
  phoneNumber?: string;
}
