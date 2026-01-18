import React from 'react';
import './App.css'; // Import file CSS mặc định (nếu có)

// Import 2 component chính
// Lưu ý: Đảm bảo bạn đã đặt 2 file này trong thư mục "src/components/"
import DoctorWorkstation from './components/DoctorWorkstation';
import TetAtmosphere from './components/TetAtmosphere';

function App() {
  // 👇 ĐÂY LÀ ID ĐỂ TEST (Lấy từ Swagger API /queue có status="Analyzed")
  // Bạn hãy thay thế dòng này bằng ID thật bạn vừa tạo bên Swagger nhé
  const testExamId = "600bacf7-85e5-4be0-97ae-22b2bbc28189"; 

  return (
    <div className="App" style={{ position: 'relative' }}>
       {/* 1. Hiệu ứng Tết (Đặt đầu tiên để nó phủ lên trên hoặc dưới tùy z-index) */}
       <TetAtmosphere />

       {/* 2. Màn hình làm việc của Bác sĩ */}
       <DoctorWorkstation examId={testExamId} />
    </div>
  );
}

export default App;