import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom'; // Thêm useParams để lấy ID từ URL
import './DoctorWorkstation.css';

const DoctorWorkstation = () => { // Bỏ props examId cứng
  const { id } = useParams(); // Lấy ID từ URL: /clinic/exam/:id
  const navigate = useNavigate();

  const [exam, setExam] = useState(null);
  const [doctorNotes, setDoctorNotes] = useState('');
  const [finalDiagnosis, setFinalDiagnosis] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const API_BASE_URL = "http://localhost:5002/api/examinations";

  useEffect(() => {
    // Nếu không có ID trên URL -> Đây là trang Dashboard tổng
    if (!id) {
        setLoading(false);
        return;
    }

    // Nếu có ID -> Tải chi tiết ca khám
    setLoading(true);
    fetch(`${API_BASE_URL}/${id}`)
      .then(res => {
        if (!res.ok) throw new Error("Không tìm thấy hồ sơ.");
        return res.json();
      })
      .then(data => {
        setExam(data);
        setFinalDiagnosis(data.diagnosisResult || "");
        setDoctorNotes(data.doctorNotes || "");
        setLoading(false);
      })
      .catch(err => {
        console.error("Lỗi:", err);
        setError(err.message);
        setLoading(false);
      });
  }, [id]);

  const handleVerify = async () => {
    if (!id) return;
    const payload = { doctorNotes, finalDiagnosis };
    try {
      const response = await fetch(`${API_BASE_URL}/${id}/verify`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const result = await response.json();
      if (response.ok) {
        alert("✅ Đã duyệt hồ sơ thành công!");
        setExam(prev => ({ ...prev, status: 'Verified' })); // Cập nhật UI ngay
      } else {
        alert("⚠️ Lỗi: " + (result.detail || "Không thể duyệt hồ sơ"));
      }
    } catch (error) {
      alert("❌ Lỗi kết nối server");
    }
  };

  // --- MÀN HÌNH DASHBOARD TỔNG (KHI KHÔNG CÓ ID) ---
  if (!id) {
      return (
        <div className="doctor-workstation-container" style={{ padding: '40px', textAlign: 'center' }}>
            <h1>👨‍⚕️ Bàn Làm Việc Bác Sĩ</h1>
            <p>Chào mừng bạn quay trở lại. Vui lòng chọn tác vụ:</p>
            <div style={{ marginTop: '30px', display: 'flex', gap: '20px', justifyContent: 'center' }}>
                <button 
                    onClick={() => navigate('/clinic/upload')}
                    style={{ padding: '15px 30px', fontSize: '18px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}
                >
                    📸 Upload Ca Khám Mới
                </button>
            </div>
        </div>
      );
  }

  // --- CÁC TRẠNG THÁI LOADING / ERROR ---
  if (loading) return <div className="loading-screen">Connecting to Medical Record System...</div>;
  if (error) return <div className="error-screen">⚠️ System Error: {error}</div>;
  if (!exam) return <div className="empty-screen">Hồ sơ không tồn tại.</div>;

  const isVerified = exam.status === 'Verified';

  // --- MÀN HÌNH CHI TIẾT CA KHÁM ---
  return (
    <div className="medical-workstation-container">
      {/* PANEL TRÁI: ẢNH */}
      <div className="image-viewer-panel">
        <div className="image-header"><span>👁️ Ảnh chụp đáy mắt gốc</span></div>
        <div className="image-container-inner">
          {exam.imageUrl ? (
            <img src={exam.imageUrl} alt="Medical Scan" className="main-medical-image" />
          ) : (
            <div className="no-image-placeholder">Không có dữ liệu hình ảnh</div>
          )}
        </div>
      </div>

      {/* PANEL PHẢI: THÔNG TIN */}
      <div className="data-panel">
        <div className="panel-header">
          <div>
            <h1>Doctor Workstation</h1>
            <p className="subtitle">Mã hồ sơ: {id.substring(0,8)}</p>
          </div>
          <div className={`status-badge status-${exam.status?.toLowerCase()}`}>{exam.status}</div>
        </div>

        <div className="medical-card patient-info-card">
            <div className="card-row">
                <div><label>Bệnh nhân:</label><strong>{exam.patientName || "Khách vãng lai"}</strong></div>
                <div><label>Ngày khám:</label><strong>{new Date(exam.examDate).toLocaleDateString('vi-VN')}</strong></div>
            </div>
        </div>

        {/* FORM CHẨN ĐOÁN */}
        <div className={`medical-card diagnosis-form-card ${isVerified ? 'verified-mode' : ''}`}>
          <div className="card-title"><span>👨‍⚕️ Kết luận chuyên môn</span></div>
          
          <div className="form-group">
            <label>Chẩn đoán xác định:</label>
            <input 
              type="text" className="medical-input"
              value={finalDiagnosis} onChange={(e) => setFinalDiagnosis(e.target.value)}
              placeholder="Nhập kết luận bệnh học..." disabled={isVerified}
            />
          </div>

          <div className="form-group">
            <label>Ghi chú / Chỉ định:</label>
            <textarea 
              rows="5" className="medical-textarea"
              value={doctorNotes} onChange={(e) => setDoctorNotes(e.target.value)}
              placeholder="Nhập hướng điều trị..." disabled={isVerified}
            />
          </div>

          {!isVerified ? (
            <button className="primary-button verify-button" onClick={handleVerify}>Xác nhận & Duyệt hồ sơ</button>
          ) : (
            <div className="verified-banner">✅ Hồ sơ đã được duyệt.</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DoctorWorkstation;