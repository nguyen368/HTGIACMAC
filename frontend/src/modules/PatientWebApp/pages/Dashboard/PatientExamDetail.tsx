import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

// @ts-ignore
import axiosClient from '../../../../api/axiosClient';
// Import CSS xịn vừa tạo
import './PatientExamDetail.css';

interface ExamDetail {
    [key: string]: any; 
}

const PatientExamDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    
    const [exam, setExam] = useState<ExamDetail | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const reportRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const fetchDetail = async () => {
            if (!id) return;
            try {
                const data: any = await axiosClient.get(`/medical-records/examinations/${id}`);
                console.log("SERVER DATA:", data);
                setExam(data);
            } catch (error) {
                console.error(error);
                toast.error("Không tải được dữ liệu.");
            } finally {
                setLoading(false);
            }
        };
        fetchDetail();
    }, [id]);

    const handlePrintReport = async () => {
        if (!reportRef.current || !exam) return;
        try {
            toast.info("⏳ Đang tạo file PDF...");
            // @ts-ignore
            const canvas = await html2canvas(reportRef.current, { scale: 2 } as any);
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF('p', 'mm', 'a4');
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
            pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
            pdf.save(`KetQua_${exam.id.substring(0,8)}.pdf`);
            toast.success("✅ Tải file thành công!");
        } catch (error) {
            toast.error("❌ Lỗi tạo PDF.");
        }
    };

    if (loading) return (
        <div className="loading-screen">
            <div className="spinner"></div>&nbsp; Đang tải dữ liệu...
        </div>
    );
    
    if (!exam) return <div style={{padding: 40, textAlign: 'center'}}>Không tìm thấy hồ sơ.</div>;

    // --- LOGIC XỬ LÝ DỮ LIỆU ---
    
    // 1. Trạng thái hoàn thành (Bác sĩ đã duyệt)
    const rawStatus = exam.status || exam.Status || '';
    const isVerified = String(rawStatus).toLowerCase().trim() === 'verified';

    // 2. Dữ liệu Bác sĩ
    const diagnosisText = exam.diagnosisResult || exam.DiagnosisResult || exam.diagnosis || exam.Diagnosis || "";
    const notesText = exam.doctorNotes || exam.DoctorNotes || "";

    // 3. Dữ liệu AI (Xử lý logic hiển thị thông minh hơn)
    const aiRaw = exam.aiDiagnosis || exam.AiDiagnosis;
    const aiScoreRaw = exam.aiRiskScore || exam.AiRiskScore;
    
    // Chỉ coi là có kết quả AI nếu có text chẩn đoán và không phải null
    const hasAiData = !!aiRaw; 
    
    const aiResultDisplay = hasAiData ? aiRaw : "Đang phân tích hình ảnh...";
    const aiScoreDisplay = hasAiData ? (aiScoreRaw * 100).toFixed(1) : 0;

    return (
        <div className="exam-detail-layout">
            {/* CỘT TRÁI: ẢNH */}
            <div className="left-panel">
                <button className="btn-back" onClick={() => navigate('/patient/history')}>
                    <i className="fas fa-arrow-left"></i> Quay lại
                </button>
                
                <div className="image-viewer-container">
                    <img 
                        src={exam.imageUrl} 
                        alt="Eye Scan" 
                        className="exam-image"
                    />
                </div>
            </div>

            {/* CỘT PHẢI: THÔNG TIN */}
            <div className="right-panel">
                <div ref={reportRef} className="report-container">
                    
                    {/* HEADER: Tiêu đề + Badge trạng thái */}
                    <div className="report-header">
                        <div className="report-title">
                            <h1>Phiếu Kết Quả</h1>
                            <div className="report-meta">
                                <span className="meta-item"><i className="far fa-id-card"></i> #{exam.id.substring(0, 8).toUpperCase()}</span>
                                <span className="meta-item"><i className="far fa-calendar-alt"></i> {new Date(exam.examDate).toLocaleDateString('vi-VN')}</span>
                            </div>
                        </div>
                        <div className={`status-badge ${isVerified ? 'completed' : 'pending'}`}>
                            {isVerified ? (
                                <><i className="fas fa-check-circle"></i> ĐÃ CÓ KẾT QUẢ</>
                            ) : (
                                <><i className="fas fa-clock"></i> ĐANG CHỜ BÁC SĨ</>
                            )}
                        </div>
                    </div>

                    {/* NỘI DUNG CHÍNH */}
                    {!isVerified ? (
                        // --- TRẠNG THÁI: CHỜ BÁC SĨ ---
                        <div className="waiting-state">
                            <div className="pulse-icon"><i className="fas fa-user-md"></i></div>
                            <h3 style={{color: '#334155'}}>Đang chờ hội chẩn chuyên môn</h3>
                            <p style={{color: '#64748b', maxWidth: '400px', margin: '0 auto 30px auto'}}>
                                Hình ảnh của bạn đã được gửi lên hệ thống. Bác sĩ chuyên khoa đang xem xét để đưa ra kết luận chính xác nhất.
                            </p>
                            
                            {/* Khối AI chỉ hiện ở đây để tham khảo */}
                            <div className="ai-section">
                                <div className="ai-header">
                                    <span className="ai-title"><i className="fas fa-robot"></i> AI Sơ bộ</span>
                                </div>
                                <div className="ai-result-row">
                                    {/* Nếu chưa có AI data thì hiện chữ Đang phân tích, ẩn thanh % */}
                                    <span className="ai-diagnosis-main">
                                        {hasAiData ? aiResultDisplay : "🔄 Hệ thống đang phân tích..."}
                                    </span>
                                    
                                    {hasAiData && (
                                        <div className="confidence-wrapper">
                                            <span style={{fontSize:'12px', fontWeight:'bold', color:'#2563eb'}}>
                                                {aiScoreDisplay}%
                                            </span>
                                            <div className="confidence-bar-bg">
                                                <div className="confidence-bar-fill" style={{width: `${aiScoreDisplay}%`}}></div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ) : (
                        // --- TRẠNG THÁI: ĐÃ CÓ KẾT QUẢ ---
                        <>
                            {/* 1. KẾT LUẬN BÁC SĨ (Quan trọng nhất) */}
                            <div className="info-card highlight">
                                <div className="card-label">
                                    <i className="fas fa-user-check"></i> Kết luận chuyên môn
                                </div>
                                <div className="diagnosis-text">
                                    {diagnosisText || "Chưa có nội dung chẩn đoán."}
                                </div>
                            </div>

                            {/* 2. LỜI DẶN */}
                            <div className="info-card">
                                <div className="card-label">
                                    <i className="fas fa-clipboard-list"></i> Lời dặn / Phác đồ
                                </div>
                                <div className="notes-text">
                                    {notesText || "Vui lòng tuân thủ hướng dẫn điều trị."}
                                </div>
                            </div>

                            {/* 3. THAM KHẢO AI (Nhỏ bên dưới) */}
                            {hasAiData && (
                                <div className="ai-section" style={{marginTop: '10px', padding: '15px'}}>
                                    <div style={{display:'flex', justifyContent:'space-between', fontSize:'13px', color:'#64748b'}}>
                                        <span><i className="fas fa-microchip"></i> Hỗ trợ chẩn đoán bởi AI: <strong>{aiResultDisplay}</strong></span>
                                        <span>Độ tin cậy: <strong>{aiScoreDisplay}%</strong></span>
                                    </div>
                                </div>
                            )}

                            {/* 4. CHỮ KÝ */}
                            <div style={{marginTop: '40px', textAlign: 'right', paddingRight: '20px'}}>
                                <p style={{fontSize: '14px', fontWeight: 'bold', color: '#0f172a', marginBottom:'5px'}}>Bác sĩ phụ trách</p>
                                <div style={{height: '60px', display: 'flex', justifyContent: 'flex-end', alignItems: 'center'}}>
                                    <span style={{fontFamily: 'cursive', fontSize: '24px', color: '#2563eb'}}>Doctor. Signed</span>
                                </div>
                                <p style={{fontSize: '12px', color: '#059669', fontStyle: 'italic'}}>(Đã xác thực điện tử)</p>
                            </div>
                        </>
                    )}
                </div>

                {/* NÚT TẢI PDF (Chỉ hiện khi đã xác nhận) */}
                {isVerified && (
                    <button className="btn-download" onClick={handlePrintReport}>
                        <i className="fas fa-file-pdf"></i> Tải Phiếu Kết Quả (PDF)
                    </button>
                )}
            </div>
        </div>
    );
};

export default PatientExamDetail;