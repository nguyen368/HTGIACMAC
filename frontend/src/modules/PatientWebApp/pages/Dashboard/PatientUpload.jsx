import React, { useState } from 'react';
import imagingApi from '../../../../api/imagingApi';
import { useAuth } from '../../../../context/AuthContext';

const PatientUpload = ({ onUploadSuccess }) => {
    const { user } = useAuth();
    const [file, setFile] = useState(null);
    const [preview, setPreview] = useState(null);
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);

    const clinicId = "d2b51336-6c1c-426d-881e-45051666617a"; 

    const handleFileChange = (e) => {
        const selected = e.target.files[0];
        if (selected) {
            setFile(selected);
            setPreview(URL.createObjectURL(selected));
            setResult(null); 
        }
    };

    const handleUpload = async () => {
        if (!file || !user) return;
        const patientId = user.id || user.userId;
        setLoading(true);
        try {
            const res = await imagingApi.uploadSingle(file, clinicId, patientId);
            const details = res.details || res.Details || [];
            if (details.length > 0) {
                setResult(details[0]);
            }
        } catch (error) {
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
            <div style={{ marginTop: '30px', width: '100%', animation: 'fadeIn 0.5s' }}>
                <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}>
                    
                    <div style={{ background: isRejected ? '#fff1f2' : '#f0f9ff', padding: '15px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <i className={`fas ${isRejected ? 'fa-user-slash' : 'fa-robot'}`} style={{ color: isRejected ? '#ef4444' : '#0284c7' }}></i>
                            <h3 style={{ margin: 0, color: isRejected ? '#991b1b' : '#0c4a6e', fontSize: '17px' }}>
                                {isRejected ? 'Hệ thống từ chối ảnh' : 'Kết quả Phân tích AI'}
                            </h3>
                        </div>
                        <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 'bold' }}>
                            Tâm quét: X:{meta.x || 0}, Y:{meta.y || 0}
                        </div>
                    </div>

                    <div style={{ padding: '24px' }}>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '30px' }}>
                            <div style={{ flex: 1, minWidth: '280px' }}>
                                <p style={{ fontWeight: 'bold', marginBottom: '12px', color: '#475569' }}>📸 Ảnh gốc</p>
                                <div style={{ background: '#000', borderRadius: '12px', padding: '2px' }}>
                                    <img src={result.Url || result.url} style={{ width: '100%', borderRadius: '10px', maxHeight: '350px', objectFit: 'contain' }} alt="Gốc" />
                                </div>
                            </div>

                            <div style={{ flex: 1, minWidth: '280px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                                    <p style={{ fontWeight: 'bold', color: isRejected ? '#94a3b8' : '#dc2626', margin: 0 }}>🔥 Bản đồ nhiệt (heatmap)</p>
                                    {!isRejected && <span style={{ background: '#fee2e2', color: '#991b1b', padding: '4px 12px', borderRadius: '20px', fontSize: '13px', fontWeight: 'bold' }}>Rủi ro: {Math.round(ai.risk_score || 0)}%</span>}
                                </div>
                                <div style={{ position: 'relative', background: '#000', borderRadius: '12px', minHeight: '250px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: isRejected ? '2px dashed #cbd5e1' : 'none' }}>
                                    {isRejected ? (
                                        <div style={{textAlign: 'center', color: '#ef4444'}}>
                                            <i className="fas fa-eye-slash" style={{fontSize: '50px', marginBottom: '10px'}}></i>
                                            <p style={{fontWeight: 'bold', margin: 0}}>Không phải võng mạc</p>
                                        </div>
                                    ) : (
                                        <img src={ai.heatmap_url} style={{ width: '100%', borderRadius: '10px', maxHeight: '350px', objectFit: 'contain' }} alt="Heatmap" />
                                    )}
                                </div>
                            </div>
                        </div>

                        <div style={{ marginTop: '24px', padding: '20px', background: isRejected ? '#fff1f2' : '#f8fafc', borderRadius: '12px', borderLeft: isRejected ? '6px solid #ef4444' : '6px solid #3b82f6' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <div>
                                    <h4 style={{ margin: '0 0 8px 0', color: '#1e293b' }}>{isRejected ? '❌ Lý do hệ thống:' : '✅ Chẩn đoán sơ bộ:'}</h4>
                                    <p style={{ margin: 0, fontSize: '18px', fontWeight: 'bold', color: isRejected ? '#be123c' : '#1e40af' }}>{ai.diagnosis || ai.result}</p>
                                </div>
                                {!isRejected && (
                                    <div style={{ textAlign: 'right' }}>
                                        <p style={{ margin: '0 0 5px 0', color: '#64748b', fontSize: '13px' }}>Mức độ:</p>
                                        <span style={{ padding: '5px 15px', borderRadius: '8px', color: '#fff', fontWeight: 'bold', background: (ai.risk_level || ai.riskLevel) === 'High' ? '#ef4444' : ((ai.risk_level || ai.riskLevel) === 'Medium' ? '#f59e0b' : '#10b981') }}>{ai.risk_level || ai.riskLevel}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
                <div style={{textAlign: 'center', marginTop: '30px', display: 'flex', justifyContent: 'center', gap: '15px'}}>
                     <button className="btn-save" style={{background: 'white', color: '#333', border: '1px solid #cbd5e1', padding: '12px 25px', borderRadius: '10px'}} onClick={() => { setFile(null); setPreview(null); setResult(null); }}>Chụp ảnh khác</button>
                     <button className="btn-save" style={{background: '#1e293b', padding: '12px 25px', borderRadius: '10px'}} onClick={() => onUploadSuccess && onUploadSuccess()}>Xem lịch sử khám</button>
                </div>
            </div>
        );
    };

    return (
        <div className="pro-card">
            <div className="card-header"><h3>Hệ thống Sàng lọc AI</h3></div>
            <div className="form-body" style={{display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
                {!result ? (
                    <div className="upload-wrapper" onClick={() => document.getElementById('file-input').click()} style={{cursor: 'pointer', border: '2px dashed #cbd5e1', padding: '60px 40px', borderRadius: '16px', width: '100%', maxWidth: '600px', textAlign: 'center', background: '#f8fafc'}}>
                        {preview ? <img src={preview} style={{maxHeight: '350px', borderRadius: '12px'}} /> : <><i className="fas fa-cloud-upload-alt" style={{fontSize: '60px', color: '#94a3b8', marginBottom: '16px'}}></i><h4>Nhấn để chọn ảnh</h4></>}
                        <input type="file" id="file-input" hidden onChange={handleFileChange} accept="image/*" />
                    </div>
                ) : renderResult()}
                {file && !result && <button className="btn-save" onClick={handleUpload} disabled={loading} style={{background: '#0ea5e9', color: 'white', width: '100%', maxWidth: '350px', marginTop: '30px', padding: '15px', borderRadius: '12px', border: 'none', fontWeight: 'bold'}}>{loading ? 'Đang phân tích...' : 'Gửi đi phân tích AI'}</button>}
            </div>
        </div>
    );
};

export default PatientUpload;