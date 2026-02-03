import React, { useState, ChangeEvent } from 'react';
// @ts-ignore
import axiosClient from '../../../../../api/axiosClient'; 
// @ts-ignore
import { useAuth } from '../../../../../context/AuthContext'; 

// 1. Định nghĩa kiểu dữ liệu cho Props
interface UploadSectionProps {
    onUploadSuccess?: () => void;
}

const UploadSection: React.FC<UploadSectionProps> = ({ onUploadSuccess }) => {
    const { user } = useAuth(); // Lấy thông tin user
    
    // 2. Định nghĩa kiểu cho State
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [status, setStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
    const [result, setResult] = useState<string | null>(null);
    
    // [MỚI] State lưu kết quả AI trả về để hiển thị Popup
    const [aiResponse, setAiResponse] = useState<any>(null);
    const [showModal, setShowModal] = useState(false);

    // Xử lý khi chọn file
    const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const file = e.target.files[0];

            // [MỚI] Validate Client-side (FR-2)
            // 1. Kiểm tra định dạng ảnh
            const validTypes = ['image/jpeg', 'image/png', 'image/jpg'];
            if (!validTypes.includes(file.type)) {
                alert("❌ Định dạng không hợp lệ! Vui lòng chọn ảnh .JPG hoặc .PNG");
                return;
            }

            // 2. Kiểm tra dung lượng (Max 5MB)
            const maxSize = 5 * 1024 * 1024; // 5MB
            if (file.size > maxSize) {
                alert("❌ Ảnh quá lớn! Vui lòng chọn ảnh dưới 5MB.");
                return;
            }

            // Nếu hợp lệ thì set state như cũ
            setSelectedFile(file);
            setPreview(URL.createObjectURL(file));
            setStatus('idle');
            setResult(null);
            setAiResponse(null);
            setShowModal(false);
        }
    };

    // Gửi file lên Server
    const handleUpload = async () => {
        if (!selectedFile) return;

        // [QUAN TRỌNG] Logic lấy PatientId an toàn
        const patientId = user?.id || (user as any)?.userId || (user as any)?.sub || "";
        
        if (!patientId) {
            alert("Không tìm thấy thông tin bệnh nhân. Vui lòng đăng nhập lại.");
            return;
        }

        setStatus('uploading');
        const formData = new FormData();
        
        formData.append('File', selectedFile); 
        formData.append('PatientId', patientId);
        formData.append('ClinicId', "d2b51336-6c1c-426d-881e-45051666617a"); 

        try {
            // Gọi API bằng axiosClient
            const response = await axiosClient.post('/imaging/upload', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            console.log("Upload thành công:", response);
            setStatus('success');
            setResult("Ảnh đã được gửi đi phân tích. Vui lòng chờ kết quả...");
            
            // [MỚI] Lưu kết quả AI và hiện Popup ngay lập tức
            if (response) {
                setAiResponse(response); // Lưu response API (chứa riskLevel, score...)
                setShowModal(true);      // Bật Modal
            }
            
            // Callback thông báo ra ngoài (giữ nguyên logic cũ nhưng delay lâu hơn chút để xem modal)
            if (onUploadSuccess) {
                // Không auto reload ngay mà đợi user tắt popup hoặc delay lâu
            }
            
        } catch (error: any) {
            console.error("Lỗi upload:", error);
            setStatus('error');
            
            const errorMsg = error.response?.data?.message || error.response?.data?.title || error.message;
            alert("Lỗi tải ảnh: " + errorMsg);
        }
    };

    // Hàm đóng Modal và refresh danh sách
    const handleCloseModal = () => {
        setShowModal(false);
        setPreview(null);
        setSelectedFile(null);
        setStatus('idle');
        if (onUploadSuccess) onUploadSuccess(); // Reload lịch sử khi đóng modal
    };

    // --- PHẦN GIAO DIỆN ---
    return (
        <div className="upload-card" style={{ padding: '30px', background: '#fff', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', textAlign: 'center', position: 'relative' }}>
            <h3 style={{marginBottom: '20px', color: '#2c3e50'}}>Tải ảnh đáy mắt lên để chẩn đoán</h3>
            
            <input 
                type="file" 
                accept="image/png, image/jpeg, image/jpg" 
                onChange={handleFileSelect} 
                style={{ display: 'none' }} 
                id="file-upload"
            />
            
            <div style={{marginBottom: '20px'}}>
                {!preview ? (
                    <label htmlFor="file-upload" style={{ cursor: 'pointer', display: 'block', padding: '40px', border: '2px dashed #cbd5e0', borderRadius: '8px', color: '#718096' }}>
                        <i className="fas fa-cloud-upload-alt" style={{fontSize: '48px', marginBottom: '10px', color: '#4299e1'}}></i>
                        <p style={{marginTop: '10px'}}>Nhấn để chọn ảnh từ máy tính (JPG, PNG - Max 5MB)</p>
                    </label>
                ) : (
                    <div style={{ position: 'relative', display: 'inline-block' }}>
                        <img src={preview} alt="Preview" style={{ maxWidth: '100%', maxHeight: '300px', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }} />
                        <label htmlFor="file-upload" style={{ position: 'absolute', bottom: '10px', right: '10px', background: 'rgba(0,0,0,0.6)', color: '#fff', padding: '8px 15px', borderRadius: '4px', cursor: 'pointer', fontSize: '13px' }}>
                            <i className="fas fa-pen"></i> Đổi ảnh khác
                        </label>
                    </div>
                )}
            </div>

            {selectedFile && status !== 'success' && (
                <button 
                    onClick={handleUpload} 
                    disabled={status === 'uploading'}
                    style={{ 
                        marginTop: '10px', 
                        padding: '12px 40px', 
                        backgroundColor: status === 'uploading' ? '#cbd5e0' : '#4299e1', 
                        color: 'white', 
                        border: 'none', 
                        borderRadius: '30px',
                        cursor: status === 'uploading' ? 'not-allowed' : 'pointer',
                        fontSize: '16px',
                        fontWeight: '600',
                        boxShadow: '0 4px 6px rgba(66, 153, 225, 0.4)'
                    }}
                >
                    {status === 'uploading' ? (
                        <span><i className="fas fa-spinner fa-spin"></i> Đang phân tích AI...</span>
                    ) : (
                        <span><i className="fas fa-microscope"></i> Bắt đầu chẩn đoán</span>
                    )}
                </button>
            )}

            {/* [MỚI] POPUP KẾT QUẢ SƠ BỘ */}
            {showModal && aiResponse && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
                    background: 'rgba(0,0,0,0.7)', zIndex: 1000,
                    display: 'flex', justifyContent: 'center', alignItems: 'center'
                }}>
                    <div style={{
                        background: 'white', padding: '30px', borderRadius: '15px',
                        maxWidth: '500px', width: '90%', textAlign: 'center',
                        boxShadow: '0 10px 25px rgba(0,0,0,0.2)'
                    }}>
                        <div style={{ fontSize: '50px', marginBottom: '10px' }}>
                            {aiResponse.riskLevel === 'High' ? '⚠️' : '✅'}
                        </div>
                        <h2 style={{ 
                            color: aiResponse.riskLevel === 'High' ? '#e53e3e' : '#38a169',
                            marginBottom: '10px' 
                        }}>
                            {aiResponse.riskLevel === 'High' ? 'PHÁT HIỆN NGUY CƠ CAO' : 'KẾT QUẢ BÌNH THƯỜNG'}
                        </h2>
                        
                        <div style={{ background: '#f7fafc', padding: '15px', borderRadius: '8px', margin: '20px 0', textAlign: 'left' }}>
                            <p><strong>🔍 Chẩn đoán AI:</strong> {aiResponse.diagnosis || 'Không xác định'}</p>
                            <p><strong>📊 Độ tin cậy:</strong> {(aiResponse.confidenceScore * 100).toFixed(1)}%</p>
                            <p><strong>🩺 Lời khuyên:</strong> {aiResponse.riskLevel === 'High' ? 'Bạn nên đặt lịch khám với bác sĩ ngay lập tức.' : 'Hãy duy trì thói quen sinh hoạt lành mạnh.'}</p>
                        </div>

                        <button 
                            onClick={handleCloseModal}
                            style={{
                                background: '#3182ce', color: 'white', border: 'none',
                                padding: '10px 30px', borderRadius: '8px', cursor: 'pointer',
                                fontSize: '16px', fontWeight: 'bold'
                            }}
                        >
                            Đã hiểu & Xem lịch sử
                        </button>
                    </div>
                </div>
            )}
            
            {status === 'error' && (
                <div style={{ marginTop: '20px', color: '#e53e3e', padding: '10px', backgroundColor: '#fff5f5', borderRadius: '8px' }}>
                    <i className="fas fa-exclamation-circle"></i> Có lỗi xảy ra, vui lòng thử lại.
                </div>
            )}
        </div>
    );
};

export default UploadSection;