import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import medicalApi from '../../../../api/medicalApi';
import './DoctorWorkstation.css';

const DoctorWorkstation = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [queue, setQueue] = useState([]);
  const [exam, setExam] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [doctorNotes, setDoctorNotes] = useState('');
  const [finalDiagnosis, setFinalDiagnosis] = useState('');
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load danh sách và thống kê
  useEffect(() => {
    loadInitialData();
  }, [searchTerm]);

  // Load chi tiết khi ID URL thay đổi
  useEffect(() => {
    if (id) loadExaminationDetail(id);
  }, [id]);

  const loadInitialData = async () => {
    try {
      const [queueRes, statsRes] = await Promise.all([
        medicalApi.getQueue(searchTerm),
        medicalApi.getStats()
      ]);
      setQueue(queueRes);
      setStats(statsRes);
      setLoading(false);
    } catch (err) {
      console.error("Lỗi tải dữ liệu:", err);
      setLoading(false);
    }
  };

  const loadExaminationDetail = async (examId) => {
    try {
      const data = await medicalApi.getExaminationById(examId);
      setExam(data);
      setFinalDiagnosis(data.diagnosisResult || "");
      setDoctorNotes(data.doctorNotes || "");
    } catch (err) {
      alert("Không thể tải chi tiết ca khám.");
    }
  };

  const handleVerify = async () => {
    if (!id) return;
    try {
      await medicalApi.verifyExamination(id, { 
        doctorNotes, 
        finalDiagnosis 
      });
      alert("✅ Đã duyệt hồ sơ thành công!");
      loadInitialData(); // Refresh danh sách
      setExam(prev => ({ ...prev, status: 'Verified' }));
    } catch (error) {
      alert("❌ Lỗi: " + (error.response?.data?.detail || "Không thể kết nối server"));
    }
  };

  if (loading) return <div className="loading-screen">Đang kết nối hệ thống y tế...</div>;

  return (
    <div className="medical-workstation-container">
      {/* SIDEBAR DANH SÁCH (FR-13, FR-18) */}
      <div className="workstation-sidebar">
        <div className="sidebar-header">
          <h3>Hàng chờ khám</h3>
          <input 
            type="text" 
            placeholder="Tìm tên bệnh nhân..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
        <div className="queue-list">
          {queue.map(item => (
            <div 
              key={item.id} 
              className={`queue-item ${id === item.id ? 'active' : ''}`}
              onClick={() => navigate(`/clinic/exam/${item.id}`)}
            >
              <div className="item-info">
                <strong>{item.patientName}</strong>
                <span>{new Date(item.examDate).toLocaleDateString()}</span>
              </div>
              <span className={`badge status-${item.status.toLowerCase()}`}>{item.status}</span>
            </div>
          ))}
        </div>
      </div>

      {/* PANEL CHI TIẾT (FR-14, 15, 16) */}
      <div className="main-content-panel">
        {!id ? (
          <div className="dashboard-summary">
            <h1>👨‍⚕️ Tổng quan công việc</h1>
            {stats && (
              <div className="stats-grid">
                <div className="stat-card"><h3>{stats.totalPatients}</h3><p>Bệnh nhân</p></div>
                <div className="stat-card"><h3>{stats.pendingExams}</h3><p>Chờ khám</p></div>
                <div className="stat-card warning"><h3>{stats.highRiskCases}</h3><p>Nguy cơ cao</p></div>
              </div>
            )}
            <button className="primary-button" onClick={() => navigate('/clinic/upload')}>+ Tiếp nhận ca mới</button>
          </div>
        ) : !exam ? (
          <div className="empty-screen">Đang tải chi tiết...</div>
        ) : (
          <div className="exam-detail-view">
            <div className="view-header">
              <h2>Ca khám: {exam.patientName}</h2>
              <span className={`status-banner status-${exam.status.toLowerCase()}`}>{exam.status}</span>
            </div>

            <div className="work-grid">
              <div className="image-section">
                <div className="image-card">
                  <div className="card-header">Ảnh đáy mắt gốc</div>
                  <img src={exam.imageUrl || 'https://via.placeholder.com/400'} alt="Scan" />
                </div>
                {exam.aiDiagnosis && (
                    <div className="ai-insight">
                        <strong>🤖 AI Gợi ý:</strong> {exam.aiDiagnosis}
                    </div>
                )}
              </div>

              <div className="form-section">
                <div className="medical-card">
                  <label>Chẩn đoán chuyên môn (FR-15):</label>
                  <select 
                    value={finalDiagnosis} 
                    onChange={(e) => setFinalDiagnosis(e.target.value)}
                    className="medical-select"
                    disabled={exam.status === 'Verified'}
                  >
                    <option value="">-- Chọn chẩn đoán --</option>
                    <option value="Bình thường">Bình thường</option>
                    <option value="NPDR nhẹ">NPDR nhẹ</option>
                    <option value="NPDR trung bình">NPDR trung bình</option>
                    <option value="NPDR nặng">NPDR nặng</option>
                    <option value="PDR">PDR (Nguy hiểm)</option>
                  </select>

                  <label>Ghi chú & Chỉ định (FR-16):</label>
                  <textarea 
                    value={doctorNotes} 
                    onChange={(e) => setDoctorNotes(e.target.value)}
                    rows="6"
                    className="medical-textarea"
                    disabled={exam.status === 'Verified'}
                    placeholder="Nhập ghi chú lâm sàng..."
                  />

                  {exam.status !== 'Verified' ? (
                    <button className="verify-btn" onClick={handleVerify}>Xác nhận & Hoàn tất</button>
                  ) : (
                    <div className="verified-msg">✅ Hồ sơ đã được bác sĩ ký duyệt</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DoctorWorkstation;