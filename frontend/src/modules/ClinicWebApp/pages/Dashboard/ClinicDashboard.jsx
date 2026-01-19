import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import imagingApi from "../../../../api/imagingApi";
import "./ClinicDashboard.css"; // CSS đi kèm

const ClinicDashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  // Clinic ID (Tạm thời hardcode hoặc lấy từ Context/LocalStorage)
  const CURRENT_CLINIC_ID = "d2b51336-6c1c-426d-881e-45051666617a";

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const data = await imagingApi.getStats(CURRENT_CLINIC_ID);
        setStats(data);
      } catch (error) {
        console.error("Lỗi tải dashboard:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  // --- Render Sidebar Giống trang Upload ---
  const renderSidebar = () => (
    <div className="services-nav">
      <div className="nav-group-title">Menu Phòng Khám</div>
      
      <div className="nav-item active">
        <i className="fas fa-home"></i> Trang chủ
      </div>
      
      <div className="nav-item" onClick={() => navigate('/clinic/upload')}>
        <i className="fas fa-cloud-upload-alt"></i> Upload & Khám
      </div>
      
      <div className="nav-item" onClick={() => navigate('/clinic/upload')}>
         <i className="fas fa-database"></i> Kho dữ liệu
      </div>

      <div className="nav-group-title" style={{marginTop: 20}}>Tài khoản</div>
      <div className="nav-item logout" onClick={() => {
          localStorage.removeItem('aura_token');
          window.location.href = '/login';
      }}>
        <i className="fas fa-sign-out-alt"></i> Đăng xuất
      </div>
    </div>
  );

  return (
    <div className="container">
      {/* HEADER */}
      <div className="header">
        <div className="logo-text"><h1>AURA CLINIC DASHBOARD</h1></div>
        <div style={{display: 'flex', gap: '10px', alignItems: 'center'}}>
             <span className="badge success"><i className="fas fa-circle" style={{fontSize: 8}}></i> Online</span>
             <div className="user-avatar">DR</div>
        </div>
      </div>

      <div className="main-content">
        {renderSidebar()}
        
        <div className="services-container">
           {loading ? <div className="loading-text">Đang tải dữ liệu...</div> : (
             <div className="dashboard-content">
                {/* SECTION 1: WELCOME */}
                <div className="welcome-banner">
                    <h2>Xin chào, Bác sĩ! 👋</h2>
                    <p>Hôm nay bạn có <strong>{stats?.recentActivity?.length || 0}</strong> ca chụp mới cần xem xét.</p>
                    <button className="btn-primary-action" onClick={() => navigate('/clinic/upload')}>
                        <i className="fas fa-plus-circle"></i> Tạo ca khám mới
                    </button>
                </div>

                {/* SECTION 2: STATS CARDS */}
                <div className="stats-grid-dashboard">
                    <div className="stat-card-d">
                        <div className="icon-box blue"><i className="fas fa-users"></i></div>
                        <div className="info">
                            <h3>Tổng Bệnh Nhân</h3>
                            <div className="value">128</div> {/* Mock data nếu API chưa có */}
                        </div>
                    </div>
                    <div className="stat-card-d">
                        <div className="icon-box green"><i className="fas fa-images"></i></div>
                        <div className="info">
                            <h3>Tổng Ảnh Chụp</h3>
                            <div className="value">{stats?.summary?.totalScans || 0}</div>
                        </div>
                    </div>
                    <div className="stat-card-d">
                        <div className="icon-box red"><i className="fas fa-exclamation-triangle"></i></div>
                        <div className="info">
                            <h3>Nguy Cơ Cao</h3>
                            <div className="value">5</div> {/* Mock data */}
                        </div>
                    </div>
                </div>

                {/* SECTION 3: RECENT ACTIVITY */}
                <div className="recent-section">
                    <h3 className="section-heading">Hoạt động gần đây</h3>
                    <div className="modern-table-container">
                        <table className="modern-table">
                            <thead>
                                <tr>
                                    <th>Thời gian</th>
                                    <th>Hình ảnh</th>
                                    <th>Trạng thái AI</th>
                                    <th>Hành động</th>
                                </tr>
                            </thead>
                            <tbody>
                                {stats?.recentActivity?.map((act, idx) => (
                                    <tr key={idx}>
                                        <td>{act.uploadedAt}</td>
                                        <td>
                                            <img src={act.imageUrl} alt="scan" className="table-thumb"/>
                                        </td>
                                        <td><span className="badge success">Đã phân tích</span></td>
                                        <td>
                                            <button className="btn-sm" onClick={() => navigate('/clinic/upload')}>
                                                Chi tiết
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                {(!stats?.recentActivity || stats.recentActivity.length === 0) && (
                                    <tr><td colSpan="4" style={{textAlign:'center'}}>Chưa có hoạt động nào</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
             </div>
           )}
        </div>
      </div>
    </div>
  );
};

export default ClinicDashboard;