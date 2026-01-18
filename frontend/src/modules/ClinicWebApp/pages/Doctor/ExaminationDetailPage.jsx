import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import medicalApi from "../../../../api/medicalApi";
import "../Upload/ClinicUploadPage.css"; 

const ExaminationDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [exam, setExam] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Form input
  const [diagnosis, setDiagnosis] = useState("");
  const [doctorNotes, setDoctorNotes] = useState("");
  const [aiOverlay, setAiOverlay] = useState(false);

  useEffect(() => {
    const fetchExamData = async () => {
        try {
            // GỌI API THẬT
            const data = await medicalApi.getExaminationById(id);
            setExam(data);
            
            // Nếu đã có kết quả cũ, điền sẵn vào form
            if (data.diagnosisResult) setDiagnosis(data.diagnosisResult);
            if (data.doctorNotes) setDoctorNotes(data.doctorNotes);
            
        } catch (err) {
            alert("Không tìm thấy dữ liệu ca khám này trong Database!");
            navigate("/clinic/doctor-queue");
        } finally {
            setLoading(false);
        }
    };
    fetchExamData();
  }, [id, navigate]);

  const handleSubmit = async () => {
      if(!diagnosis) return alert("Vui lòng chọn kết luận bệnh!");
      
      try {
          const payload = {
              diagnosisResult: diagnosis,
              doctorNotes: doctorNotes
          };
          
          // GỌI API LƯU VÀO DB
          await medicalApi.updateDiagnosis(id, payload);
          
          alert("✅ Đã lưu kết quả vào Database thành công!");
          navigate("/clinic/doctor-queue"); 
      } catch (err) {
          console.error(err);
          alert("Lỗi khi lưu: " + (err.response?.data || err.message));
      }
  };

  if (loading) return <div style={{textAlign:'center', padding: 50}}>Đang tải dữ liệu từ Server...</div>;
  if (!exam) return null;

  return (
    <div className="container" style={{padding: '0 20px 20px', height: '85vh', display: 'flex', flexDirection: 'column'}}>
      {/* HEADER */}
      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15, background: 'white', padding: 15, borderRadius: 12, boxShadow: '0 2px 4px rgba(0,0,0,0.05)'}}>
          <div>
              <button className="btn-danger" style={{padding: '5px 10px', marginRight: 10}} onClick={() => navigate(-1)}>
                  <i className="fas fa-arrow-left"></i> Quay lại
              </button>
              <span style={{fontWeight: 'bold', fontSize: 18}}>
                  Bệnh nhân: {exam.patientName || exam.PatientName} ({exam.age || exam.Age} tuổi)
              </span>
          </div>
          <div>
              <span className={`badge ${exam.status === 'Verified' ? 'success' : 'warning'}`}>
                  {exam.status === 'Verified' ? 'Đã có kết quả' : 'Đang chờ khám'}
              </span>
          </div>
      </div>

      <div style={{display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20, flex: 1, overflow: 'hidden'}}>
          
          {/* CỘT TRÁI: ẢNH TỪ DB */}
          <div style={{background: 'black', borderRadius: 12, position: 'relative', overflow: 'hidden', display: 'flex', justifyContent: 'center', alignItems: 'center'}}>
              {exam.imageUrl ? (
                  <img 
                    src={exam.imageUrl} 
                    alt="Fundus Scan" 
                    style={{
                        maxWidth: '100%', 
                        maxHeight: '100%', 
                        objectFit: 'contain', 
                        filter: aiOverlay ? 'contrast(1.4) sepia(0.2)' : 'none' 
                    }} 
                  />
              ) : (
                  <div style={{color: '#999', textAlign: 'center'}}>
                      <i className="fas fa-image" style={{fontSize: 40, marginBottom: 10}}></i><br/>
                      Chưa có ảnh chụp trong hồ sơ này.<br/>
                      Vui lòng yêu cầu KTV chụp ảnh.
                  </div>
              )}
              
              {/* Toolbar */}
              <div style={{position: 'absolute', bottom: 20, left: '50%', transform: 'translateX(-50%)', background: 'rgba(255,255,255,0.9)', padding: '10px 20px', borderRadius: 30, display: 'flex', gap: 15}}>
                  <button className="btn-modern" style={{borderRadius: 20}} onClick={() => setAiOverlay(!aiOverlay)} disabled={!exam.imageUrl}>
                      {aiOverlay ? "Tắt AI" : "Bật AI Gợi ý"}
                  </button>
              </div>
          </div>

          {/* CỘT PHẢI: FORM CHẨN ĐOÁN */}
          <div style={{background: 'white', padding: 25, borderRadius: 12, display: 'flex', flexDirection: 'column', gap: 20, overflowY: 'auto'}}>
              <h3 style={{borderBottom: '1px solid #eee', paddingBottom: 10, color: '#3b82f6'}}>Kết luận Lâm sàng</h3>
              
              <div>
                  <label style={{fontWeight: 'bold', display: 'block', marginBottom: 5}}>Chẩn đoán:</label>
                  <select className="form-control" value={diagnosis} onChange={e => setDiagnosis(e.target.value)} style={{width: '100%', padding: 12}}>
                      <option value="">-- Chọn bệnh lý --</option>
                      <option value="Normal">Bình thường (Normal)</option>
                      <option value="DR_Mild">Võng mạc tiểu đường (Nhẹ)</option>
                      <option value="DR_Severe">Võng mạc tiểu đường (Nặng)</option>
                      <option value="Glaucoma">Tăng nhãn áp (Glaucoma)</option>
                      <option value="Cataract">Đục thủy tinh thể</option>
                      <option value="Other">Khác</option>
                  </select>
              </div>

              <div style={{flex: 1}}>
                  <label style={{fontWeight: 'bold', display: 'block', marginBottom: 5}}>Ghi chú / Y lệnh:</label>
                  <textarea 
                    className="form-control" 
                    placeholder="Nhập ghi chú chi tiết..." 
                    value={doctorNotes}
                    onChange={e => setDoctorNotes(e.target.value)}
                    style={{width: '100%', padding: 10, height: '200px', resize: 'none'}}
                  ></textarea>
              </div>

              <button className="btn-modern" onClick={handleSubmit} style={{width: '100%', padding: 15, justifyContent: 'center'}}>
                  <i className="fas fa-save"></i> Lưu Kết Quả
              </button>
          </div>
      </div>
    </div>
  );
};

export default ExaminationDetailPage;