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
            // Gọi API lấy lịch sử khám (Khớp với [HttpGet("examinations")])
            const data = await medicalApi.getExaminationHistory();
            setHistory(data || []);
        } catch (err) {
            console.error("Lỗi tải lịch sử khám:", err);
            setError("Không thể tải dữ liệu lịch sử. Vui lòng thử lại sau.");
        } finally {
            setLoading(false);
        }
    };

    // Hàm hỗ trợ hiển thị màu sắc dựa trên mức độ nghiêm trọng từ AI
    const getSeverityClass = (severity) => {
        switch (severity?.toLowerCase()) {
            case 'normal': return 'status-normal';
            case 'mild': return 'status-mild';
            case 'moderate': return 'status-moderate';
            case 'severe': return 'status-severe';
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
                <h3>Lịch sử chẩn đoán mạch máu võng mạc</h3>
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
                                    <span className="value">{new Date(item.examinationDate).toLocaleDateString('vi-VN')}</span>
                                </div>
                                <div className={`diagnosis-badge ${getSeverityClass(item.severity)}`}>
                                    {item.diagnosisResult || 'Chưa có kết quả'}
                                </div>
                            </div>

                            <div className="card-details">
                                <div className="detail-item">
                                    <span className="label">Bác sĩ phụ trách:</span>
                                    <span className="value">{item.doctorName || 'Hệ thống tự động'}</span>
                                </div>
                                <div className="detail-item">
                                    <span className="label">Độ tin cậy AI:</span>
                                    <span className="value">{(item.confidenceScore * 100).toFixed(1)}%</span>
                                </div>
                            </div>

                            <div className="card-actions">
                                <button className="view-report-btn">
                                    <i className="fas fa-file-medical"></i> Xem chi tiết báo cáo
                                </button>
                                <button className="download-btn">
                                    <i className="fas fa-download"></i> Tải ảnh võng mạc
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