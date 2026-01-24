import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import medicalApi from "../../../../api/medicalApi";
import Sidebar from "../../../../components/Sidebar/Sidebar"; // Cập nhật đường dẫn chuẩn
import { ClinicStats, Examination } from "../../../../types/medical";
import "./ClinicDashboard.css";

const ClinicDashboard: React.FC = () => {
    const navigate = useNavigate();
    const [stats, setStats] = useState<ClinicStats | null>(null);
    const [loading, setLoading] = useState<boolean>(true);

    const CURRENT_CLINIC_ID = "d2b51336-6c1c-426d-881e-45051666617a";

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                setLoading(true);
                const data = await medicalApi.getStats(CURRENT_CLINIC_ID);
                setStats(data);
            } catch (error) {
                console.error("Lỗi tải dashboard:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchDashboardData();
    }, [CURRENT_CLINIC_ID]);

    const formatDate = (dateString: string) => {
        if (!dateString) return "---";
        return new Date(dateString).toLocaleDateString('vi-VN', {
            hour: '2-digit',
            minute: '2-digit',
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    };

    return (
        <div className="clinic-dashboard-layout" style={{ display: 'flex' }}>
            <Sidebar />
            <main className="main-content-wrapper" style={{ marginLeft: '250px', width: 'calc(100% - 250px)', minHeight: '100vh', background: '#f4f7f9' }}>
                <div className="dashboard-header-bar" style={{ background: '#fff', padding: '15px 30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                    <div className="logo-text">
                        <h2 style={{ margin: 0, color: '#2c3e50', fontSize: '20px' }}>🏥 AURA CLINIC CENTER</h2>
                    </div>
                    <div className="user-info-group" style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                        <span className="badge-status success">● Hệ thống Online</span>
                        <div style={{ background: '#3498db', color: 'white', width: '35px', height: '35px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                            AD
                        </div>
                    </div>
                </div>

                <div className="container-fluid" style={{ padding: '30px' }}>
                    {loading ? (
                        <div style={{ textAlign: 'center', marginTop: '100px' }}>Đang tải...</div>
                    ) : (
                        <div className="dashboard-content">
                            <div className="welcome-banner-modern">
                                <div className="banner-text">
                                    <h2>Xin chào Quản trị viên! 👋</h2>
                                    <p>Hiện có <strong>{stats?.summary?.pendingExams || 0}</strong> bệnh nhân đang trong hàng đợi.</p>
                                </div>
                                <div className="banner-actions">
                                    <button className="btn-primary-action" onClick={() => navigate('/hardware-simulator')}>Giả lập ca mới</button>
                                </div>
                            </div>

                            <div className="stats-grid-dashboard">
                                <div className="stat-card-d blue"><h3>Bệnh nhân</h3><div className="value">{stats?.summary?.totalPatients || 0}</div></div>
                                <div className="stat-card-d green"><h3>Lượt chụp</h3><div className="value">{stats?.summary?.totalScans || 0}</div></div>
                                <div className="stat-card-d red"><h3>Nguy cơ cao</h3><div className="value">{stats?.summary?.highRiskCases || 0}</div></div>
                            </div>

                            <div className="recent-section-card">
                                <h3 className="section-heading">🕒 Hoạt động khám bệnh gần đây</h3>
                                <div className="table-responsive">
                                    <table className="modern-table">
                                        <thead>
                                            <tr>
                                                <th>Ngày thực hiện</th>
                                                <th>Ảnh</th>
                                                <th>Bệnh nhân</th>
                                                <th>Phân tích AI</th>
                                                <th>Hành động</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {stats?.recentActivity?.map((act: Examination) => (
                                                <tr key={act.id}>
                                                    <td>{formatDate(act.examDate)}</td>
                                                    <td><img src={act.imageUrl} alt="scan" className="table-thumb-circle" width="40" height="40"/></td>
                                                    <td><strong>{act.patientName || "Chưa xác định"}</strong></td>
                                                    <td>{act.status}</td>
                                                    <td>
                                                        <button onClick={() => navigate(`/doctor/exam/${act.id}`)}>Chi tiết</button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};

export default ClinicDashboard;