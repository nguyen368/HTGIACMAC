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

// 1. Định nghĩa kiểu dữ liệu chuẩn (Bổ sung thêm các trường alias để tránh lỗi)
interface ExamDetail {
    id: string;
    patientName: string;
    patientId: string;
    age: number;
    gender: string;
    examDate: string;
    status: 'Pending' | 'Analyzed' | 'Verified' | 'Rejected'; // Cập nhật thêm status Analyzed/Rejected
    imageUrl: string;
    heatmapUrl?: string;
    
    // Kết quả AI (Hỗ trợ cả camelCase và PascalCase)
    aiDiagnosis?: string;
    AiDiagnosis?: string;
    aiRiskLevel?: string;
    AiRiskLevel?: string;
    aiRiskScore?: number;
    AiRiskScore?: number;
    bbox?: number[]; // Tọa độ vùng bệnh [x, y, w, h]

    // Kết luận bác sĩ
    diagnosisResult?: string;
    doctorNotes?: string;
}

const ClinicExamDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    
    // State
    const [exam, setExam] = useState<ExamDetail | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    
    // Form bác sĩ nhập liệu
    const [diagnosis, setDiagnosis] = useState('');
    const [notes, setNotes] = useState('');
    
    // Điều khiển Viewer
    const [showHeatmap, setShowHeatmap] = useState(false);
    const [zoom, setZoom] = useState(1);
    const reportRef = useRef<HTMLDivElement>(null); // Ref để chụp ảnh in PDF

    // 2. Tải dữ liệu chi tiết
    useEffect(() => {
        const fetchDetail = async () => {
            if (!id) return;
            try {
                // SỬA: Đảm bảo gọi đúng API lấy chi tiết ca khám
                // Nếu backend của bạn endpoint là /medical-records/examinations/{id} thì giữ nguyên
                const data: any = await axiosClient.get(`/medical-records/examinations/${id}`);
                
                // Log để debug xem dữ liệu trả về có đúng không
                console.log("Exam Detail Data:", data);

                if (!data) throw new Error("No data returned");

                setExam(data);
                
                // Fill dữ liệu cũ nếu có
                setDiagnosis(data.diagnosisResult || 'Bình thường');
                setNotes(data.doctorNotes || '');
                
                // Tự động bật Heatmap nếu AI phát hiện rủi ro cao
                if (data.aiRiskLevel === 'High' || data.AiRiskLevel === 'High') {
                    setShowHeatmap(true);
                }

            } catch (error) {
                console.error("Lỗi tải hồ sơ:", error);
                toast.error("Không tìm thấy hồ sơ bệnh án hoặc lỗi kết nối.");
                // Không navigate về dashboard ngay để user kịp đọc lỗi
            } finally {
                setLoading(false);
            }
        };

        fetchDetail();
    }, [id]);

    // 3. Xử lý Lưu kết quả
    const handleSave = async () => {
        if (!exam) return;
        try {
            await axiosClient.put(`/medical-records/examinations/${exam.id}/verify`, {
                finalDiagnosis: diagnosis,
                doctorNotes: notes,
                doctorId: "CURRENT_USER_ID" // Backend sẽ tự lấy từ Token, nhưng gửi kèm cho chắc
            });
            
            toast.success("✅ Đã lưu chẩn đoán & Duyệt hồ sơ!");
            setExam({ ...exam, status: 'Verified', diagnosisResult: diagnosis, doctorNotes: notes });
        } catch (error) {
            console.error(error);
            toast.error("❌ Lỗi khi lưu kết quả.");
        }
    };

    // 4. Xử lý In PDF (Tích hợp từ file .jsx cũ)
    const handlePrintReport = async () => {
        if (!reportRef.current || !exam) return;
        
        try {
            toast.info("⏳ Đang tạo file PDF...");
            const canvas = await html2canvas(reportRef.current, { scale: 2 });
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

    if (loading) return (
        <div className="loading-container" style={{display:'flex', justifyContent:'center', alignItems:'center', height:'100vh', color:'white'}}>
            <div className="spinner"></div> Đang tải hồ sơ bệnh án...
        </div>
    );

    if (!exam) return (
        <div className="error-container" style={{textAlign:'center', marginTop:'50px', color:'white'}}>
            <h3>Không tìm thấy dữ liệu ca khám này.</h3>
            <button onClick={() => navigate('/clinic/upload')} className="btn btn-secondary mt-3">Quay lại</button>
        </div>
    );

    // Xử lý hiển thị an toàn cho các trường có thể null/undefined
    const displayRiskScore = (exam.aiRiskScore || exam.AiRiskScore || 0) * 100;
    const displayRiskLevel = exam.aiRiskLevel || exam.AiRiskLevel || "N/A";
    const displayDiagnosis = exam.aiDiagnosis || exam.AiDiagnosis || "Chưa có kết quả";

    return (
        <div className="exam-detail-layout">
            {/* Cột Trái: Viewer Ảnh & AI */}
            <div className="viewer-section">
                <div className="toolbar-top">
                    <button className="btn-tool" onClick={() => navigate('/clinic/upload')}>
                        <i className="fas fa-arrow-left"></i> Quay lại
                    </button>
                    <div className="zoom-controls">
                        <button onClick={() => setZoom(z => Math.max(0.5, z - 0.1))}>-</button>
                        <span>{(zoom * 100).toFixed(0)}%</span>
                        <button onClick={() => setZoom(z => Math.min(3, z + 0.1))}>+</button>
                    </div>
                    <label className="toggle-switch">
                        <input type="checkbox" checked={showHeatmap} onChange={e => setShowHeatmap(e.target.checked)} />
                        <span className="slider"></span>
                        <span className="label-text">Lớp phủ Heatmap AI</span>
                    </label>
                </div>

                <div className="image-viewport" style={{ overflow: 'auto', height: '80vh', position: 'relative', background: '#000', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                    <div className="image-wrapper" style={{ position: 'relative', transform: `scale(${zoom})`, transition: 'transform 0.2s' }}>
                        {/* Ảnh gốc */}
                        <img 
                            src={exam.imageUrl} 
                            alt="X-Ray" 
                            className="main-xray" 
                            style={{ maxWidth: '100%', maxHeight:'80vh', objectFit:'contain' }} 
                            onError={(e) => (e.target as HTMLImageElement).src = 'https://via.placeholder.com/500?text=Image+Not+Found'}
                        />
                        
                        {/* Lớp phủ Heatmap */}
                        {showHeatmap && exam.heatmapUrl && (
                            <img src={exam.heatmapUrl} alt="Heatmap" className="heatmap-overlay" 
                                style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0.6, pointerEvents: 'none' }} 
                            />
                        )}

                        {/* Vẽ khung đỏ vùng bệnh (Nếu có) */}
                        {showHeatmap && exam.bbox && <ImageOverlay bbox={exam.bbox} />}
                    </div>
                </div>
            </div>

            {/* Cột Phải: Form Chẩn đoán */}
            <div className="diagnosis-form-section">
                {/* Phần này dùng để In PDF (Ẩn một số nút khi in nếu cần CSS kỹ hơn) */}
                <div ref={reportRef} className="report-container" style={{background: 'white', padding: '20px', borderRadius: '8px'}}>
                    <h3 className="text-primary text-uppercase border-bottom pb-2" style={{color: '#0369a1', borderBottom: '2px solid #0369a1'}}>Phiếu Kết Quả Chẩn Đoán</h3>
                    
                    <div className="patient-info mb-4" style={{marginTop: '15px'}}>
                        <p><strong>Họ tên:</strong> {exam.patientName || 'N/A'}</p>
                        <p><strong>Tuổi/Giới tính:</strong> {exam.age || 'N/A'} / {exam.gender || 'N/A'}</p>
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
                            <select 
                                className="form-select" 
                                value={diagnosis} 
                                onChange={e => setDiagnosis(e.target.value)}
                                disabled={exam.status === 'Verified'}
                                style={{width:'100%', padding:'8px', borderRadius:'4px', border:'1px solid #ccc'}}
                            >
                                <option value="Bình thường">Bình thường</option>
                                <option value="Viêm giác mạc">Viêm giác mạc</option>
                                <option value="Loét giác mạc">Loét giác mạc</option>
                                <option value="Đục thủy tinh thể">Đục thủy tinh thể</option>
                                <option value="Võng mạc đái tháo đường">Võng mạc đái tháo đường</option>
                                <option value="Thoái hóa hoàng điểm">Thoái hóa hoàng điểm</option>
                                <option value="Khác">Khác (Ghi chú thêm)</option>
                            </select>
                        </div>

                        <div className="mb-3" style={{marginBottom: '15px'}}>
                            <label className="form-label fw-bold" style={{display:'block', marginBottom:'5px'}}>Ghi chú / Y lệnh:</label>
                            <textarea 
                                className="form-control" 
                                rows={5}
                                value={notes}
                                onChange={e => setNotes(e.target.value)}
                                disabled={exam.status === 'Verified'}
                                placeholder="Nhập phác đồ điều trị hoặc ghi chú..."
                                style={{width:'100%', padding:'8px', borderRadius:'4px', border:'1px solid #ccc'}}
                            ></textarea>
                        </div>
                    </div>

                    {exam.status === 'Verified' && (
                        <div className="mt-4 text-end" style={{textAlign: 'right', marginTop: '30px'}}>
                            <p><strong>Bác sĩ chuyên khoa</strong></p>
                            <p className="text-muted fst-italic" style={{color:'#888', fontStyle:'italic'}}>(Đã ký xác nhận trên hệ thống)</p>
                        </div>
                    )}
                </div>

                {/* Các nút hành động (Không in ra PDF vì nằm ngoài ref) */}
                <div className="action-buttons mt-3 p-3 bg-light rounded" style={{marginTop: '20px'}}>
                    {exam.status !== 'Verified' ? (
                        <button className="btn btn-primary w-100 mb-2" onClick={handleSave} style={{width:'100%', padding:'10px', background:'#0ea5e9', color:'white', border:'none', borderRadius:'4px', marginBottom:'10px', cursor:'pointer'}}>
                            <i className="fas fa-check"></i> Xác nhận & Lưu
                        </button>
                    ) : (
                        <button className="btn btn-success w-100 mb-2" disabled style={{width:'100%', padding:'10px', background:'#22c55e', color:'white', border:'none', borderRadius:'4px', marginBottom:'10px', opacity: 0.8, cursor:'not-allowed'}}>
                            <i className="fas fa-lock"></i> Hồ sơ đã khóa
                        </button>
                    )}
                    
                    <button className="btn btn-outline-dark w-100" onClick={handlePrintReport} style={{width:'100%', padding:'10px', background:'transparent', color:'#333', border:'1px solid #333', borderRadius:'4px', cursor:'pointer'}}>
                        <i className="fas fa-print"></i> Xuất PDF
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ClinicExamDetail;