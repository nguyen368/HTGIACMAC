import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ImageOverlay from './ImageOverlay';
import imagingApi from '../../../../api/imagingApi'; 
import medicalApi from '../../../../api/medicalApi'; 
import { useAuth } from '../../../../context/AuthContext'; // [MỚI] Import Auth Context
import './ClinicExamDetail.css';

const ClinicExamDetail = () => {
  const { imageId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth(); // [MỚI] Lấy thông tin user (Bác sĩ)

  // State dữ liệu
  const [imageData, setImageData] = useState(null);
  const [loading, setLoading] = useState(true);

  // State Viewer
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });

  // State Form
  const [diagnosis, setDiagnosis] = useState("");
  const [note, setNote] = useState("");

  // Load dữ liệu thật từ API
  useEffect(() => {
    const fetchFullData = async () => {
      if (!imageId) return;
      try {
        setLoading(true);

        // Bước 1: Lấy thông tin ảnh từ Imaging Service
        const imgRes = await imagingApi.getDetail(imageId);
        
        // Bước 2: Lấy thông tin bệnh nhân từ Medical Service
        let patientInfo = { fullName: "Đang tải...", age: "?" };
        // Kiểm tra cả 2 trường hợp viết hoa/thường do backend có thể trả về khác nhau
        const patientId = imgRes.patientId || imgRes.PatientId;

        if (patientId) {
            try {
                const pRes = await medicalApi.getPatientById(patientId);
                if (pRes) {
                    patientInfo = {
                        fullName: pRes.fullName,
                        age: pRes.dateOfBirth ? (new Date().getFullYear() - new Date(pRes.dateOfBirth).getFullYear()) : "??"
                    };
                }
            } catch (err) {
                console.warn("Không tải được thông tin bệnh nhân:", err);
            }
        }

        // Set dữ liệu hiển thị
        setImageData({
            id: imgRes.id,
            url: imgRes.imageUrl,
            patientId: patientId, // Lưu lại ID để dùng khi save
            patientName: patientInfo.fullName,
            age: patientInfo.age,
            aiBbox: [150, 200, 100, 100], // Mock AI Bbox
            aiPrediction: imgRes.aiPrediction || "Chưa có kết quả phân tích"
        });

      } catch (error) {
        console.error("Lỗi tải dữ liệu:", error);
        alert("Không tìm thấy dữ liệu ca khám!");
      } finally {
        setLoading(false);
      }
    };

    fetchFullData();
  }, [imageId]);

  // --- Handlers Viewer ---
  const handleWheel = (e) => {
    e.preventDefault();
    const scaleAdjustment = e.deltaY * -0.001;
    const newScale = Math.min(Math.max(0.5, scale + scaleAdjustment), 4);
    setScale(newScale);
  };

  const handleMouseDown = (e) => {
    setIsDragging(true);
    setStartPos({ x: e.clientX - position.x, y: e.clientY - position.y });
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    setPosition({ x: e.clientX - startPos.x, y: e.clientY - startPos.y });
  };

  const handleMouseUp = () => setIsDragging(false);

  // --- [QUAN TRỌNG] Handlers Form: LƯU THẬT VÀO DB ---
  const handleSave = async () => {
    // 1. Validate dữ liệu
    if (!diagnosis) return alert("Vui lòng chọn kết luận bệnh!");
    if (!imageData?.patientId) return alert("Thiếu thông tin bệnh nhân, không thể lưu!");

    try {
        setLoading(true);

        // 2. Chuẩn bị payload gửi đi
        const payload = {
            patientId: imageData.patientId,
            imageId: imageId,
            diagnosis: diagnosis,
            doctorNotes: note,
            // Lấy ID bác sĩ từ token, nếu không có thì dùng default (hoặc báo lỗi)
            doctorId: user?.id || "00000000-0000-0000-0000-000000000000" 
        };

        // 3. Gọi API Medical
        await medicalApi.saveExamination(payload);

        // 4. Thông báo & Chuyển trang
        alert("✅ Đã lưu kết quả vào hồ sơ bệnh án thành công!");
        navigate('/clinic/upload'); 

    } catch (error) {
        console.error("Lỗi khi lưu:", error);
        // Hiển thị lỗi chi tiết từ Backend nếu có
        const serverMsg = error.response?.data?.message || error.message;
        alert(`❌ Lỗi: ${serverMsg}`);
    } finally {
        setLoading(false);
    }
  };

  if (loading) return <div className="loading-screen">Đang tải dữ liệu ca khám...</div>;

  return (
    <div className="exam-container">
      {/* CỘT TRÁI: VIEWER */}
      <div className="viewer-column" 
           onWheel={handleWheel}
           onMouseDown={handleMouseDown}
           onMouseMove={handleMouseMove}
           onMouseUp={handleMouseUp}
           onMouseLeave={handleMouseUp}
      >
        <div className="image-wrapper" 
             style={{ 
               transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
               cursor: isDragging ? 'grabbing' : 'grab'
             }}
        >
          {imageData?.url && <img src={imageData.url} alt="Medical Scan" className="main-image" />}
          <ImageOverlay bbox={imageData?.aiBbox} />
        </div>

        <div className="zoom-controls">
            <button onClick={() => setScale(scale + 0.5)}><i className="fas fa-plus"></i></button>
            <button onClick={() => setScale(1)}>1:1</button>
            <button onClick={() => setScale(Math.max(0.5, scale - 0.5))}><i className="fas fa-minus"></i></button>
        </div>
      </div>

      {/* CỘT PHẢI: FORM */}
      <div className="form-column">
        <div className="patient-card">
            <h3>Thông tin Bệnh nhân</h3>
            <p><strong>Họ tên:</strong> {imageData?.patientName}</p>
            <p><strong>Tuổi:</strong> {imageData?.age}</p>
            <div className="ai-alert">
                <i className="fas fa-robot"></i> <strong>AI Gợi ý:</strong><br/> 
                {imageData?.aiPrediction}
            </div>
        </div>

        <div className="diagnosis-form">
            <h3>Kết quả Chẩn đoán</h3>
            <div className="form-group">
                <label>Kết luận bệnh:</label>
                <select className="form-select" value={diagnosis} onChange={(e) => setDiagnosis(e.target.value)}>
                    <option value="">-- Chọn chẩn đoán --</option>
                    <option value="Bình thường">Bình thường</option>
                    <option value="Viêm loét giác mạc">Viêm loét giác mạc</option>
                    <option value="Sẹo giác mạc">Sẹo giác mạc</option>
                    <option value="Khác">Khác</option>
                </select>
            </div>
            
            <div className="form-group">
                <label>Ghi chú bác sĩ:</label>
                <textarea 
                    rows="5" 
                    className="form-textarea"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="Nhập chi tiết tình trạng..."
                ></textarea>
            </div>

            <button className="btn-save" onClick={handleSave} disabled={loading}>
                {loading ? "Đang lưu..." : <><i className="fas fa-save"></i> Lưu Kết Quả</>}
            </button>
            <button className="btn-back" onClick={() => navigate('/clinic/upload')}>
                Quay lại
            </button>
        </div>
      </div>
    </div>
  );
};

export default ClinicExamDetail;