import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

// 1. Import Component Bác sĩ của bạn
import DoctorWorkstation from '../modules/ClinicWebApp/pages/components/DoctorWorkstation';

// ⚠️ LƯU Ý: Nếu nhóm bạn đã có trang Login hoặc Home, hãy import lại ở đây
// Ví dụ: import LoginPage from '../pages/LoginPage';

const AppRoutes = () => {
  // ID hồ sơ bệnh án dùng để test (Lấy từ Swagger)
  // Bạn có thể thay đổi ID này bất cứ lúc nào để test hồ sơ khác
  const testExamId = "600bacf7-85e5-4be0-97ae-22b2bbc28189";

  return (
    <Routes>
      {/* ======================================================== */}
      {/* PHẦN 1: ROUTE CỦA BẠN (DOCTOR UI) */}
      {/* ======================================================== */}
      {/* Truy cập: http://localhost:3000/doctor */}
      <Route 
        path="/doctor" 
        element={<DoctorWorkstation examId={testExamId} />} 
      />

      {/* ======================================================== */}
      {/* PHẦN 2: ROUTE CỦA NHÓM (HÃY GIỮ LẠI NẾU CÓ) */}
      {/* ======================================================== */}
      {/* Nếu file cũ của nhóm có các dòng <Route path="/login"... />, hãy paste vào dưới đây */}
      
      {/* <Route path="/login" element={<LoginPage />} /> */}


      {/* ======================================================== */}
      {/* PHẦN 3: ĐIỀU HƯỚNG MẶC ĐỊNH */}
      {/* ======================================================== */}
      {/* Tạm thời: Khi vào trang chủ (localhost:3000), tự động nhảy sang /doctor để test */}
      <Route path="/" element={<Navigate to="/doctor" replace />} />
      
      {/* Trang 404 (Nếu gõ linh tinh) */}
      <Route path="*" element={<div style={{padding: '50px', textAlign: 'center'}}>404 - Trang không tồn tại</div>} />
    </Routes>
  );
};

export default AppRoutes;