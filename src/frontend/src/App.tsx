// File: src/frontend/src/App.tsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// Import Layout và Components
import MainLayout from './MainLayout';
import ImageUpload from './features/doctor/components/ImageUpload';
import DiagnosisViewer from './features/doctor/components/DiagnosisViewer';

// Import Types
import type { Patient, AIResult } from './features/doctor/types'; 

// --- MOCK DATA (Dữ liệu giả để test giao diện bác sĩ) ---
const mockPatient: Patient = {
  id: 'BN-2025-8892',
  name: 'Trần Thị Thu Hà',
  age: 62,
  gender: 'Female',
  history: 'Tiền sử đái tháo đường type 2 (10 năm), Mờ mắt phải',
  lastExam: '2024-12-25',
  phoneNumber: '0912xxxxxx'
};

const mockAIResult: AIResult = {
  riskLevel: 'High', 
  confidence: 96.2,
  findings: [
    'Phát hiện xuất huyết dạng chấm (Dot hemorrhages) khu vực ngoại vi.',
    'Dấu hiệu phù hoàng điểm (Macular Edema).',
    'Tân mạch hóa (Neovascularization) rõ rệt.'
  ],
  heatmapUrl: 'https://placehold.co/600x400/orange/white?text=Heatmap+AI',
  annotatedUrl: 'https://placehold.co/600x400/red/white?text=Vung+Ton+Thuong'
};
// -------------------------------------------------------

const App: React.FC = () => {
  return (
    <Router>
      <Routes>
        {/* Route gốc: Tự động chuyển hướng vào trang upload */}
        <Route path="/" element={<Navigate to="/upload" replace />} />

        {/* Nhóm Route sử dụng MainLayout chung */}
        <Route element={<MainLayout />}>
          
          {/* Nhiệm vụ của TV2: Upload Ảnh */}
          <Route path="/upload" element={<ImageUpload />} />
          
          {/* Nhiệm vụ của TV3: Màn hình bác sĩ */}
          <Route 
            path="/diagnosis" 
            element={<DiagnosisViewer patient={mockPatient} aiResult={mockAIResult} />} 
          />
          
        </Route>

        {/* Có thể thêm Route Login ở ngoài Layout này sau này */}
        {/* <Route path="/login" element={<LoginPage />} /> */}
      </Routes>
    </Router>
  );
};

export default App;