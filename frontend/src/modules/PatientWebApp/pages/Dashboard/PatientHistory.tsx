import React, { useState, useEffect } from 'react';
// Import hook chuyển trang
import { useNavigate } from 'react-router-dom';
// @ts-ignore
import imagingApi from '../../../../api/imagingApi';
// @ts-ignore
import medicalApi from '../../../../api/medicalApi';
// @ts-ignore
import { useAuth } from '../../../../context/AuthContext';
import '../Dashboard/PatientHome.css';

const PatientHistory: React.FC = () => {
    const { user } = useAuth();
    // Khởi tạo navigate
    const navigate = useNavigate();
    const [history, setHistory] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const patientId = (user as any)?.id || (user as any)?.userId || (user as any)?.sub || "";
        if (patientId) {
            imagingApi.getImagesByPatient(patientId)
                .then((data: any) => {
                    console.log("🔥 DỮ LIỆU MỚI NHẤT TỪ API:", data); 
                    setHistory(data || []);
                })
                .finally(() => setLoading(false));
        }
    }, [user]);

    // [ĐÃ SỬA] Thay thế alert bằng chuyển trang sang chi tiết
    const handleViewReport = (item: any) => {
        // Chuyển hướng sang trang chi tiết (Trang có hộp Debug)
        navigate(`/patient/exam/${item.id}`);
    };

    return (
        <div className="dashboard-home animate-fade-in">
            <div className="welcome-banner" style={{background: 'var(--primary-800)'}}>
                <div className="welcome-content"><h2>Lịch sử chẩn đoán 📂</h2><p>Dữ liệu y tế cá nhân hóa.</p></div>
            </div>
            <div className="pro-card mt-4 p-0">
                <table style={{width:'100%', borderCollapse: 'collapse'}}>
                    <thead style={{background: '#f8fafc', borderBottom: '2px solid #eee'}}>
                        <tr style={{textAlign:'left'}}><th className="p-3">Ngày</th><th className="p-3">Ảnh</th><th className="p-3">Kết quả</th><th className="p-3">Thao tác</th></tr>
                    </thead>
                    <tbody>
                        {history.map((item, index) => {
                            // [MAPPING DỮ LIỆU CHUẨN]
                            
                            // 1. Ngày tháng (JSON trả về createdAt)
                            const dateStr = item.createdAt || item.uploadedAt || new Date().toISOString();
                            
                            // 2. Ảnh (JSON trả về originalImageUrl) - Ưu tiên cái này!
                            const imgSrc = item.originalImageUrl || item.imageUrl || item.ImageUrl;

                            // 3. Kết quả (JSON trả về predictionResult)
                            const diagnosis = item.predictionResult || "Đang phân tích...";
                            
                            // 4. Trạng thái (JSON trả về status = 2)
                            const isCompleted = Number(item.status) === 2 || !!item.predictionResult;

                            return (
                                <tr key={item.id || index} style={{borderBottom:'1px solid #f1f5f9'}}>
                                    <td className="p-3">
                                        {new Date(dateStr).toLocaleDateString('vi-VN', {
                                            hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric'
                                        })}
                                    </td>
                                    
                                    <td className="p-3">
                                        {imgSrc ? (
                                            <div style={{width: '60px', height: '60px'}}>
                                                 <img 
                                                    src={imgSrc} 
                                                    style={{width:'100%', height:'100%', borderRadius:'6px', objectFit: 'cover', border: '1px solid #ddd'}} 
                                                    alt="Scan"
                                                    onError={(e) => e.currentTarget.style.display = 'none'}
                                                />
                                            </div>
                                        ) : (
                                            <div style={{width:'60px', height:'60px', background:'#eee', borderRadius:'6px', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'10px', color:'#999'}}>
                                                No IMG
                                            </div>
                                        )}
                                    </td>

                                    <td className="p-3">
                                        <span style={{
                                            color: isCompleted ? '#16a34a' : '#ea580c',
                                            fontWeight: '600',
                                            background: isCompleted ? '#dcfce7' : '#ffedd5',
                                            padding: '5px 10px',
                                            borderRadius: '15px',
                                            fontSize: '13px'
                                        }}>
                                            {isCompleted ? diagnosis : "⏳ Đang xử lý..."}
                                        </span>
                                    </td>

                                    <td className="p-3">
                                        <button className="btn-sm" 
                                            onClick={() => handleViewReport(item)} 
                                            style={{border:'1px solid #0ea5e9', color:'#0ea5e9', background:'white', padding:'6px 12px', borderRadius:'6px', cursor:'pointer', fontSize:'13px'}}
                                        >
                                            <i className="fas fa-file-medical"></i> Chi tiết
                                        </button>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
export default PatientHistory;