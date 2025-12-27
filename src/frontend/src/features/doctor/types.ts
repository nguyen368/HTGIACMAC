// Định nghĩa các đối tượng dữ liệu theo chuẩn OOP
export interface AIResult {
  id: string;
  riskScore: number;       // Điểm rủi ro từ 0.0 đến 1.0
  heatmapUrl: string;      // Đường dẫn ảnh bản đồ nhiệt
  detectedRegion: string;  // Vùng phát hiện bất thường
}

export interface Patient {
  id: string;
  name: string;
  age: number;
  gender: string;
  history: string;         // Tiền sử bệnh án
}

// Định nghĩa Input cho Component
export interface DiagnosisProps {
  patient: Patient;
  aiResult: AIResult;
  originalImageUrl: string;
}