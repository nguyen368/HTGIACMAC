import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import imagingApi from "../../../../api/imagingApi";
import "./ClinicDashboard.css"; // Bắt buộc phải tạo file này

const ClinicDashboard = () => {
  const navigate = useNavigate();
  // Khởi tạo state đúng cấu trúc trả về từ Backend
  const [stats, setStats] = useState({
      summary: { totalScans: 0, highRiskCases: 0, pendingCases: 0 },
      recentActivity: []
  });
  const [loading, setLoading] = useState(true);

  // Clinic ID (Tạm thời hardcode, sau này lấy từ AuthContext)
  const CURRENT_CLINIC_ID = "d2b51336-6c1c-426d-881e-45051666617a";

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const response = await imagingApi.getStats(CURRENT_CLINIC_ID);
        // Kiểm tra xem axios trả về data bọc trong data hay trả trực tiếp
        const realData = response.data || response;
        setStats(realData);
      } catch (error) {
        console.error("Lỗi tải dashboard:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

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
    <div className="dashboard-container">
      {/* HEADER */}
      <div className="dashboard-header">
        <div className="logo-text"><h1>AURA CLINIC DASHBOARD</h1></div>
        <div style={{display: 'flex', gap: '10px', alignItems: 'center'}}>
             <span className="badge success"><i className="fas fa-circle" style={{fontSize: 8}}></i> Online</span>
             <div className="user-avatar">DR</div>
        </div>
      </div>

      <div className="main-layout">
        {renderSidebar()}
        
        <div className="content-area">
           {loading ? <div className="loading-text">Đang tải dữ liệu hệ thống...</div> : (
             <div className="dashboard-content">
                {/* SECTION 1: WELCOME */}
                <div className="welcome-banner">
                    <div>
                        <h2>Xin chào, Bác sĩ! 👋</h2>
                        <p>Hệ thống AURA sẵn sàng hỗ trợ chẩn đoán.</p>
                    </div>
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
                            <div className="value">--</div> {/* Placeholder */}
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
                            <div className="value">{stats?.summary?.highRiskCases || 0}</div>
                        </div>
                    </div>
                </div>

                {/* SECTION 3: RECENT ACTIVITY */}
                <div className="recent-section">
                    <h3 className="section-heading">Hoạt động gần đây (Real-time)</h3>
                    <div className="modern-table-container">
                        <table className="modern-table">
                            <thead>
                                <tr>
                                    <th>Thời gian</th>
                                    <th>Hình ảnh</th>
                                    <th>Trạng thái</th>
                                    <th>Hành động</th>
                                </tr>
                            </thead>
                            <tbody>
                                {stats?.recentActivity?.length > 0 ? (
                                    stats.recentActivity.map((act, idx) => (
                                        <tr key={idx}>
                                            <td>{act.uploadedAt}</td>
                                            <td>
                                                <img src={act.imageUrl} alt="scan" className="table-thumb"/>
                                            </td>
                                            <td><span className="badge success">{act.status}</span></td>
                                            <td>
                                                <button className="btn-sm" onClick={() => navigate('/clinic/upload')}>
                                                    Xem lại
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr><td colSpan="4" style={{textAlign:'center', padding: '20px'}}>Chưa có dữ liệu ảnh nào.</td></tr>
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