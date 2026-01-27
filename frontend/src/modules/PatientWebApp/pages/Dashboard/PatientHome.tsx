import React, { useEffect, useState } from 'react';
// @ts-ignore
import imagingApi from '../../../../api/imagingApi';
import './PatientHome.css'; // Giữ lại file CSS cũ để hứng các style cơ bản

const PatientHome: React.FC<any> = ({ user, setTab }) => {
    const [recentExams, setRecentExams] = useState<any[]>([]);
    // [THÊM] normalCount vào state
    const [stats, setStats] = useState({ totalScans: 0, highRiskCount: 0, normalCount: 0 });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            if (!user) return;
            const pId = user.id || user.userId || (user as any).sub || "";
            try {
                const data: any = await imagingApi.getImagesByPatient(pId);
                const list = Array.isArray(data) ? data : (data.data || []);
                
                if (list.length > 0) {
                    const sorted = list.sort((a: any, b: any) => {
                        // Fallback nhiều trường hợp ngày tháng
                        const dateA = new Date(a.createdAt || a.uploadedAt || a.CreatedAt || 0).getTime();
                        const dateB = new Date(b.createdAt || b.uploadedAt || b.CreatedAt || 0).getTime();
                        return dateB - dateA;
                    });

                    setRecentExams(sorted.slice(0, 5)); // Chỉ lấy 5 cái mới nhất nếu cần hiển thị
                    
                    // Tính toán logic Nguy cơ cao / Bình thường
                    let highRisk = 0;
                    list.forEach((e: any) => {
                        const result = e.predictionResult || e.PredictionResult || "";
                        const status = Number(e.status || e.Status);
                        // Nếu đã hoàn thành (status=2) và kết quả có chữ "Nguy cơ" hoặc "Bệnh"
                        if (status === 2 && (result.includes("Nguy cơ") || result.includes("Bệnh") || result.includes("High"))) {
                            highRisk++;
                        }
                    });

                    const total = list.length;
                    const normal = total - highRisk; // Số còn lại là bình thường hoặc đang xử lý

                    setStats({
                        totalScans: total,
                        highRiskCount: highRisk,
                        normalCount: normal
                    });
                }
            } catch (err) { console.error(err); } 
            finally { setTimeout(() => setLoading(false), 500); }
        };
        fetchData();
    }, [user]);

    if (loading) return <div className="dashboard-container" style={{padding: '40px', textAlign: 'center', color: '#666'}}>🚀 Đang tải dữ liệu tổng quan...</div>;

    // --- CSS INLINE CHO GIAO DIỆN MỚI (Không cần sửa file .css ngoài) ---
    const modernCardStyle: React.CSSProperties = {
        background: 'white',
        padding: '25px',
        borderRadius: '16px',
        boxShadow: '0 10px 30px -10px rgba(0,0,0,0.08)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        border: '1px solid #f0f2f5',
        transition: 'transform 0.2s ease',
    };

    const iconBoxStyle: React.CSSProperties = {
        width: '60px', height: '60px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', marginBottom: '15px'
    };

    return (
        <div className="dashboard-container animate-fade-in" style={{ maxWidth: '1200px', margin: '0 auto', paddingBottom: '40px' }}>
            {/* 1. BANNER CHÀO MỪNG */}
            <div className="welcome-section" style={{ marginBottom: '40px', textAlign: 'left' }}>
                <h1 style={{ fontSize: '2.5rem', color: '#1e293b', marginBottom: '10px' }}>
                    Xin chào, {user?.fullName || 'Bệnh nhân'}! <span style={{ display: 'inline-block', animation: 'wave 2s infinite', transformOrigin: '70% 70%' }}>👋</span>
                </h1>
                <p style={{ fontSize: '1.1rem', color: '#64748b' }}>Hệ thống AURA sẵn sàng hỗ trợ bạn theo dõi sức khỏe thị lực.</p>
            </div>

            {/* 2. NÚT CHẨN ĐOÁN MỚI (ĐÃ ĐƯỢC NÂNG CẤP THÀNH HERO CARD) */}
            <div 
                className="hero-cta-card hover-scale"
                onClick={() => setTab('upload')}
                style={{
                    background: 'linear-gradient(135deg, #0061ff 0%, #60efff 100%)',
                    borderRadius: '24px',
                    padding: '40px',
                    color: 'white',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '40px',
                    boxShadow: '0 20px 40px -15px rgba(0,97,255,0.5)',
                    position: 'relative',
                    overflow: 'hidden'
                }}
            >
                <div style={{ zIndex: 2 }}>
                    <h2 style={{ fontSize: '2rem', fontWeight: '800', marginBottom: '15px', display:'flex', alignItems:'center', gap:'15px' }}>
                        <i className="fas fa-camera-retro"></i> Chẩn Đoán Mới Ngay
                    </h2>
                    <p style={{ fontSize: '1.2rem', opacity: 0.95, maxWidth: '500px' }}>
                        Sử dụng công nghệ AI tiên tiến để phân tích ảnh đáy mắt và nhận kết quả chỉ trong vài giây.
                    </p>
                    <button style={{ marginTop: '25px', padding: '12px 30px', background: 'white', color: '#0061ff', border: 'none', borderRadius: '30px', fontWeight: 'bold', fontSize: '1rem', cursor:'pointer', boxShadow: '0 5px 15px rgba(0,0,0,0.1)' }}>
                        Bắt đầu ngay ➜
                    </button>
                </div>
                {/* Icon trang trí nền */}
                <div style={{ position: 'absolute', right: '-50px', top: '-20px', fontSize: '180px', opacity: 0.15, transform: 'rotate(-20deg)' }}>
                    🚀
                </div>
            </div>

            {/* 3. KHUNG THÔNG TIN TỔNG QUAN (3 CỘT) */}
            <h3 style={{ color: '#334155', marginBottom: '20px', fontSize: '1.5rem' }}>📊 Tổng quan hồ sơ y tế</h3>
            <div className="stats-grid-modern" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '25px' }}>
                
                {/* Card 1: Tổng số */}
                <div className="stat-card-modern hover-up" style={{...modernCardStyle, borderLeft: '6px solid #3b82f6'}}>
                    <div style={{display:'flex', justifyContent:'space-between'}}>
                        <div>
                            <p style={{ color: '#64748b', fontSize: '1.1rem', fontWeight:'600', marginBottom:'5px' }}>Tổng lần khám</p>
                            <h2 style={{ fontSize: '3rem', color: '#1e293b', margin: 0 }}>{stats.totalScans}</h2>
                        </div>
                        <div style={{...iconBoxStyle, background: '#dbeafe', color: '#3b82f6'}}>
                            <i className="fas fa-folder-open"></i>
                        </div>
                    </div>
                    <div style={{ marginTop: '20px', color: '#3b82f6', fontSize: '0.9rem', fontWeight:'600' }}>Tích lũy theo thời gian</div>
                </div>

                 {/* Card 2: Nguy cơ cao */}
                 <div className="stat-card-modern hover-up" style={{...modernCardStyle, borderLeft: '6px solid #ef4444'}}>
                    <div style={{display:'flex', justifyContent:'space-between'}}>
                        <div>
                            <p style={{ color: '#64748b', fontSize: '1.1rem', fontWeight:'600', marginBottom:'5px' }}>Ca nguy cơ cao</p>
                            <h2 style={{ fontSize: '3rem', color: '#ef4444', margin: 0 }}>{stats.highRiskCount}</h2>
                        </div>
                        <div style={{...iconBoxStyle, background: '#fee2e2', color: '#ef4444'}}>
                            <i className="fas fa-heartbeat"></i>
                        </div>
                    </div>
                    <div style={{ marginTop: '20px', color: '#ef4444', fontSize: '0.9rem', fontWeight:'600' }}>Cần chú ý theo dõi</div>
                </div>

                 {/* Card 3: Bình thường (MỚI THÊM) */}
                 <div className="stat-card-modern hover-up" style={{...modernCardStyle, borderLeft: '6px solid #10b981'}}>
                    <div style={{display:'flex', justifyContent:'space-between'}}>
                        <div>
                            <p style={{ color: '#64748b', fontSize: '1.1rem', fontWeight:'600', marginBottom:'5px' }}>Kết quả ổn định</p>
                            <h2 style={{ fontSize: '3rem', color: '#10b981', margin: 0 }}>{stats.normalCount}</h2>
                        </div>
                        <div style={{...iconBoxStyle, background: '#d1fae5', color: '#10b981'}}>
                            <i className="fas fa-check-circle"></i>
                        </div>
                    </div>
                    <div style={{ marginTop: '20px', color: '#10b981', fontSize: '0.9rem', fontWeight:'600' }}>Duy trì thói quen tốt</div>
                </div>
            </div>

            {/* Thêm một chút style hover hiệu ứng nhẹ */}
            <style>
                {`
                    .hover-up:hover { transform: translateY(-5px); box-shadow: 0 15px 35px -10px rgba(0,0,0,0.1) !important; }
                    .hover-scale:hover { transform: scale(1.02); }
                    @keyframes wave { 0% { transform: rotate(0deg); } 20% { transform: rotate(15deg); } 40% { transform: rotate(-10deg); } 60% { transform: rotate(5deg); } 100% { transform: rotate(0deg); } }
                `}
            </style>
        </div>
    );
};
export default PatientHome;