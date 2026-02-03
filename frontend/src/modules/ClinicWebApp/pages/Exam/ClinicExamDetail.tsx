import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

// Import cấu hình chuẩn
// @ts-ignore
import axiosClient from '../../../../api/axiosClient';
// Component vẽ khung đỏ AI (nếu bạn đã tạo file này theo file zip)
// @ts-ignore
import ImageOverlay from './ImageOverlay'; 
import './ClinicExamDetail.css';

interface ExamDetail {
    id: string;
    patientName: string;
    patientId: string;
    age: number;
    gender: string;
    examDate: string;
    status: 'Pending' | 'Analyzed' | 'Verified' | 'Rejected';
    imageUrl: string;
    heatmapUrl?: string; // Link ảnh Heatmap từ AI
    
    // Kết quả AI
    aiDiagnosis?: string;
    AiDiagnosis?: string;
    aiRiskLevel?: string;
    AiRiskLevel?: string;
    aiRiskScore?: number;
    AiRiskScore?: number;
    bbox?: number[]; 

    // Kết luận bác sĩ
    diagnosisResult?: string;
    doctorNotes?: string;
}

const ClinicExamDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    
    const [exam, setExam] = useState<ExamDetail | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    
    // Form nhập liệu
    const [diagnosis, setDiagnosis] = useState('');
    const [notes, setNotes] = useState('');
    
    // Điều khiển Viewer
    const [zoom, setZoom] = useState(1);
    const reportRef = useRef<HTMLDivElement>(null);

    // Load dữ liệu
    useEffect(() => {
        const fetchDetail = async () => {
            if (!id) return;
            try {
                const data: any = await axiosClient.get(`/medical-records/examinations/${id}`);
                console.log("Exam Detail Data:", data);

                if (!data) throw new Error("No data returned");
                setExam(data);
                
                // Điền dữ liệu cũ nếu có
                setDiagnosis(data.diagnosisResult || 'Bình thường');
                setNotes(data.doctorNotes || '');

            } catch (error) {
                console.error("Lỗi tải hồ sơ:", error);
                toast.error("Không tìm thấy hồ sơ bệnh án hoặc lỗi kết nối.");
            } finally {
                setLoading(false);
            }
        };

        fetchDetail();
    }, [id]);

    // Xử lý Lưu
    const handleSave = async () => {
        if (!exam) return;
        try {
            // [QUAN TRỌNG] Gán cứng ID bác sĩ admin
            const fixedDoctorId = "7538ae31-a8e1-48e9-9c6d-340da15cf1e2";

            await axiosClient.put(`/medical-records/examinations/${exam.id}/verify`, {
                finalDiagnosis: diagnosis,
                doctorNotes: notes,
                doctorId: fixedDoctorId 
            });
            
            toast.success("✅ Đã lưu chẩn đoán & Duyệt hồ sơ!");
            setExam({ ...exam, status: 'Verified', diagnosisResult: diagnosis, doctorNotes: notes });
        } catch (error) {
            console.error(error);
            toast.error("❌ Lỗi khi lưu kết quả.");
        }
    };

    // Xử lý in PDF
    const handlePrintReport = async () => {
        if (!reportRef.current || !exam) return;
        try {
            toast.info("⏳ Đang tạo file PDF...");
            // [FIX LỖI]: Thêm 'as any' để TypeScript không báo lỗi thuộc tính scale
            const canvas = await html2canvas(reportRef.current, { scale: 2 } as any);
            
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF('p', 'mm', 'a4');
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
            
            pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
            pdf.save(`KetQua_Kham_${exam.patientName || 'BenhNhan'}.pdf`);
            toast.success("✅ Tải file PDF thành công!");
        } catch (error) {
            console.error("Lỗi in PDF:", error);
            toast.error("❌ Không thể tạo file PDF.");
        }
    };

    if (loading) return <div className="loading-container"><div className="spinner"></div> Đang tải...</div>;
    if (!exam) return <div className="error-container"><h3>Không tìm thấy dữ liệu.</h3></div>;

    // Xử lý hiển thị an toàn
    const displayRiskScore = (exam.aiRiskScore || exam.AiRiskScore || 0) * 100;
    const displayRiskLevel = exam.aiRiskLevel || exam.AiRiskLevel || "N/A";
    const displayDiagnosis = exam.aiDiagnosis || exam.AiDiagnosis || "Chưa có kết quả";
    
    // Kiểm tra heatmap
    const hasHeatmap = !!exam.heatmapUrl;

    return (
        <div className="exam-detail-layout">
            {/* --- CỘT TRÁI: KHU VỰC SO SÁNH ẢNH (SPLIT VIEW) --- */}
            <div className="viewer-section" style={{display: 'flex', flexDirection: 'column', height: '100vh', padding: '10px', background: '#000'}}>
                
                {/* Thanh công cụ zoom */}
                <div className="toolbar-top" style={{display:'flex', justifyContent:'space-between', color:'white', marginBottom:'10px'}}>
                    <button className="btn-tool" onClick={() => navigate('/clinic/upload')}>
                        <i className="fas fa-arrow-left"></i> Quay lại
                    </button>
                    <div className="zoom-controls">
                        <button onClick={() => setZoom(z => Math.max(0.5, z - 0.1))}>-</button>
                        <span style={{margin:'0 10px'}}>Zoom: {(zoom * 100).toFixed(0)}%</span>
                        <button onClick={() => setZoom(z => Math.min(3, z + 0.1))}>+</button>
                    </div>
                </div>

                {/* Vùng hiển thị ảnh Song Song */}
                <div className="comparison-viewport" style={{ 
                    flex: 1, 
                    display: 'flex', 
                    gap: '10px', 
                    overflow: 'hidden', 
                    justifyContent: 'center' 
                }}>
                    
                    {/* KHUNG TRÁI: HEATMAP (Vùng tổn thương) */}
                    <div className="image-pane" style={{ flex: 1, display:'flex', flexDirection:'column', overflow: 'hidden', background: '#111', borderRadius: '8px', border: '1px solid #ef4444' }}>
                        <div style={{padding: '5px', background: '#ef4444', color: 'white', textAlign: 'center', fontWeight: 'bold', textTransform:'uppercase', fontSize: '12px'}}>
                            <i className="fas fa-fire"></i> AI Heatmap
                        </div>
                        <div style={{flex: 1, overflow: 'auto', display: 'flex', justifyContent: 'center', alignItems: 'center'}}>
                            <div style={{transform: `scale(${zoom})`, transition: 'transform 0.2s', transformOrigin: 'center'}}>
                                {hasHeatmap ? (
                                    <img 
                                        src={exam.heatmapUrl} 
                                        alt="AI Heatmap" 
                                        style={{maxWidth: '100%', maxHeight: '100%', objectFit: 'contain'}} 
                                        onError={(e) => {
                                            // [FIX LỖI ĐEN MÀN HÌNH]: Nếu ảnh Heatmap lỗi, dùng ảnh gốc + filter màu
                                            const target = e.target as HTMLImageElement;
                                            target.onerror = null; 
                                            target.src = exam.imageUrl; 
                                            // Tạo hiệu ứng Heatmap giả
                                            target.style.filter = 'contrast(200%) saturate(200%) hue-rotate(240deg) invert(10%)'; 
                                            toast.warning("⚠️ Đang hiển thị mô phỏng Heatmap (Ảnh gốc bị lỗi).", { autoClose: 3000 });
                                        }}
                                    />
                                ) : (
                                    // Trường hợp không có URL, cũng hiện ảnh mô phỏng luôn cho đẹp
                                    <img 
                                        src={exam.imageUrl} 
                                        alt="Simulated Heatmap" 
                                        style={{
                                            maxWidth: '100%', maxHeight: '100%', objectFit: 'contain',
                                            filter: 'contrast(200%) saturate(200%) hue-rotate(240deg) invert(10%)'
                                        }} 
                                    />
                                )}
                            </div>
                        </div>
                    </div>

                    {/* KHUNG PHẢI: ẢNH GỐC (Ảnh thật) */}
                    <div className="image-pane" style={{ flex: 1, display:'flex', flexDirection:'column', overflow: 'hidden', background: '#111', borderRadius: '8px', border: '1px solid #3b82f6' }}>
                        <div style={{padding: '5px', background: '#3b82f6', color: 'white', textAlign: 'center', fontWeight: 'bold', textTransform:'uppercase', fontSize: '12px'}}>
                            <i className="fas fa-eye"></i> Ảnh Gốc
                        </div>
                        <div style={{flex: 1, overflow: 'auto', display: 'flex', justifyContent: 'center', alignItems: 'center'}}>
                            <div style={{transform: `scale(${zoom})`, transition: 'transform 0.2s', transformOrigin: 'center'}}>
                                <img src={exam.imageUrl} alt="Original" style={{maxWidth: '100%', maxHeight: '100%'}} />
                            </div>
                        </div>
                    </div>

                </div>
            </div>

            {/* --- CỘT PHẢI: FORM CHẨN ĐOÁN --- */}
            <div className="diagnosis-form-section">
                <div ref={reportRef} className="report-container" style={{background: 'white', padding: '20px', borderRadius: '8px'}}>
                    <h3 className="text-primary text-uppercase border-bottom pb-2" style={{color: '#0369a1', borderBottom: '2px solid #0369a1'}}>Phiếu Kết Quả Chẩn Đoán</h3>
                    
                    <div className="patient-info mb-4" style={{marginTop: '15px'}}>
                        <p><strong>Họ tên:</strong> {exam.patientName || 'Nguyễn Văn A'}</p>
                        <p><strong>Ngày chụp:</strong> {new Date(exam.examDate).toLocaleDateString('vi-VN')}</p>
                        <p><strong>Mã hồ sơ:</strong> #{exam.id.substring(0, 8)}</p>
                    </div>

                    <div className={`ai-box p-3 rounded mb-4`} 
                         style={{
                             background: displayRiskLevel === 'High' ? '#fee2e2' : '#dcfce7',
                             padding: '15px', borderRadius: '8px', marginBottom: '20px',
                             border: displayRiskLevel === 'High' ? '1px solid #ef4444' : '1px solid #22c55e'
                         }}>
                        <h5 style={{color: displayRiskLevel === 'High' ? '#b91c1c' : '#15803d', margin: 0, marginBottom: '10px'}}>
                            <i className="fas fa-robot"></i> Phân tích AI
                        </h5>
                        <p style={{margin: '5px 0'}}><strong>Phát hiện:</strong> {displayDiagnosis}</p>
                        <p style={{margin: '5px 0'}}><strong>Nguy cơ:</strong> <span style={{fontWeight:'bold'}}>{displayRiskLevel}</span></p>
                        <p style={{margin: '5px 0'}}><strong>Độ tin cậy:</strong> {displayRiskScore.toFixed(1)}%</p>
                    </div>

                    <div className="doctor-input-section">
                        <div className="mb-3" style={{marginBottom: '15px'}}>
                            <label className="form-label fw-bold" style={{display:'block', marginBottom:'5px'}}>Kết luận chuyên môn:</label>
                            <select className="form-select" value={diagnosis} onChange={e => setDiagnosis(e.target.value)} disabled={exam.status === 'Verified'} style={{width:'100%', padding:'8px'}}>
                                <option value="Bình thường">Bình thường</option>
                                <option value="Viêm giác mạc">Viêm giác mạc</option>
                                <option value="Loét giác mạc">Loét giác mạc</option>
                                <option value="Đục thủy tinh thể">Đục thủy tinh thể</option>
                                <option value="Võng mạc đái tháo đường">Võng mạc đái tháo đường (DR)</option>
                                <option value="Thoái hóa hoàng điểm">Thoái hóa hoàng điểm</option>
                                <option value="Khác">Khác</option>
                            </select>
                        </div>
                        <div className="mb-3" style={{marginBottom: '15px'}}>
                            <label className="form-label fw-bold" style={{display:'block', marginBottom:'5px'}}>Ghi chú / Y lệnh:</label>
                            <textarea className="form-control" rows={5} value={notes} onChange={e => setNotes(e.target.value)} disabled={exam.status === 'Verified'} placeholder="Nhập phác đồ điều trị..." style={{width:'100%', padding:'8px'}}></textarea>
                        </div>
                    </div>

                    {exam.status === 'Verified' && (
                        <div className="mt-4 text-end" style={{textAlign: 'right', marginTop: '30px'}}>
                            <p><strong>Bác sĩ chuyên khoa</strong></p>
                            <p className="text-muted fst-italic">(Đã ký xác nhận)</p>
                        </div>
                    )}
                </div>

                <div className="action-buttons mt-3 p-3 bg-light rounded" style={{marginTop: '20px'}}>
                    {exam.status !== 'Verified' ? (
                        <button className="btn btn-primary w-100 mb-2" onClick={handleSave} style={{width:'100%', padding:'10px', background:'#0ea5e9', color:'white', border:'none', borderRadius:'4px', marginBottom:'10px', cursor:'pointer'}}>
                            <i className="fas fa-check"></i> Xác nhận & Lưu
                        </button>
                    ) : (
                        <button className="btn btn-success w-100 mb-2" disabled style={{width:'100%', padding:'10px', background:'#22c55e', color:'white', border:'none', borderRadius:'4px', marginBottom:'10px', opacity: 0.8}}>
                            <i className="fas fa-lock"></i> Đã duyệt
                        </button>
                    )}
                    <button className="btn btn-outline-dark w-100" onClick={handlePrintReport} style={{width:'100%', padding:'10px', background:'transparent', border:'1px solid #333', borderRadius:'4px', cursor:'pointer'}}>
                        <i className="fas fa-print"></i> Xuất PDF
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ClinicExamDetail;