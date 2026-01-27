import React, { useState, ChangeEvent } from 'react';
// @ts-ignore
import imagingApi from '../../../../api/imagingApi';
// @ts-ignore
import { useAuth } from '../../../../context/AuthContext';
import '../Dashboard/PatientHome.css';

const PatientUpload: React.FC<{ onUploadSuccess?: () => void }> = ({ onUploadSuccess }) => {
    const { user } = useAuth();
    const [file, setFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const [result, setResult] = useState<any>(null);

    // Xử lý kéo thả
    const onDrop = (e: React.DragEvent) => {
        e.preventDefault(); setIsDragging(false);
        const f = e.dataTransfer.files[0];
        if (f && f.type.startsWith('image/')) {
            setFile(f); setPreview(URL.createObjectURL(f));
        }
    };

    const handleUpload = async () => {
        if (!file || !user) return;
        const pId = (user as any).id || (user as any).userId || (user as any).sub || "";
        setLoading(true);
        try {
            const res: any = await imagingApi.uploadSingle(file, "d2b51336-6c1c-426d-881e-45051666617a", pId);
            const data = res.data || res;
            const details = data.details || data.Details || (data.imageUrl ? [data] : []);
            if (details.length > 0) setResult(details[0]);
            else { alert("Thành công! AI đang xử lý."); onUploadSuccess?.(); }
        } catch (error: any) { alert("Lỗi: " + error.message); } 
        finally { setLoading(false); }
    };

    return (
        <div className="dashboard-home animate-fade-in">
            <div className="welcome-banner">
                <div className="welcome-content">
                    <h2>Sàng lọc AI Cao cấp ✨</h2>
                    <p>Ứng dụng Deep Learning để chẩn đoán tổn thương võng mạc chính xác.</p>
                </div>
            </div>

            <div className="pro-card p-5 mt-4">
                {!result ? (
                    <div className="upload-container text-center">
                        <div 
                            className={`upload-wrapper ${isDragging ? 'dragging' : ''}`}
                            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                            onDragLeave={() => setIsDragging(false)}
                            onDrop={onDrop}
                            onClick={() => document.getElementById('file-up-id')?.click()}
                            style={{ border: isDragging ? '3px solid #0ea5e9' : '3px dashed #cbd5e0', padding: '60px', borderRadius: '24px', cursor: 'pointer', background: isDragging ? '#f0f9ff' : '#f8fafc', transition: '0.3s' }}
                        >
                            {preview ? <img src={preview} style={{maxHeight:'350px', borderRadius:'12px'}} /> : 
                            <><i className="fas fa-cloud-upload-alt" style={{fontSize:'80px', color:'#0ea5e9', marginBottom:'20px'}}></i><h3>Kéo thả hoặc nhấn chọn ảnh</h3></>}
                            <input type="file" id="file-up-id" hidden accept="image/*" onChange={(e) => {
                                const f = e.target.files?.[0];
                                if(f) { setFile(f); setPreview(URL.createObjectURL(f)); }
                            }} />
                        </div>
                        {file && <button className="btn-save w-100 mt-4" style={{height:'60px'}} onClick={handleUpload} disabled={loading}>
                            {loading ? "ĐANG PHÂN TÍCH AI..." : "BẮT ĐẦU CHẨN ĐOÁN"}
                        </button>}
                    </div>
                ) : (
                    /* UI HIỂN THỊ HEATMAP CỦA BẠN */
                    <div className="ai-result-panel animate-fade-in">
                        <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'20px'}}>
                            <div className="pro-card p-3 text-center"><p className="small">Ảnh gốc</p><img src={result.url || result.Url} style={{width:'100%', borderRadius:'8px'}} /></div>
                            <div className="pro-card p-3 text-center"><p className="small">Vùng tổn thương</p><img src={result.aiDiagnosis?.heatmap_url} style={{width:'100%', borderRadius:'8px'}} /></div>
                        </div>
                        <div className="pro-card mt-4 p-4 text-left" style={{background: '#f0fdf4', border:'none'}}>
                            <h4>Chẩn đoán: {result.aiDiagnosis?.diagnosis}</h4>
                            <p>Độ rủi ro: <b>{result.aiDiagnosis?.risk_level} ({result.aiDiagnosis?.risk_score}%)</b></p>
                            <button className="btn-save mt-3" onClick={() => onUploadSuccess?.()}>Về Lịch Sử</button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
export default PatientUpload;