import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
// @ts-ignore
import medicalApi from "../../../../api/medicalApi";
import { useAuth } from "../../../../context/AuthContext";
import { useSignalR } from "../../../../context/SignalRContext"; 
import "./ClinicDashboard.css";

const ClinicDashboard: React.FC = () => {
    const navigate = useNavigate();
    const { user } = useAuth(); // LẤY THÔNG TIN USER TỪ TOKEN
    const { lastNotification } = useSignalR(); 
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState<boolean>(true);

    const fetchDashboardData = useCallback(async () => {
        // TỰ ĐỘNG: Lấy clinicId của user đang đăng nhập
        const currentUser = user as any;
        const clinicId = currentUser?.clinicId || currentUser?.ClinicId || "";

        if (!clinicId) {
            console.warn("Không tìm thấy ClinicId. Vui lòng kiểm tra lại cấu hình tài khoản.");
            setLoading(false);
            return;
        }

        try {
            const data: any = await medicalApi.getStats(clinicId);
            
            // Mapping dữ liệu linh hoạt (PascalCase từ C# và camelCase từ JSON)
            const summary = data?.summary || data?.Summary || {};
            const recent = data?.recentActivity || data?.RecentActivity || [];

            setStats({
                totalPatients: summary.totalPatients ?? summary.TotalPatients ?? 0,
                totalScans: summary.totalScans ?? summary.TotalScans ?? 0,
                pendingExams: summary.pendingExams ?? summary.PendingExams ?? 0,
                highRiskCases: summary.highRiskCases ?? summary.HighRiskCases ?? 0,
                recentActivity: recent
            });
        } catch (error) { 
            console.error("Lỗi Dashboard:", error); 
        } finally { 
            setLoading(false); 
        }
    }, [user]);

    // Luồng khởi tạo: Khi user có dữ liệu thì fetch data ngay
    useEffect(() => { 
        if (user) fetchDashboardData(); 
    }, [user, fetchDashboardData]);

    // Luồng Real-time: Khi AI xử lý xong hoặc có ca mới, Dashboard tự load lại (Không cần F5)
    useEffect(() => {
        if (lastNotification) {
            const notifyType = lastNotification.type || lastNotification.Type;
            if (['NEW_EXAM', 'AI_RESULT', 'AiFinished'].includes(notifyType)) {
                console.log("--> [SignalR] Dashboard đang cập nhật dữ liệu mới...");
                fetchDashboardData(); 
            }
        }
    }, [lastNotification, fetchDashboardData]);

    if (loading) return (
        <div className="dashboard-loading-container">
            <div className="spinner"></div>
            <p>Đang kết nối dữ liệu AURA...</p>
        </div>
    );

    return (
        <div className="dashboard-wrapper-inner">
            <h2 className="page-title"><i className="fas fa-chart-line"></i> Dashboard Hệ Thống</h2>
            
            <div className="dashboard-content">
                {/* 1. Khu vực Thống kê */}
                <div className="stats-grid-dashboard">
                    <div className="stat-card-d blue">
                        <h3>Bệnh nhân</h3>
                        <div className="value">{stats?.totalPatients}</div>
                    </div>
                    <div className="stat-card-d green">
                        <h3>Lượt chụp</h3>
                        <div className="value">{stats?.totalScans}</div>
                    </div>
                    <div className="stat-card-d yellow">
                        <h3>Chờ duyệt</h3>
                        <div className="value">{stats?.pendingExams}</div>
                    </div>
                    <div className="stat-card-d red">
                        <h3>Nguy cơ cao</h3>
                        <div className="value">{stats?.highRiskCases}</div>
                    </div>
                </div>

                {/* 2. Khu vực Hoạt động gần đây */}
                <div className="recent-section-card">
                    <h3>🕒 Hoạt động gần đây (Dữ liệu thời gian thực)</h3>
                    <table className="modern-table">
                        <thead>
                            <tr>
                                <th>Ngày</th>
                                <th>Bệnh nhân</th>
                                <th>Trạng thái</th>
                                <th>Thao tác</th>
                            </tr>
                        </thead>
                        <tbody>
                            {stats?.recentActivity?.length > 0 ? (
                                stats.recentActivity.map((act: any) => (
                                    <tr key={act.id || act.Id}>
                                        <td>{new Date(act.examDate || act.ExamDate).toLocaleDateString('vi-VN')}</td>
                                        <td><strong>{act.patientName || act.PatientName}</strong></td>
                                        <td>
                                            <span className={`badge-status ${
                                                (act.status || act.Status) === 'Verified' ? 'success' : 
                                                (act.status || act.Status) === 'Analyzed' ? 'info' : 'warning'
                                            }`}>
                                                {act.status || act.Status}
                                            </span>
                                        </td>
                                        <td>
                                            {/* SỬA ĐƯỜNG DẪN: Đổi từ /clinic/examinations/ thành /clinic/exam/ để khớp với AppRoutes.tsx */}
                                            <button 
                                                className="btn-detail" 
                                                onClick={() => navigate(`/clinic/exam/${act.id || act.Id}`)}
                                            >
                                                Xem Chi tiết
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={4} className="empty-row">Chưa có hoạt động nào trong hôm nay.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default ClinicDashboard;