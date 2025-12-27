import React from 'react';
import DiagnosisViewer from './features/doctor/components/DiagnosisViewer';
import type { Patient, AIResult } from './features/doctor/types';

// Dữ liệu giả lập
const mockPatient: Patient = {
  id: 'BN-2025-8892',
  name: 'Nguyễn Văn An',
  age: 58,
  gender: 'Nam',
  history: 'Tiểu đường Type 2 (10 năm), Tăng huyết áp nhẹ.',
};

const mockAIResult: AIResult = {
  id: 'RES-9921',
  riskScore: 0.85,
  detectedRegion: 'Võng mạc trung tâm',
  heatmapUrl: '/eye.jpg' // Đảm bảo bạn đã có file eye.jpg trong thư mục public
};

function App() {
  // Trả về Component trực tiếp, KHÔNG bọc trong thẻ div nào khác
  return (
    <DiagnosisViewer 
      patient={mockPatient}
      aiResult={mockAIResult}
      originalImageUrl="/eye.jpg"
    />
  );
}

export default App;