import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from 'react-router-dom';
import imagingApi from "../../../../api/imagingApi"; 
import medicalApi from "../../../../api/medicalApi"; 
import authApi from "../../../../api/authApi"; 
import "./ClinicUploadPage.css"; 

const ClinicUploadPage = () => {
  const navigate = useNavigate();

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

  const fetchPatients = useCallback(async () => {
    try {
        const res = await authApi.getAllPatients();
        // Bóc tách dữ liệu từ lớp Wrapper Result<T> của Backend
        const data = res.value || res.data?.value || res;
        const patientList = Array.isArray(data) ? data : [];
        setPatients(patientList);
        if (patientList.length > 0 && !selectedPatientId) {
            setSelectedPatientId(patientList[0].id);
        }
    } catch (error) {
        console.error("Lỗi lấy danh sách bệnh nhân:", error);
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
      const images = Array.isArray(data) ? data : (data.data || []);
      setPatientImages(images);
    } catch (error) {
        setPatientImages([]);
    } finally {
        setIsLoadingImages(false);
    }
  }, [selectedPatientId]);

  useEffect(() => {
    fetchPatients(); 
    fetchStats();
  }, [fetchPatients, fetchStats]);

  useEffect(() => {
    if (activeTab === 'storage' && selectedPatientId) {
        fetchPatientImages();
    }
  }, [activeTab, selectedPatientId, fetchPatientImages]);

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
      const details = res.details || res.Details || [];
      setUploadResults(details);
      if (activeUploadMode === 'single' && details.length > 0) {
          const item = details[0];
          const newImageId = item.Id || item.id; 
          if (item.status === 'Success' && newImageId) {
              setTimeout(() => {
                  if (window.confirm("Upload thành công! Chuyển sang màn hình chẩn đoán ngay?")) {
                      navigate(`/clinic/exam/${newImageId}`);
                  }
              }, 100);
          }
      } else { alert(`✅ Xử lý thành công!`); }
      fetchStats(); 
    } catch (err) {
      alert("❌ Lỗi hệ thống: " + (err.message || "Unknown"));
    } finally { setLoading(false); }
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

  const renderPatientSelector = () => (
      <div style={{ background: '#e0f2fe', padding: '15px 20px', borderRadius: '12px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '15px', border: '1px solid #bae6fd' }}>
          <div style={{fontWeight: '700', color: '#0369a1', minWidth: '160px'}}>
              <i className="fas fa-user-injured"></i> Chọn Bệnh Nhân:
          </div>
          <select className="form-select" value={selectedPatientId} onChange={(e) => setSelectedPatientId(e.target.value)} style={{ flex: 1, padding: '10px', borderRadius: '8px' }}>
              <option value="">-- Danh sách bệnh nhân (Identity) --</option>
              {patients.map(p => (
                  <option key={p.id} value={p.id}>{p.fullName || p.userName} - {p.email}</option>
              ))}
          </select>
          <div style={{fontSize: '12px', color: '#0284c7', fontStyle: 'italic'}}><i className="fas fa-link"></i> Identity 5001</div>
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

  return (
    <div className="container">
      <div className="header"><div className="logo-text"><h1>AURA IMAGING SUITE</h1></div></div>
      <div className="main-content">
        {renderSidebar()}
        <div className="services-container">
            {(activeTab === 'upload' || activeTab === 'storage') && renderPatientSelector()}
            {activeTab === 'upload' && (
                <div className="service-content active">
                    <h2 className="section-title-main">Upload Hình ảnh</h2>
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
                    <div style={{textAlign: 'center', marginBottom: '30px'}}><button className="btn-modern" onClick={handleUpload} disabled={!selectedFile || !selectedPatientId || loading}>{loading ? "Đang xử lý..." : "Bắt đầu Upload"}</button></div>
                    {uploadResults.length > 0 && (
                        <div className="modern-table-container">
                             <table className="modern-table">
                                <thead><tr><th>Tên file</th><th>Kết quả</th><th>Chi tiết</th><th>Hành động</th></tr></thead>
                                <tbody>
                                    {uploadResults.map((item, idx) => (
                                        <tr key={idx}>
                                            <td>{item.fileName}</td>
                                            <td>{item.status === 'Success' ? <span className="badge success">Thành công</span> : <span className="badge danger">Lỗi</span>}</td>
                                            <td>{item.aiNote || item.error}</td>
                                            <td>{item.status === 'Success' && <button className="btn-sm" onClick={() => navigate(`/clinic/exam/${item.Id || item.id}`)}>Chi tiết</button>}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}
            {activeTab === 'storage' && (
                <div className="service-content active">
                    <div className="section-header-wrapper"><h2 className="section-title-main">Thư viện ảnh</h2><button className="btn-modern" onClick={fetchPatientImages}><i className="fas fa-sync"></i> Refresh</button></div>
                    {isLoadingImages ? <div>Đang tải...</div> : (
                        <div className="image-gallery-grid">
                            {patientImages.map((img) => (
                                <div key={img.id} className="gallery-item">
                                    <div className="gallery-thumb"><img src={img.imageUrl} alt="Scan" /></div>
                                    <div className="gallery-info"><div className="gallery-filename">{img.fileName}</div><div className="gallery-actions"><button className="btn-danger" onClick={() => handleDeleteImage(img.id)}>Xóa</button></div></div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
            {activeTab === 'validation' && (
                <div className="service-content active"><h3>Hoạt động gần đây</h3><div className="modern-table-container"><table className="modern-table"><thead><tr><th>Thời gian</th><th>Ảnh</th><th>Trạng thái</th></tr></thead><tbody>{stats?.recentActivity?.map((act, idx) => (<tr key={idx}><td>{act.uploadedAt}</td><td><img src={act.imageUrl} alt="thumb" style={{width: 40, borderRadius: 4}}/></td><td><span className="badge success">Đã lưu</span></td></tr>))}</tbody></table></div></div>
            )}
            {activeTab === 'analytics' && (
                <div className="service-content active"><h3>Thống kê hệ thống</h3><div className="stats-grid"><div className="stat-card"><h4>Tổng ảnh</h4><div className="stat-value">{stats?.summary?.totalScans || 0}</div></div></div></div>
            )}
        </div>
      </div>
    </div>
  );
};

export default ClinicUploadPage;