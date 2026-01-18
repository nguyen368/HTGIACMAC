import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from 'react-router-dom'; // [MỚI] Import để chuyển trang
import imagingApi from "../../../../api/imagingApi"; 
import medicalApi from "../../../../api/medicalApi"; 
import "./ClinicUploadPage.css"; 

const ClinicUploadPage = () => {
  const navigate = useNavigate(); // [MỚI] Hook điều hướng

  // --- STATE ---
  const [activeTab, setActiveTab] = useState("upload"); 
  const [activeUploadMode, setActiveUploadMode] = useState("single"); 
  
  const [selectedFile, setSelectedFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [uploadResults, setUploadResults] = useState([]); 
  
  const [stats, setStats] = useState(null); 
  const [patientImages, setPatientImages] = useState([]); 
  const [isLoadingImages, setIsLoadingImages] = useState(false);

  const [patients, setPatients] = useState([]);
  const [selectedPatientId, setSelectedPatientId] = useState("");

  const CURRENT_CLINIC_ID = "d2b51336-6c1c-426d-881e-45051666617a";

  // --- API CALLS ---
  const fetchPatients = useCallback(async () => {
    try {
        const data = await medicalApi.getAllPatients();
        const patientList = Array.isArray(data) ? data : (data.data || []);
        setPatients(patientList);
        if (patientList.length > 0 && !selectedPatientId) {
            setSelectedPatientId(patientList[0].id);
        }
    } catch (error) {
        console.error("Lỗi kết nối Medical Record Service:", error);
    }
  }, [selectedPatientId]);

  const fetchStats = useCallback(async () => {
    try {
      const data = await imagingApi.getStats(CURRENT_CLINIC_ID);
      setStats(data);
    } catch (error) { console.error("Lỗi tải thống kê:", error); }
  }, [CURRENT_CLINIC_ID]);

  const fetchPatientImages = useCallback(async () => {
    if (!selectedPatientId) return;
    setIsLoadingImages(true);
    try {
      const data = await imagingApi.getImagesByPatient(selectedPatientId);
      if (Array.isArray(data)) setPatientImages(data);
      else if (data && data.data) setPatientImages(data.data);
      else setPatientImages([]);
    } catch (error) {
        setPatientImages([]);
    } finally {
        setIsLoadingImages(false);
    }
  }, [selectedPatientId]);

  // --- EFFECTS ---
  useEffect(() => {
    fetchPatients(); 
    fetchStats();
  }, [fetchPatients, fetchStats]);

  useEffect(() => {
    if (activeTab === 'storage' && selectedPatientId) {
        fetchPatientImages();
    }
  }, [activeTab, selectedPatientId, fetchPatientImages]);

  // --- EVENT HANDLERS ---
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) setSelectedFile(file);
  };

  const handleUpload = async () => {
    if (!selectedFile) return alert("Vui lòng chọn file!");
    if (!selectedPatientId) return alert("Vui lòng chọn Bệnh nhân!");

    setLoading(true);
    setUploadResults([]); 
    
    try {
      let res;
      if (activeUploadMode === 'batch') {
          res = await imagingApi.batchUpload(selectedFile, CURRENT_CLINIC_ID, selectedPatientId);
      } else {
          res = await imagingApi.uploadSingle(selectedFile, CURRENT_CLINIC_ID, selectedPatientId);
      }

      // Lấy danh sách kết quả chi tiết
      const details = res.details || res.Details || [];
      setUploadResults(details);

      // --- [LOGIC MỚI] XỬ LÝ CHUYỂN TRANG ---
      // Nếu upload đơn lẻ thành công -> Hỏi chuyển sang trang ExamDetail
      if (activeUploadMode === 'single' && details.length > 0) {
          const item = details[0];
          // Lưu ý: Cần Backend trả về field 'Id' hoặc 'id' trong Details
          const newImageId = item.Id || item.id; 

          if (item.status === 'Success' && newImageId) {
             // Delay nhẹ để UI cập nhật xong bảng kết quả rồi mới hiện confirm
             setTimeout(() => {
                 if (window.confirm("Upload thành công! Chuyển sang màn hình chẩn đoán ngay?")) {
                     navigate(`/clinic/exam/${newImageId}`);
                 }
             }, 100);
          } else if (item.status === 'Success' && !newImageId) {
              console.warn("Upload thành công nhưng không tìm thấy Image ID để chuyển trang. Kiểm tra lại Backend.");
          }
      } else {
          // Nếu là batch upload hoặc không chuyển trang thì chỉ báo thành công
          alert(`✅ ${res.message || "Xử lý thành công!"}`);
      }
      
      fetchStats(); 
      if (activeTab === 'storage') fetchPatientImages();

    } catch (err) {
      console.error(err);
      if (err.response && err.response.data && err.response.data.details) {
         setUploadResults(err.response.data.details);
         alert("⚠️ Có ảnh bị từ chối.");
      } else {
         alert("❌ Lỗi hệ thống: " + (err.message || "Unknown"));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteImage = async (imageId) => {
      if(!window.confirm("Xác nhận xóa ảnh này?")) return;
      try {
          await imagingApi.deleteImage(imageId);
          alert("Đã xóa thành công.");
          fetchPatientImages();
          fetchStats();
      } catch (error) { alert("Lỗi khi xóa: " + error.message); }
  }

  // --- RENDER HELPERS (GIỮ NGUYÊN) ---
  const renderPatientSelector = () => (
      <div style={{
          background: '#e0f2fe', 
          padding: '15px 20px', 
          borderRadius: '12px', 
          marginBottom: '20px', 
          display: 'flex', 
          alignItems: 'center', 
          gap: '15px', 
          border: '1px solid #bae6fd',
          boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
      }}>
          <div style={{fontWeight: '700', color: '#0369a1', minWidth: '160px', display: 'flex', alignItems: 'center', gap: '8px'}}>
              <i className="fas fa-user-injured"></i> Chọn Bệnh Nhân:
          </div>
          <select 
            className="form-select" 
            value={selectedPatientId} 
            onChange={(e) => setSelectedPatientId(e.target.value)}
            style={{
                flex: 1, padding: '10px 15px', borderRadius: '8px', 
                border: '1px solid #cbd5e1', fontSize: '15px', outline: 'none', cursor: 'pointer'
            }}
          >
              <option value="">-- Vui lòng chọn hồ sơ bệnh nhân --</option>
              {patients.map(p => (
                  <option key={p.id} value={p.id}>
                      {p.fullName} - {p.phoneNumber || "SĐT: N/A"} (ID: {p.id.substring(0,6)}...)
                  </option>
              ))}
          </select>
          <div style={{fontSize: '12px', color: '#0284c7', fontStyle: 'italic'}}>
             <i className="fas fa-database"></i> Medical Record DB
          </div>
      </div>
  );

  const renderSidebar = () => {
    const menuItems = [
        { id: "upload", icon: "fa-cloud-upload-alt", label: "Upload & AI" },
        { id: "storage", icon: "fa-database", label: "Kho dữ liệu" },
        { id: "validation", icon: "fa-history", label: "Lịch sử gần đây" },
        { id: "analytics", icon: "fa-chart-pie", label: "Thống kê" },
    ];
    return (
        <div className="services-nav">
            <div className="nav-group-title">Menu Chức năng</div>
            {menuItems.map(item => (
                <div key={item.id} className={`nav-item ${activeTab === item.id ? "active" : ""}`} onClick={() => setActiveTab(item.id)}>
                    <i className={`fas ${item.icon}`}></i> {item.label}
                </div>
            ))}
        </div>
    );
  };

  // --- MAIN RENDER ---
  return (
    <div className="container">
      <div className="header">
        <div className="logo-text"><h1>AURA IMAGING SUITE</h1></div>
        <div style={{display: 'flex', gap: '10px'}}>
             <span className="badge success"><i className="fas fa-link"></i> Integrated System</span>
        </div>
      </div>

      <div className="main-content">
        {renderSidebar()}
        
        <div className="services-container">
            {(activeTab === 'upload' || activeTab === 'storage') && renderPatientSelector()}

            {/* TAB UPLOAD */}
            {activeTab === 'upload' && (
                <div className="service-content active">
                    <div className="section-header-wrapper">
                        <div>
                            <h2 className="section-title-main">Upload Hình ảnh</h2>
                            <p className="section-subtitle">Tải ảnh lên cho bệnh nhân đã chọn</p>
                        </div>
                    </div>

                    <div className="upload-grid">
                        <div className={`upload-card ${activeUploadMode === 'single' ? 'active' : ''}`} onClick={() => setActiveUploadMode('single')}>
                            <div className="upload-card-inner">
                                <div className="upload-card-header">
                                    <div className="upload-card-icon"><i className="fas fa-image"></i></div>
                                    <div className="upload-card-title"><h3>Upload Đơn lẻ</h3><p>.jpg, .png</p></div>
                                </div>
                                <div className="dropzone">
                                    {activeUploadMode === 'single' && <input type="file" onChange={handleFileChange} accept="image/*" />}
                                    <i className="fas fa-cloud-upload-alt dropzone-icon"></i><div>Chọn 1 ảnh</div>
                                </div>
                            </div>
                        </div>
                        <div className={`upload-card ${activeUploadMode === 'batch' ? 'active' : ''}`} onClick={() => setActiveUploadMode('batch')}>
                            <div className="upload-card-inner">
                                <div className="upload-card-header">
                                    <div className="upload-card-icon"><i className="fas fa-file-archive"></i></div>
                                    <div className="upload-card-title"><h3>Upload Zip</h3><p>Nén nhiều ảnh</p></div>
                                </div>
                                <div className="dropzone">
                                    {activeUploadMode === 'batch' && <input type="file" onChange={handleFileChange} accept=".zip" />}
                                    <i className="fas fa-box-open dropzone-icon"></i><div>Chọn file .ZIP</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div style={{textAlign: 'center', marginBottom: '30px'}}>
                        <button className="btn-modern" onClick={handleUpload} disabled={!selectedFile || !selectedPatientId || loading}>
                            {loading ? "Đang xử lý..." : "Bắt đầu Upload"}
                        </button>
                    </div>

                    {uploadResults.length > 0 && (
                        <div className="modern-table-container">
                             <table className="modern-table">
                                <thead><tr><th>Tên file</th><th>Kết quả</th><th>Chi tiết</th><th>Link</th></tr></thead>
                                <tbody>
                                    {uploadResults.map((item, idx) => (
                                        <tr key={idx}>
                                            <td>{item.fileName}</td>
                                            <td>{item.status === 'Success' ? <span className="badge success">Thành công</span> : <span className="badge danger">Từ chối</span>}</td>
                                            <td>{item.aiNote || item.error || item.Error}</td>
                                            <td>{item.url ? <a href={item.url} target="_blank" rel="noreferrer" className="modern-link">Xem</a> : "-"}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {/* TAB STORAGE */}
            {activeTab === 'storage' && (
                <div className="service-content active">
                    <div className="section-header-wrapper">
                        <div>
                            <h2 className="section-title-main">Thư viện ảnh</h2>
                            <p className="section-subtitle">
                                {selectedPatientId 
                                    ? `Bệnh nhân: ${patients.find(p => p.id === selectedPatientId)?.fullName || "Unknown"}` 
                                    : "Vui lòng chọn bệnh nhân ở trên"}
                            </p>
                        </div>
                        <button className="btn-modern" onClick={fetchPatientImages}><i className="fas fa-sync"></i> Refresh</button>
                    </div>

                    {isLoadingImages ? ( <div style={{textAlign: 'center', padding: '50px'}}>Đang tải dữ liệu...</div> ) 
                    : patientImages.length === 0 ? ( <div style={{textAlign: 'center', padding: '50px', color: '#666'}}>Chưa có ảnh nào.</div> ) 
                    : (
                        <div className="image-gallery-grid">
                            {patientImages.map((img) => (
                                <div key={img.id} className="gallery-item">
                                    <div className="gallery-thumb"><img src={img.imageUrl} alt="Scan" loading="lazy" /></div>
                                    <div className="gallery-info">
                                        <div className="gallery-filename">{img.fileName || "Ảnh đáy mắt"}</div>
                                        <div className="gallery-date"><i className="far fa-clock"></i> {img.uploadedAt}</div>
                                        <div className="gallery-actions">
                                            <a href={img.imageUrl} target="_blank" rel="noreferrer" className="modern-link">Full HD</a>
                                            <button className="btn-danger" onClick={() => handleDeleteImage(img.id)}>Xóa</button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* TAB VALIDATION */}
            {activeTab === 'validation' && (
                <div className="service-content active">
                     <h3>Hoạt động gần đây (Toàn hệ thống)</h3>
                     <div className="modern-table-container">
                        <table className="modern-table">
                            <thead><tr><th>Thời gian</th><th>Ảnh</th><th>Trạng thái</th><th>Hành động</th></tr></thead>
                            <tbody>
                                {stats?.recentActivity?.map((act, idx) => (
                                    <tr key={idx}>
                                        <td>{act.uploadedAt}</td>
                                        <td><img src={act.imageUrl} alt="thumb" style={{width: 40, height: 40, objectFit: 'cover', borderRadius: 4}}/></td>
                                        <td><span className="badge success">Đã lưu</span></td>
                                        <td><a href={act.imageUrl} target="_blank" rel="noreferrer" className="modern-link">Xem</a></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                     </div>
                </div>
            )}

            {/* TAB ANALYTICS */}
            {activeTab === 'analytics' && (
                <div className="service-content active">
                    <h3>Thống kê hệ thống</h3>
                    <div className="stats-grid">
                        <div className="stat-card">
                            <div className="stat-icon blue"><i className="fas fa-database"></i></div>
                            <div className="stat-info"><h4>Tổng ảnh lưu trữ</h4><div className="stat-value">{stats?.summary?.totalScans || 0}</div></div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-icon green"><i className="fas fa-check-circle"></i></div>
                            <div className="stat-info"><h4>Trạng thái</h4><div style={{fontSize: 14, color: '#666'}}>Hoạt động ổn định</div></div>
                        </div>
                    </div>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default ClinicUploadPage;