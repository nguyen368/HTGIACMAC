import React, { useState } from 'react';
import imagingApi from '../../../../api/imagingApi';
import { useAuth } from '../../../../context/AuthContext';

const PatientUpload = ({ onUploadSuccess }) => {
    const { user } = useAuth();
    const [file, setFile] = useState(null);
    const [preview, setPreview] = useState(null);
    const [loading, setLoading] = useState(false);
    
    // --- KHU VỰC CẤU HÌNH ---
    // 1. Nếu bạn đang test một mình, hãy thử để ClinicId rỗng (null) xem server có cho phép không.
    // Nếu server bắt buộc phải có, bạn cần lấy một ID thật trong database của bảng Clinics.
    const clinicId = "3fa85f64-5717-4562-b3fc-2c963f66afa6"; // <--- CẢNH BÁO: ID này có thể gây lỗi nếu DB không có.

    const handleFileChange = (e) => {
        const selected = e.target.files[0];
        if (selected) {
            setFile(selected);
            setPreview(URL.createObjectURL(selected));
        }
    };

    const handleUpload = async () => {
        if (!file || !user) return;

        // [DEBUG] In ra để kiểm tra xem ID có bị null không
        // Hãy bật F12 (Console) lên xem dòng này khi bấm nút
        console.log("Dữ liệu chuẩn bị gửi:", {
            file: file.name,
            clinicId: clinicId,
            patientId: user.id || user.userId || "KHÔNG TÌM THẤY ID"
        });

        // Lấy PatientId: Thử user.id trước, nếu không có thì thử user.userId
        const patientIdToSend = user.id || user.userId;

        if (!patientIdToSend) {
            alert("❌ Lỗi: Không tìm thấy ID bệnh nhân. Vui lòng đăng nhập lại.");
            return;
        }

        setLoading(true);
        try {
            await imagingApi.uploadSingle(file, clinicId, patientIdToSend);
            
            alert("✅ Upload thành công! Đang chuyển sang lịch sử...");
            if (onUploadSuccess) {
                onUploadSuccess();
            }

        } catch (error) {
            console.error("Upload Error:", error);
            // Hiển thị chi tiết lỗi từ Server trả về (nếu có)
            const serverMessage = error.response?.data?.title || error.response?.data || error.message;
            alert(`❌ Lỗi Upload (${error.response?.status || 'Unknown'}): ${serverMessage}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="pro-card">
            <div className="card-header">
                <div>
                    <h3>Tải lên hình ảnh đáy mắt</h3>
                    <p className="subtitle">Hệ thống AI sẽ tự động phân tích và đưa ra cảnh báo sớm.</p>
                </div>
            </div>

            <div className="form-body" style={{display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
                
                <div className="upload-wrapper" onClick={() => document.getElementById('file-input').click()}>
                    {preview ? (
                        <img src={preview} alt="Preview" style={{maxHeight: '300px', borderRadius: '12px'}} />
                    ) : (
                        <>
                            <i className="fas fa-cloud-upload-alt upload-icon-large"></i>
                            <h4>Nhấn vào đây để chọn ảnh</h4>
                            <p className="upload-hint">Hỗ trợ JPG, PNG (Max 5MB)</p>
                        </>
                    )}
                    <input type="file" id="file-input" hidden onChange={handleFileChange} accept="image/*" />
                </div>

                {file && (
                    <button className="btn-save" onClick={handleUpload} disabled={loading} 
                        style={{background: 'var(--accent-color)', width: '100%', justifyContent: 'center'}}>
                        {loading ? 'Đang xử lý...' : 'Gửi cho AI Phân Tích'} <i className="fas fa-paper-plane"></i>
                    </button>
                )}
            </div>
        </div>
    );
};

export default PatientUpload;