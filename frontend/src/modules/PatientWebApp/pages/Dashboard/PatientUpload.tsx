import React, { useState, ChangeEvent } from 'react';
import imagingApi from '../../../../api/imagingApi';
import { useAuth } from '../../../../context/AuthContext';

interface PatientUploadProps {
    onUploadSuccess?: () => void;
}

const PatientUpload: React.FC<PatientUploadProps> = ({ onUploadSuccess }) => {
    const { user } = useAuth();
    const [file, setFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const [result, setResult] = useState<any>(null);

    const clinicId = "d2b51336-6c1c-426d-881e-45051666617a"; 

    const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
        const selected = e.target.files?.[0];
        if (selected) {
            setFile(selected);
            setPreview(URL.createObjectURL(selected));
            setResult(null); 
        }
    };

    const handleUpload = async () => {
        if (!file || !user) return;
        const patientId = user.id;
        setLoading(true);
        try {
            // Lưu ý: data trả về từ Axios nằm trong .data
            const response = await imagingApi.uploadSingle(file, clinicId, patientId);
            const data = response.data || response;
            const details = data.details || data.Details || [];
            if (details.length > 0) {
                setResult(details[0]);
            }
        } catch (error: any) {
            alert(`❌ Lỗi: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    const renderResult = () => {
        if (!result) return null;
        const ai = result.aiDiagnosis || result.AiDiagnosis || {};
        const meta = ai.metadata || {};
        const isRejected = result.status === 'Rejected' || ai.status === 'Rejected' || ai.risk_level === 'Invalid';

        return (
            <div style={{ marginTop: '30px', width: '100%' }}>
                <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                    <div style={{ background: isRejected ? '#fff1f2' : '#f0f9ff', padding: '15px 20px', display: 'flex', justifyContent: 'space-between' }}>
                        <h3>{isRejected ? 'Hệ thống từ chối ảnh' : 'Kết quả Phân tích AI'}</h3>
                    </div>
                    <div style={{ padding: '24px' }}>
                        <img src={result.Url || result.url} style={{ width: '100%', maxHeight: '350px', objectFit: 'contain' }} alt="Gốc" />
                        {!isRejected && <img src={ai.heatmap_url} style={{ width: '100%', marginTop: '20px' }} alt="Heatmap" />}
                        <div style={{ marginTop: '20px', padding: '15px', background: '#f8fafc' }}>
                             <p><b>Chẩn đoán:</b> {ai.diagnosis || ai.result}</p>
                             <p><b>Rủi ro:</b> {ai.risk_level} ({Math.round(ai.risk_score || 0)}%)</p>
                        </div>
                    </div>
                </div>
                <div style={{ textAlign: 'center', marginTop: '20px' }}>
                    <button className="btn btn-secondary" onClick={() => { setFile(null); setPreview(null); setResult(null); }}>Chụp ảnh khác</button>
                    <button className="btn btn-dark" style={{marginLeft: '10px'}} onClick={() => onUploadSuccess?.()}>Lịch sử</button>
                </div>
            </div>
        );
    };

    return (
        <div className="pro-card p-4">
            <h3>Hệ thống Sàng lọc AI</h3>
            <div className="text-center">
                {!result ? (
                    <div className="upload-box" onClick={() => document.getElementById('file-input')?.click()} style={{ cursor: 'pointer', border: '2px dashed #ccc', padding: '40px' }}>
                        {preview ? <img src={preview} style={{ maxHeight: '300px' }} /> : <p>Nhấn để chọn ảnh</p>}
                        <input type="file" id="file-input" hidden onChange={handleFileChange} accept="image/*" />
                    </div>
                ) : renderResult()}
                {file && !result && <button className="btn btn-primary mt-4 w-100" onClick={handleUpload} disabled={loading}>{loading ? 'Đang phân tích...' : 'Gửi đi phân tích AI'}</button>}
            </div>
        </div>
    );
};

export default PatientUpload;