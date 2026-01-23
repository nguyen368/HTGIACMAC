import React, { useState, useEffect } from 'react';
import medicalApi from '../../../../api/medicalApi';
import './PatientHistory.css';

const PatientHistory = () => {
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchHistory();
    }, []);

    const fetchHistory = async () => {
        try {
            setLoading(true);
            // Gọi API lấy lịch sử khám
            const data = await medicalApi.getExaminationHistory();
            setHistory(data || []);
        } catch (err) {
            console.error("Lỗi tải lịch sử khám:", err);
            setError("Không thể tải dữ liệu lịch sử. Vui lòng thử lại sau.");
        } finally {
            setLoading(false);
        }
    };

    // [MỚI] Hàm xử lý xem báo cáo (Traceability)
    const handleViewReport = async (examId) => {
        try {
            // Gọi API lấy dữ liệu báo cáo chi tiết
            const report = await medicalApi.getReportData(examId);
            
            // Demo: Hiển thị thông tin truy xuất nguồn gốc qua Alert
            // Trong thực tế, bạn có thể chuyển hướng sang trang in PDF
            alert(
                `📄 PHIẾU KẾT QUẢ ĐIỆN TỬ (Traceability Info)\n` +
                `-----------------------\n` +
                `Bệnh nhân: ${report.patientInfo.name}\n` +
                `Ngày khám: ${new Date(report.printedAt).toLocaleDateString()}\n\n` +
                `🔍 THÔNG SỐ KỸ THUẬT AI:\n` +
                `- Model: ${report.technicalTraceability.systemName}\n` +
                `- Version: ${report.technicalTraceability.algorithmVersion}\n` +
                `- AI Confidence: ${report.technicalTraceability.aiConfidenceScore}%\n` +
                `- Ngưỡng đánh giá: ${report.technicalTraceability.thresholds.HighRisk}`
            );
        } catch (error) {
            console.error(error);
            alert("Chưa có báo cáo chi tiết cho ca này hoặc hồ sơ chưa được bác sĩ duyệt.");
        }
    };

    // Hàm hỗ trợ hiển thị màu sắc (Cập nhật theo dữ liệu Backend: Low/Medium/High)
    const getSeverityClass = (riskLevel) => {
        switch (riskLevel) {
            case 'Low': return 'status-normal';      // Xanh
            case 'Medium': return 'status-moderate'; // Vàng
            case 'High': return 'status-severe';     // Đỏ
            default: return 'status-unknown';
        }
    };

    if (loading) return (
        <div className="history-loading">
            <div className="spinner"></div>
            <p>Đang truy xuất lịch sử chẩn đoán từ hệ thống AURA...</p>
        </div>
    );

    return (
        <div className="history-container animate-fade-in">
            <div className="history-header">
                <h3>Lịch sử chẩn đoán mạch máu võng mạc </h3>
                <p>Mã dự án: SP26SE025 | Dữ liệu được phân tích bởi AI Core</p>
            </div>

            {error && <div className="error-message">{error}</div>}

            {history.length === 0 && !error ? (
                <div className="no-data">
                    <i className="fas fa-folder-open"></i>
                    <p>Bạn chưa có lịch sử khám nào. Hãy thực hiện "Sàng lọc AI" để bắt đầu.</p>
                </div>
            ) : (
                <div className="history-list">
                    {history.map((item, index) => (
                        <div key={item.id || index} className="history-card">
                            <div className="card-main-info">
                                <div className="exam-date">
                                    <span className="label">Ngày khám:</span>
                                    <span className="value">{new Date(item.examDate).toLocaleDateString('vi-VN')}</span>
                                </div>
                                
                                {/* Hiển thị Trạng thái AI hoặc Kết quả Bác sĩ */}
                                <div className={`diagnosis-badge ${getSeverityClass(item.aiRiskLevel)}`}>
                                    {item.status === "Verified" ? (
                                        <span><i className="fas fa-check-circle"></i> {item.result || item.diagnosis}</span>
                                    ) : (
                                        <span><i className="fas fa-cog fa-spin"></i> Đang phân tích...</span>
                                    )}
                                </div>
                            </div>

                            <div className="card-details">
                                <div className="detail-item">
                                    <span className="label">Ảnh chụp:</span>
                                    {/* Hiển thị thumbnail ảnh mắt */}
                                    <img 
                                        src={item.imageUrl} 
                                        alt="Scan" 
                                        style={{width: '50px', height: '50px', objectFit: 'cover', borderRadius: '4px', border: '1px solid #ddd'}}
                                    />
                                </div>
                                <div className="detail-item">
                                    <span className="label">Mức độ rủi ro (AI):</span>
                                    <span className="value" style={{fontWeight: 'bold'}}>
                                        {item.aiRiskLevel || 'N/A'} 
                                        {item.aiRiskScore ? ` (${item.aiRiskScore}%)` : ''}
                                    </span>
                                </div>
                            </div>

                            <div className="card-actions">
                                {/* Chỉ hiện nút xem báo cáo khi hồ sơ đã được Verify */}
                                {item.status === "Verified" ? (
                                    <button 
                                        className="view-report-btn"
                                        onClick={() => handleViewReport(item.id)}
                                    >
                                        <i className="fas fa-file-medical"></i> Xem Báo Cáo Traceability
                                    </button>
                                ) : (
                                    <button className="view-report-btn disabled" disabled>
                                        <i className="fas fa-clock"></i> Chờ bác sĩ duyệt
                                    </button>
                                )}
                                
                                {/* Nút tải ảnh (Nếu cần) */}
                                <button className="download-btn" onClick={() => window.open(item.imageUrl, '_blank')}>
                                    <i className="fas fa-download"></i> Tải ảnh
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default PatientHistory;