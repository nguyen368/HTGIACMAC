import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import medicalApi from '../../../../api/medicalApi'; 
import { useAuth } from '../../../../context/AuthContext'; 
import './ClinicExamDetail.css';

const ClinicExamDetail = () => {
  const { id } = useParams(); // Lấy Examination ID từ URL
  const navigate = useNavigate();
  const { user } = useAuth(); 

  // State dữ liệu
  const [exam, setExam] = useState(null);
  const [loading, setLoading] = useState(true);

  // State Viewer
  const [scale, setScale] = useState(1);
  const [showHeatmap, setShowHeatmap] = useState(true); // Mặc định bật AI Heatmap

  // State Form Input
  const [diagnosis, setDiagnosis] = useState("");
  const [notes, setNotes] = useState("");

  // Load dữ liệu từ Backend
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Gọi API lấy chi tiết (Bao gồm thông tin BN, Ảnh, Kết quả AI)
        const data = await medicalApi.getExaminationDetail(id);
        
        setExam(data);
        
        // Điền sẵn dữ liệu nếu đã có (hoặc lấy từ AI gợi ý)
        if (data.diagnosisResult) {
            setDiagnosis(data.diagnosisResult); // Nếu bác sĩ đã lưu trước đó
        } else if (data.aiDiagnosis) {
            // Nếu chưa, gợi ý từ AI (nhưng không set cứng, để bác sĩ chọn)
            // setDiagnosis(data.aiDiagnosis); 
        }

        if (data.doctorNotes) setNotes(data.doctorNotes);

      } catch (error) {
        console.error("Lỗi tải dữ liệu:", error);
        alert("Không tìm thấy dữ liệu ca khám!");
        navigate('/clinic/queue'); // Quay về danh sách chờ
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchData();
  }, [id, navigate]);

  // --- Handlers Viewer ---
  const handleZoomIn = () => setScale(prev => Math.min(prev + 0.2, 3));
  const handleZoomOut = () => setScale(prev => Math.max(prev - 0.2, 0.5));
  const handleResetZoom = () => setScale(1);

  // --- Handlers Action ---
  const handleSave = async () => {
    if (!diagnosis) return alert("Vui lòng chọn kết luận bệnh!");

    // Xác nhận nếu kết quả khác AI (CDS Logic)
    if (exam.aiRiskLevel === 'High' && diagnosis === 'Bình thường') {
        if (!window.confirm("⚠️ CẢNH BÁO AI:\nCa này có nguy cơ cao, bạn chắc chắn muốn kết luận 'Bình thường'?")) {
            return;
        }
    }

    try {
        setLoading(true);
        const payload = {
            finalDiagnosis: diagnosis,
            doctorNotes: notes,
            doctorId: user?.id || "00000000-0000-0000-0000-000000000000"
        };

        // Gọi API Verify
        await medicalApi.verifyDiagnosis(id, payload);

        alert("✅ Đã lưu kết quả & Gửi thông báo cho bệnh nhân!");
        navigate('/clinic/queue'); 

    } catch (error) {
        console.error("Lỗi lưu:", error);
        alert("Lỗi: " + (error.response?.data?.Error || error.message));
    } finally {
        setLoading(false);
    }
  };

  const handlePrintReport = async () => {
      try {
          const report = await medicalApi.getReportData(id);
          console.log("Report Data:", report);
          alert(`🖨️ Đang in phiếu kết quả...\n(Traceability: ${report.technicalTraceability.systemName})`);
          // Logic mở cửa sổ in PDF ở đây
      } catch (err) {
          alert("Không thể tải dữ liệu báo cáo.");
      }
  };

  if (loading) return <div className="loading-screen">Đang tải dữ liệu ca khám...</div>;
  if (!exam) return null;

  return (
    <div className="exam-container">
      {/* CỘT TRÁI: IMAGE VIEWER (CDS) */}
      <div className="viewer-column">
        <div className="toolbar">
            <button onClick={handleZoomIn}><i className="fas fa-plus"></i></button>
            <button onClick={handleResetZoom}>1:1</button>
            <button onClick={handleZoomOut}><i className="fas fa-minus"></i></button>
            <div className="vr mx-2"></div>
            <div className="form-check form-switch d-inline-block">
                <input 
                    className="form-check-input" 
                    type="checkbox" 
                    checked={showHeatmap} 
                    onChange={e => setShowHeatmap(e.target.checked)} 
                    disabled={!exam.heatmapUrl}
                />
                <label className="form-check-label text-white ms-2">AI Heatmap</label>
            </div>
        </div>

        <div className="image-wrapper" style={{ transform: `scale(${scale})` }}>
          {/* Layer 1: Ảnh gốc */}
          <img src={exam.imageUrl} alt="Original" className="main-image" />
          
          {/* Layer 2: Heatmap (Đè lên) */}
          {showHeatmap && exam.heatmapUrl && (
            <img 
                // URL trả về từ Backend là đường dẫn tương đối (/static/...), cần thêm domain API Gateway
                src={`http://localhost:80${exam.heatmapUrl}`} 
                alt="Heatmap" 
                className="heatmap-overlay" 
                style={{ opacity: 0.6, mixBlendMode: 'multiply' }}
            />
          )}
        </div>
      </div>

      {/* CỘT PHẢI: FORM CHẨN ĐOÁN */}
      <div className="form-column">
        <div className="patient-card">
            <h3>Hồ sơ: {exam.patientName}</h3>
            <p className="mb-1"><strong>Tuổi:</strong> {exam.age} | <strong>Giới tính:</strong> {exam.gender}</p>
            <p className="text-muted"><small>Ngày chụp: {new Date(exam.examDate).toLocaleString()}</small></p>
            
            {/* AI Result Box */}
            <div className={`ai-result-box ${exam.aiRiskLevel === 'High' ? 'danger' : 'safe'}`}>
                <h5>🤖 Phân tích AI:</h5>
                <p><strong>Đánh giá:</strong> {exam.aiDiagnosis || "Chưa có kết quả"}</p>
                <p><strong>Mức độ:</strong> {exam.aiRiskLevel} (Score: {exam.aiRiskScore}%)</p>
            </div>
        </div>

        <div className="diagnosis-form">
            <div className="form-group">
                <label className="fw-bold">Kết luận chuyên môn:</label>
                <select className="form-select" value={diagnosis} onChange={(e) => setDiagnosis(e.target.value)} disabled={exam.status === 'Verified'}>
                    <option value="">-- Chọn chẩn đoán --</option>
                    <option value="Bình thường">Bình thường</option>
                    <option value="Võng mạc tiểu đường (DR)">Võng mạc tiểu đường (DR)</option>
                    <option value="Thoái hóa điểm vàng (AMD)">Thoái hóa điểm vàng (AMD)</option>
                    <option value="Tăng nhãn áp (Glaucoma)">Tăng nhãn áp (Glaucoma)</option>
                    <option value="Đục thủy tinh thể">Đục thủy tinh thể</option>
                    <option value="Khác">Khác</option>
                </select>
            </div>
            
            <div className="form-group mt-3">
                <label className="fw-bold">Ghi chú / Y lệnh:</label>
                <textarea 
                    className="form-control"
                    rows="4"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Nhập ghi chú chi tiết..."
                    disabled={exam.status === 'Verified'}
                ></textarea>
            </div>

            <div className="action-buttons mt-4">
                {exam.status !== 'Verified' ? (
                    <button className="btn-save w-100 mb-2" onClick={handleSave} disabled={loading}>
                        <i className="fas fa-check-circle"></i> Xác nhận & Hoàn tất
                    </button>
                ) : (
                    <div className="alert alert-success text-center">
                        <i className="fas fa-lock"></i> Hồ sơ đã được duyệt
                    </div>
                )}
                
                <button className="btn-print w-100" onClick={handlePrintReport}>
                    <i className="fas fa-print"></i> In Phiếu Kết Quả
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};

export default ClinicExamDetail;