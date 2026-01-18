import React, { useState, useEffect } from 'react';
import './DoctorWorkstation.css'; // Import file CSS mới

const DoctorWorkstation = ({ examId }) => {
  const [exam, setExam] = useState(null);
  const [doctorNotes, setDoctorNotes] = useState('');
  const [finalDiagnosis, setFinalDiagnosis] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Cấu hình URL Backend
  const API_BASE_URL = "http://localhost:5002/api/examinations";

  useEffect(() => {
    if (!examId) return;
    setLoading(true);
    fetch(`${API_BASE_URL}/${examId}`)
      .then(res => {
        if (!res.ok) throw new Error("Không thể kết nối đến máy chủ hoặc không tìm thấy hồ sơ.");
        return res.json();
      })
      .then(data => {
        setExam(data);
        setFinalDiagnosis(data.diagnosisResult || "");
        setLoading(false);
      })
      .catch(err => {
        console.error("Lỗi:", err);
        setError(err.message);
        setLoading(false);
      });
  }, [examId]);

  const handleVerify = async () => {
    const payload = { doctorNotes, finalDiagnosis };
    try {
      const response = await fetch(`${API_BASE_URL}/${examId}/verify`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const result = await response.json();
      if (response.ok) {
        alert("✅ Đã duyệt hồ sơ thành công!");
        setExam(prev => ({ ...prev, status: result.newStatus }));
      } else {
        alert("⚠️ Lỗi: " + (result.detail || "Không thể duyệt hồ sơ"));
      }
    } catch (error) {
      alert("❌ Lỗi kết nối server");
    }
  };

  if (loading) return <div className="loading-screen">Connecting to Medical Record System...</div>;
  if (error) return <div className="error-screen">⚠️ System Error: {error}</div>;
  if (!exam) return <div className="empty-screen">Please select a patient record.</div>;

  const isVerified = exam.status === 'Verified';

  return (
    <div className="medical-workstation-container">
      
      {/* === PANEL TRÁI: ẢNH Y TẾ === */}
      <div className="image-viewer-panel">
        <div className="image-header">
          <span>👁️ Ảnh chụp đáy mắt gốc</span>
        </div>
        <div className="image-container-inner">
          {exam.imageUrl ? (
            <img src={exam.imageUrl} alt="Medical Scan" className="main-medical-image" />
          ) : (
            <div className="no-image-placeholder">Không có dữ liệu hình ảnh</div>
          )}
        </div>
      </div>

      {/* === PANEL PHẢI: THÔNG TIN & CHẨN ĐOÁN === */}
      <div className="data-panel">
        
        {/* HEADER & THÔNG TIN BỆNH NHÂN */}
        <div className="panel-header">
          <div>
            <h1>Doctor Workstation</h1>
            <p className="subtitle">Hệ thống hỗ trợ chẩn đoán hình ảnh AURA</p>
          </div>
          <div className={`status-badge status-${exam.status.toLowerCase()}`}>
            {exam.status}
          </div>
        </div>

        <div className="medical-card patient-info-card">
          <div className="card-row">
            <div>
              <label>Bệnh nhân ID:</label>
              <strong>{exam.patientId ? exam.patientId.substring(0, 8).toUpperCase() : 'N/A'}</strong>
            </div>
            <div>
              <label>Họ và tên:</label>
              <strong className="patient-name">{exam.patientName}</strong>
            </div>
            <div>
              <label>Ngày khám:</label>
              <strong>{new Date(exam.examDate).toLocaleDateString('vi-VN')}</strong>
            </div>
          </div>
        </div>

        {/* KẾT QUẢ AI */}
        <div className="medical-card ai-result-card">
          <div className="card-title">
            <span>🤖 Phân tích AI (Model M4)</span>
          </div>
          <div className="ai-content">
            <p className="ai-diagnosis">
              {exam.diagnosisResult || "Chưa có kết quả phân tích từ AI."}
            </p>
            <p className="disclaimer">
              *Kết quả này chỉ mang tính tham khảo. Vui lòng dựa trên chuyên môn để đưa ra kết luận cuối cùng.
            </p>
          </div>
        </div>

        {/* FORM CHẨN ĐOÁN CỦA BÁC SĨ */}
        <div className={`medical-card diagnosis-form-card ${isVerified ? 'verified-mode' : ''}`}>
          <div className="card-title">
            <span>👨‍⚕️ Kết luận chuyên môn</span>
          </div>
          
          <div className="form-group">
            <label htmlFor="finalDiagnosis">Chẩn đoán xác định:</label>
            <input 
              id="finalDiagnosis"
              type="text" 
              className="medical-input"
              value={finalDiagnosis}
              onChange={(e) => setFinalDiagnosis(e.target.value)}
              placeholder="Nhập kết luận bệnh học..."
              disabled={isVerified}
            />
          </div>

          <div className="form-group">
            <label htmlFor="doctorNotes">Ghi chú / Chỉ định điều trị:</label>
            <textarea 
              id="doctorNotes"
              rows="5"
              className="medical-textarea"
              value={doctorNotes}
              onChange={(e) => setDoctorNotes(e.target.value)}
              placeholder="Nhập ghi chú chi tiết, đơn thuốc hoặc hướng điều trị tiếp theo..."
              disabled={isVerified}
            />
          </div>

          {!isVerified ? (
            <button className="primary-button verify-button" onClick={handleVerify}>
              Xác nhận & Duyệt hồ sơ
            </button>
          ) : (
            <div className="verified-banner">
              ✅ Hồ sơ đã được duyệt và đóng băng.
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default DoctorWorkstation;