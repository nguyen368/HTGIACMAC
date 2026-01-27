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

    // Xử lý khi chọn file
    const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const file = e.target.files[0];
            setSelectedFile(file);
            setPreview(URL.createObjectURL(file));
            setStatus('idle');
            setResult(null);
        }
    };

    // Gửi file lên Server
    const handleUpload = async () => {
        if (!selectedFile) return;

        // [QUAN TRỌNG] Logic lấy PatientId an toàn (Fix lỗi TS2345)
        // Ưu tiên user.id -> user.userId -> user.sub -> chuỗi rỗng
        const patientId = user?.id || (user as any)?.userId || (user as any)?.sub || "";
        
        // Kiểm tra kỹ nếu không có ID thì báo lỗi ngay
        if (!patientId) {
            alert("Không tìm thấy thông tin bệnh nhân. Vui lòng đăng nhập lại.");
            return;
        }

        setStatus('uploading');
        const formData = new FormData();
        
        formData.append('File', selectedFile); 
        formData.append('PatientId', patientId);
        // Hardcode ClinicId tạm thời như code cũ của bạn
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
            
            // Callback thông báo ra ngoài để reload danh sách
            if (onUploadSuccess) {
                setTimeout(() => {
                    onUploadSuccess();
                }, 1500);
            }
            
        } catch (error: any) {
            console.error("Lỗi upload:", error);
            setStatus('error');
            
            const errorMsg = error.response?.data?.message || error.response?.data?.title || error.message;
            alert("Lỗi tải ảnh: " + errorMsg);
        }
    };

    // --- PHẦN GIAO DIỆN (GIỮ NGUYÊN STYLE CỦA BẠN) ---
    return (
        <div className="upload-card" style={{ padding: '30px', background: '#fff', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', textAlign: 'center' }}>
            <h3 style={{marginBottom: '20px', color: '#2c3e50'}}>Tải ảnh đáy mắt lên để chẩn đoán</h3>
            
            <input 
                type="file" 
                accept="image/*" 
                onChange={handleFileSelect} 
                style={{ display: 'none' }} 
                id="file-upload"
            />
            
            <div style={{marginBottom: '20px'}}>
                {!preview ? (
                    <label htmlFor="file-upload" style={{ cursor: 'pointer', display: 'block', padding: '40px', border: '2px dashed #cbd5e0', borderRadius: '8px', color: '#718096' }}>
                        <i className="fas fa-cloud-upload-alt" style={{fontSize: '48px', marginBottom: '10px', color: '#4299e1'}}></i>
                        <p style={{marginTop: '10px'}}>Nhấn để chọn ảnh từ máy tính</p>
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
                        <span><i className="fas fa-spinner fa-spin"></i> Đang tải lên...</span>
                    ) : (
                        <span><i className="fas fa-microscope"></i> Bắt đầu chẩn đoán</span>
                    )}
                </button>
            )}

            {status === 'success' && (
                <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#f0fff4', color: '#38a169', borderRadius: '8px', border: '1px solid #c6f6d5' }}>
                    <i className="fas fa-check-circle" style={{fontSize: '20px', verticalAlign: 'middle', marginRight: '10px'}}></i> 
                    <span style={{fontWeight: '500'}}>{result}</span>
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