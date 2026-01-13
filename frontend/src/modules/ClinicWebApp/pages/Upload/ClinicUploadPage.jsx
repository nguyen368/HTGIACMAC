// src/modules/ClinicWebApp/pages/Upload/ClinicUploadPage.jsx
import React, { useState, useEffect } from "react";
import imagingApi from "../../../../api/imagingApi"; 
import "./ClinicUploadPage.css"; // Import file CSS ở Bước 1

const ClinicUploadPage = () => {
  // --- 1. STATE QUẢN LÝ GIAO DIỆN ---
  const [activeTab, setActiveTab] = useState("upload"); // Tab hiện tại: 'upload', 'validation', 'storage'...
  const [activeUploadMode, setActiveUploadMode] = useState("single"); // 'single' hoặc 'batch'
  
  // --- 2. STATE DỮ LIỆU ---
  const [selectedFile, setSelectedFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]); // Kết quả upload
  const [stats, setStats] = useState(null);   // Số liệu thống kê từ API

  // ID Giả lập (Sau này lấy từ Login User)
  const TEST_CLINIC_ID = "d2b51336-6c1c-426d-881e-45051666617a";
  const TEST_PATIENT_ID = "a3b51336-6c1c-426d-881e-45051666617b";

  // --- 3. GỌI API LẤY THỐNG KÊ (Khi mới vào trang) ---
  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const data = await imagingApi.getStats(TEST_CLINIC_ID);
      setStats(data);
    } catch (error) {
      console.error("Lỗi tải thống kê:", error);
    }
  };

  // --- 4. XỬ LÝ UPLOAD ---
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) setSelectedFile(file);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    setLoading(true);
    
    try {
      // Logic Upload: Nếu là Batch (Zip) thì gọi API Batch, nếu Single thì gọi API Single
      let res;
      if (activeUploadMode === 'batch') {
          // Gọi API Batch Upload (Service 2)
          res = await imagingApi.batchUpload(selectedFile, TEST_CLINIC_ID, TEST_PATIENT_ID);
          setResults(res.details || []); // Lưu danh sách file trả về để hiện bảng
      } else {
          // Gọi API Single Upload (Service 1) - Tạm thời gọi Batch cho demo nếu chưa có API Single
          alert("Đang xử lý ảnh đơn... (Demo)");
          res = { message: "Upload thành công (Demo)" };
      }

      alert(`✅ ${res.message}`);
      fetchStats(); // Refresh lại số liệu Dashboard
    } catch (err) {
      alert("❌ Lỗi: " + (err.response?.data || err.message));
    } finally {
      setLoading(false);
    }
  };

  // --- 5. RENDER GIAO DIỆN (Chia nhỏ function cho gọn) ---

  // Phần Menu bên trái (Sidebar Navigation)
  const renderSidebar = () => (
    <div className="services-nav">
      {[
        { id: "upload", icon: "fa-cloud-upload-alt", label: "Upload & Quản lý" },
        { id: "validation", icon: "fa-robot", label: "Kiểm duyệt AI" },
        { id: "storage", icon: "fa-database", label: "Lưu trữ Đám mây" },
        { id: "metadata", icon: "fa-info-circle", label: "Quản lý Metadata" },
        { id: "analytics", icon: "fa-chart-bar", label: "Thống kê Dashboard" },
      ].map((item) => (
        <div
          key={item.id}
          className={`nav-item ${activeTab === item.id ? "active" : ""}`}
          onClick={() => setActiveTab(item.id)}
        >
          <i className={`fas ${item.icon}`}></i>
          {item.label}
        </div>
      ))}
    </div>
  );

  // Tab 1: Upload (Giao diện chính)
  const renderUploadTab = () => (
    <div className="service-content active">
      <div className="service-header">
        <div>
          <h2 className="service-title">
            <i className="fas fa-cloud-upload-alt"></i> Upload & Quản lý Hình ảnh
          </h2>
          <p className="service-subtitle">Tải lên và xử lý hình ảnh y tế tự động</p>
        </div>
        <div className="service-stats">
          <div className="stat-item">
            {/* SỐ LIỆU THẬT TỪ DATABASE */}
            <div className="stat-value">{stats?.summary?.totalScans || 0}</div>
            <div className="stat-label">Tổng ảnh đã xử lý</div>
          </div>
        </div>
      </div>

      {/* Khu vực chọn chế độ Single / Batch */}
      <div className="upload-sections">
        {/* Box 1: Single Upload */}
        <div 
            className={`upload-section ${activeUploadMode === 'single' ? 'active' : ''}`}
            onClick={() => setActiveUploadMode('single')}
        >
          <div className="upload-header">
            <div className="upload-icon"><i className="fas fa-file-image"></i></div>
            <h3 className="upload-title">Upload Đơn lẻ</h3>
          </div>
          <div className="upload-zone">
             <i className="fas fa-file-image zone-icon"></i>
             <div className="zone-text">Chọn ảnh .JPG, .PNG</div>
             {activeUploadMode === 'single' && (
                 <input type="file" onChange={handleFileChange} accept="image/*" />
             )}
          </div>
        </div>

        {/* Box 2: Batch Upload */}
        <div 
            className={`upload-section ${activeUploadMode === 'batch' ? 'active' : ''}`}
            onClick={() => setActiveUploadMode('batch')}
        >
          <div className="upload-header">
            <div className="upload-icon"><i className="fas fa-file-archive"></i></div>
            <h3 className="upload-title">Upload Hàng loạt (ZIP)</h3>
          </div>
          <div className="upload-zone">
             <i className="fas fa-box-open zone-icon"></i>
             <div className="zone-text">Chọn file .ZIP</div>
             {activeUploadMode === 'batch' && (
                 <input type="file" onChange={handleFileChange} accept=".zip" />
             )}
          </div>
        </div>
      </div>

      {/* Nút Upload Chính */}
      <div style={{textAlign: 'center', marginTop: '20px'}}>
          <button className="btn btn-primary" onClick={handleUpload} disabled={!selectedFile || loading}>
              {loading ? <><i className="fas fa-spinner fa-spin"></i> Đang xử lý...</> : <><i className="fas fa-upload"></i> Bắt đầu Upload & Phân tích</>}
          </button>
      </div>

      {/* Hiển thị kết quả sau khi upload (Nếu có) */}
      {results.length > 0 && (
          <div className="results-section active" style={{marginTop: '30px'}}>
              <h3 className="section-title">Kết quả vừa xử lý</h3>
              <table className="results-table">
                  <thead>
                      <tr>
                          <th>Tên file</th>
                          <th>Trạng thái</th>
                          <th>Link ảnh</th>
                          <th>Ghi chú</th>
                      </tr>
                  </thead>
                  <tbody>
                      {results.map((item, idx) => (
                          <tr key={idx}>
                              <td>{item.fileName}</td>
                              <td>
                                  <span className={`status-badge ${item.status === 'Success' ? 'success' : 'error'}`}>
                                      {item.status}
                                  </span>
                              </td>
                              <td>
                                  {item.url ? <a href={item.url} target="_blank" rel="noreferrer">Xem ảnh</a> : '-'}
                              </td>
                              <td>{item.error || 'Đã lưu DB'}</td>
                          </tr>
                      ))}
                  </tbody>
              </table>
          </div>
      )}
    </div>
  );

  // Tab 5: Analytics Dashboard (Dùng dữ liệu thật)
  const renderAnalyticsTab = () => (
    <div className="service-content active">
        <h2 className="service-title"><i className="fas fa-chart-bar"></i> Thống kê Dashboard</h2>
        
        <div className="stats-grid" style={{marginTop: '20px'}}>
            <div className="stat-card">
                <div className="stat-number">{stats?.summary?.totalScans || 0}</div>
                <div className="stat-desc">Tổng ca chụp</div>
            </div>
            {/* Các thẻ khác có thể thêm vào sau */}
        </div>

        <div className="dashboard-card large" style={{marginTop: '20px'}}>
            <div className="card-header">
                <h4 className="card-title">Hoạt động gần đây (Lấy từ DB)</h4>
            </div>
            <ul className="activity-list">
                {stats?.recentActivity?.map((act, idx) => (
                    <li key={idx} className="activity-item">
                        <div className="activity-icon upload"><i className="fas fa-image"></i></div>
                        <div className="activity-details">
                            <div className="activity-title">Ảnh mới được tải lên</div>
                            <div className="activity-time">{act.uploadedAt} • <a href={act.imageUrl} target="_blank" rel="noreferrer">Xem</a></div>
                        </div>
                    </li>
                ))}
                {(!stats?.recentActivity || stats.recentActivity.length === 0) && <p>Chưa có dữ liệu.</p>}
            </ul>
        </div>
    </div>
  );

  // --- RENDER CHÍNH ---
  return (
    <div className="container">
      {/* Header */}
      <div className="header">
        <div className="logo">
          <div className="logo-icon"></div>
          <div className="logo-text">
            <h1>AURA SCREENING</h1>
            <p>Phân hệ Chẩn đoán hình ảnh (Imaging Service)</p>
          </div>
        </div>
      </div>

      <div className="main-content">
        {/* Sidebar Nav */}
        {renderSidebar()}

        {/* Nội dung chính thay đổi theo Tab */}
        <div className="services-container">
            {activeTab === 'upload' && renderUploadTab()}
            {activeTab === 'analytics' && renderAnalyticsTab()}
            
            {/* Các tab khác (Validation, Storage...) bạn có thể copy HTML tĩnh vào đây để hiển thị minh họa */}
            {(activeTab === 'validation' || activeTab === 'storage' || activeTab === 'metadata') && (
                <div style={{textAlign: 'center', padding: '50px'}}>
                    <h3>Tính năng này đang được tích hợp với Backend...</h3>
                    <p>Vui lòng thử tính năng <b>Upload</b> và <b>Thống kê</b> trước.</p>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default ClinicUploadPage;