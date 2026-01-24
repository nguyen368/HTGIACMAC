import React, { useState, useEffect } from 'react';
import medicalApi from '../../../../api/medicalApi';
// Import interface để định nghĩa kiểu dữ liệu
import { Examination } from '../../../../types/medical';
import './PatientHistory.css';

const PatientHistory: React.FC = () => {
    // 1. Sửa lỗi SetStateAction<never[]>: Khai báo kiểu Examination cho mảng history
    const [history, setHistory] = useState<Examination[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [filter, setFilter] = useState<string>('all'); // Bộ lọc trạng thái

    useEffect(() => {
        fetchHistory();
    }, []);

    const fetchHistory = async () => {
        try {
            setLoading(true);
            // API trả về Promise<Examination[]>
            const data = await medicalApi.getExaminationHistory();
            setHistory(data || []);
        } catch (err) {
            console.error("Lỗi tải lịch sử:", err);
        } finally {
            setLoading(false);
        }
    };

    // 2. Sửa lỗi Parameter 'examId' implicitly has an 'any' type: Định nghĩa kiểu string
    const handleViewReport = async (examId: string) => {
        try {
            // Gọi hàm getReportData (Đảm bảo hàm này đã được thêm vào file medicalApi.ts)
            const report = await medicalApi.getReportData(examId);
            
            // 3. Giữ nguyên 100% logic alert truy xuất nguồn gốc (Traceability) của bạn
            alert(
                `📄 PHIẾU KẾT QUẢ ĐIỆN TỬ - AURA SYSTEM\n` +
                `-----------------------------------\n` +
                `Bệnh nhân: ${report.patientInfo?.name || 'N/A'}\n` +
                `Ngày khám: ${new Date(report.printedAt).toLocaleDateString('vi-VN')}\n` +
                `Kết luận: ${report.diagnosisResult}\n\n` +
                `🔍 THÔNG TIN AI (TRUY XUẤT):\n` +
                `- Phiên bản AI: ${report.technicalTraceability?.algorithmVersion || 'v1.0'}\n` +
                `- Confidence Score: ${report.technicalTraceability?.aiConfidenceScore || 0}%\n` +
                `- Mã thiết bị: ${report.technicalTraceability?.systemName || 'AURA-SCANNER'}`
            );
        } catch (error) {
            alert("Báo cáo đang được khởi tạo hoặc chưa có kết luận cuối cùng từ Bác sĩ.");
        }
    };

    // Logic lọc danh sách dựa trên trạng thái (Giữ nguyên logic cũ)
    const filteredHistory = history.filter(item => {
        if (filter === 'all') return true;
        return item.status === filter;
    });

    if (loading) return (
        <div className="p-5 text-center">
            <div className="spinner-border text-primary" role="status"></div>
            <div className="mt-2">Đang tải lịch sử chẩn đoán từ AURA Cloud...</div>
        </div>
    );

    return (
        <div className="history-container animate-fade-in">
            {/* Header với thông tin dự án */}
            <div className="history-header d-flex justify-content-between align-items-center">
                <div>
                    <h3>Lịch sử chẩn đoán võng mạc</h3>
                    <p className="text-muted small">Mọi dữ liệu đều được lưu trữ bảo mật qua hệ thống Microservices</p>
                </div>
                <div className="text-right">
                    <span className="project-code">Project: SP26SE025</span>
                    <button className="btn btn-sm btn-outline-primary ms-2" onClick={fetchHistory}>
                        <i className="fas fa-sync"></i> Làm mới
                    </button>
                </div>
            </div>

            {/* Thanh điều hướng bộ lọc (Filter bar) */}
            <div className="filter-bar mb-4">
                <button className={`filter-btn ${filter === 'all' ? 'active' : ''}`} onClick={() => setFilter('all')}>Tất cả</button>
                <button className={`filter-btn ${filter === 'Verified' ? 'active' : ''}`} onClick={() => setFilter('Verified')}>Đã xác thực</button>
                <button className={`filter-btn ${filter === 'Pending' ? 'active' : ''}`} onClick={() => setFilter('Pending')}>Đang xử lý</button>
            </div>

            {filteredHistory.length === 0 ? (
                <div className="no-data-card text-center p-5">
                    <i className="fas fa-folder-open fa-3x mb-3 text-light"></i>
                    <div className="no-data">Bạn chưa thực hiện ca sàng lọc nào.</div>
                </div>
            ) : (
                <div className="history-list">
                    {/* 4. Sửa lỗi Property 'status' does not exist on type 'never': Định nghĩa item là Examination */}
                    {filteredHistory.map((item: Examination) => (
                        <div key={item.id} className="history-card shadow-sm">
                            <div className="card-top">
                                <span className="date">📅 Ngày khám: {new Date(item.examDate).toLocaleDateString('vi-VN')}</span>
                                <div className={`status-badge ${item.status}`}>
                                    {item.status === 'Verified' ? '✓ Đã xác thực' : '⏳ Đang xử lý'}
                                </div>
                            </div>
                            
                            <div className="card-body">
                                <div className="img-wrapper">
                                    <img src={item.imageUrl} alt="Eye Scan" className="thumb" />
                                    <div className="img-overlay" onClick={() => window.open(item.imageUrl, '_blank')}>
                                        <i className="fas fa-search-plus"></i>
                                    </div>
                                </div>
                                
                                <div className="info">
                                    <p className="result">
                                        <b>Kết luận bác sĩ:</b> <br />
                                        <span>{item.diagnosisResult || item.result || "Đang chờ bác sĩ chuyên khoa duyệt..."}</span>
                                    </p>
                                    <div className={`risk-box ${item.aiRiskLevel}`}>
                                        <div className="risk-label">Rủi ro AI dự đoán:</div>
                                        <div className="risk-value">
                                            {item.aiRiskLevel} <span>({item.aiRiskScore}%)</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="card-footer">
                                <button 
                                    className="btn-report" 
                                    onClick={() => handleViewReport(item.id)} 
                                    disabled={item.status !== 'Verified'}
                                    title={item.status !== 'Verified' ? "Cần bác sĩ duyệt để xem báo cáo" : "Xem phiếu kết quả điện tử"}
                                >
                                    <i className="fas fa-file-signature"></i> Xem báo cáo chi tiết
                                </button>
                                <button className="btn-img" onClick={() => window.open(item.imageUrl, '_blank')}>
                                    <i className="fas fa-eye"></i> Ảnh gốc
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