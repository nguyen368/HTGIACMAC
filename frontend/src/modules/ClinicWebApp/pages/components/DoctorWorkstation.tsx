import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Outlet } from 'react-router-dom'; 
import { ToastContainer, toast } from 'react-toastify'; 
import Sidebar from '../../../../components/Sidebar/Sidebar'; 
import { Examination } from '../../../../types/medical'; 
import 'react-toastify/dist/ReactToastify.css';
import './DoctorWorkstation.css';

interface LayoutWrapperProps {
    children: React.ReactNode;
}

const DoctorWorkstation: React.FC = () => {
    const { id } = useParams<{ id: string }>(); 
    const navigate = useNavigate();

    const [exam, setExam] = useState<Examination | null>(null);
    const [doctorNotes, setDoctorNotes] = useState<string>('');
    const [finalDiagnosis, setFinalDiagnosis] = useState<string>('');
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const API_BASE_URL = "http://localhost:80/api/medical-records/examinations";

    useEffect(() => {
        if (!id) {
            setLoading(false);
            return;
        }

        setLoading(true);
        const token = localStorage.getItem('aura_token');
        
        fetch(`${API_BASE_URL}/${id}`, {
            headers: { 
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        })
            .then(res => {
                if (!res.ok) throw new Error("Không tìm thấy hồ sơ ca khám này.");
                return res.json();
            })
            .then(data => {
                setExam(data);
                // [FIX] Tự động lấy dữ liệu dù viết Hoa hay thường
                setFinalDiagnosis(data.diagnosisResult || (data as any).DiagnosisResult || "");
                setDoctorNotes(data.doctorNotes || (data as any).DoctorNotes || "");
                setLoading(false);
            })
            .catch(err => {
                console.error("Lỗi:", err);
                setError(err.message);
                setLoading(false);
            });
    }, [id]);

    const handleVerify = async () => {
        if (!id) return;
        const token = localStorage.getItem('aura_token');
        const payload = { doctorNotes, finalDiagnosis };

        try {
            const response = await fetch(`${API_BASE_URL}/${id}/verify`, {
                method: 'PUT',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });
            
            if (response.ok) {
                toast.success("✅ Đã duyệt hồ sơ thành công!");
                setExam(prev => prev ? ({ ...prev, status: 'Verified' }) : null);
            } else {
                const result = await response.json();
                toast.error("⚠️ Lỗi: " + (result.detail || "Không thể duyệt hồ sơ"));
            }
        } catch (error) {
            toast.error("❌ Lỗi kết nối server");
        }
    };

    const LayoutWrapper: React.FC<LayoutWrapperProps> = ({ children }) => (
        <div style={{ display: 'flex', minHeight: '100vh' }}>
            <Sidebar />
            <div style={{ marginLeft: '250px', width: 'calc(100% - 250px)', background: '#f7fafc', minHeight: '100vh' }}>
                {children}
            </div>
        </div>
    );

    // --- MÀN HÌNH DASHBOARD TỔNG ---
    if (!id) {
        return (
            <LayoutWrapper>
                <div className="doctor-workstation-container" style={{ padding: '40px' }}>
                    <div style={{ textAlign: 'center', marginBottom: '30px' }}>
                        <h1>👨‍⚕️ Bàn Làm Việc Bác Sĩ</h1>
                        <p>Chào mừng bạn quay trở lại hệ thống AURA. Vui lòng chọn tác vụ:</p>
                        <div style={{ marginTop: '20px', display: 'flex', gap: '15px', justifyContent: 'center' }}>
                            <button onClick={() => navigate('/patient/upload')} className="btn-primary-action" style={{ padding: '12px 25px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>📸 Upload Ca Khám Mới</button>
                            <button onClick={() => navigate('/doctor/queue')} className="btn-success-action" style={{ padding: '12px 25px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>📋 Xem Hàng Đợi Real-time</button>
                        </div>
                    </div>
                    <hr style={{ opacity: 0.1, margin: '20px 0' }} />
                    <div className="workstation-sub-content"><Outlet /></div>
                    <ToastContainer position="top-right" autoClose={3000} />
                </div>
            </LayoutWrapper>
        );
    }

    if (loading) return <LayoutWrapper><div className="loading-screen p-5">Đang kết nối hệ thống dữ liệu y tế...</div></LayoutWrapper>;
    if (error) return <LayoutWrapper><div className="error-screen p-5 text-danger">⚠️ Lỗi hệ thống: {error}</div></LayoutWrapper>;
    if (!exam) return <LayoutWrapper><div className="empty-screen p-5">Hồ sơ không tồn tại hoặc đã bị xóa.</div></LayoutWrapper>;

    // [FIX] Khai báo các biến an toàn để hiển thị
    const safeStatus = exam.status || (exam as any).Status;
    const isVerified = safeStatus === 'Verified';
    const safeImageUrl = exam.imageUrl || (exam as any).ImageUrl || (exam as any).OriginalImageUrl;
    const safePatientName = exam.patientName || (exam as any).PatientName || "Khách vãng lai";
    const safeDate = exam.examDate || (exam as any).ExamDate || (exam as any).CreatedAt || new Date().toISOString();

    return (
        <LayoutWrapper>
            <div className="medical-workstation-container" style={{ padding: '40px', position: 'relative' }}>
                <button onClick={() => navigate('/doctor/queue')} style={{ position: 'absolute', top: '20px', left: '20px', padding: '8px 15px', borderRadius: '5px', border: '1px solid #ccc', cursor: 'pointer', backgroundColor: '#fff' }}>⬅️ Quay về danh sách</button>

                <div className="image-viewer-panel" style={{ marginTop: '30px' }}>
                    <div className="image-header"><span>👁️ Ảnh chụp đáy mắt gốc</span></div>
                    <div className="image-container-inner">
                        {safeImageUrl ? (
                            <img src={safeImageUrl} alt="Medical Scan" className="main-medical-image" style={{ width: '100%', borderRadius: '12px' }} />
                        ) : (
                            <div className="no-image-placeholder">Không có dữ liệu hình ảnh</div>
                        )}
                    </div>
                </div>

                <div className="data-panel" style={{ marginTop: '30px' }}>
                    <div className="panel-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                        <div>
                            <h1>Doctor Workstation</h1>
                            <p className="subtitle">Mã hồ sơ: {id.substring(0, 8).toUpperCase()}</p>
                        </div>
                        <div className={`status-badge status-${safeStatus?.toLowerCase()}`} style={{ padding: '8px 15px', borderRadius: '20px', fontWeight: 'bold' }}>
                            {isVerified ? '✅ Đã Duyệt' : '⏳ Chờ Chẩn Đoán'}
                        </div>
                    </div>

                    <div className="medical-card patient-info-card" style={{ background: 'white', padding: '20px', borderRadius: '12px', marginBottom: '20px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                        <div className="card-row" style={{ display: 'flex', gap: '40px' }}>
                            <div><label style={{ color: '#666' }}>Bệnh nhân:</label> <strong style={{ fontSize: '18px' }}>{safePatientName}</strong></div>
                            <div><label style={{ color: '#666' }}>Ngày khám:</label> <strong>{new Date(safeDate).toLocaleDateString('vi-VN')}</strong></div>
                        </div>
                    </div>

                    <div className={`medical-card diagnosis-form-card ${isVerified ? 'verified-mode' : ''}`} style={{ background: 'white', padding: '25px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
                        <div className="card-title" style={{ marginBottom: '20px', fontSize: '18px', fontWeight: 'bold', borderBottom: '1px solid #eee', paddingBottom: '10px' }}>
                            <span>👨‍⚕️ Kết luận chuyên môn</span>
                        </div>

                        <div className="form-group" style={{ marginBottom: '20px' }}>
                            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Chẩn đoán xác định:</label>
                            <input type="text" className="medical-input" style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #ddd' }} value={finalDiagnosis} onChange={(e) => setFinalDiagnosis(e.target.value)} placeholder="Nhập kết luận bệnh học..." disabled={isVerified} />
                        </div>

                        <div className="form-group" style={{ marginBottom: '25px' }}>
                            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Ghi chú / Chỉ định điều trị:</label>
                            <textarea rows={6} className="medical-textarea" style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #ddd' }} value={doctorNotes} onChange={(e) => setDoctorNotes(e.target.value)} placeholder="Nhập hướng điều trị và lời khuyên cho bệnh nhân..." disabled={isVerified} />
                        </div>

                        {!isVerified ? (
                            <button className="primary-button verify-button" onClick={handleVerify} style={{ width: '100%', padding: '15px', background: '#007bff', color: 'white', border: 'none', borderRadius: '8px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer' }}>Xác nhận & Duyệt hồ sơ</button>
                        ) : (
                            <div className="verified-banner" style={{ textAlign: 'center', padding: '15px', background: '#d4edda', color: '#155724', borderRadius: '8px', fontWeight: 'bold' }}>✅ Hồ sơ đã được bác sĩ ký duyệt và gửi kết quả.</div>
                        )}
                    </div>
                </div>
                <ToastContainer />
            </div>
        </LayoutWrapper>
    );
};

export default DoctorWorkstation;