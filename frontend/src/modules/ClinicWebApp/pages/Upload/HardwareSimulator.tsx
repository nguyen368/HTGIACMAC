import React, { useState, useEffect } from 'react';
// @ts-ignore
import medicalApi from '../../../../api/medicalApi';

const HardwareSimulator: React.FC = () => {
    const [deviceId, setDeviceId] = useState<string>("AURA-CAM-01");
    const [patientId, setPatientId] = useState<string>("");
    const [file, setFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(null); // Bổ sung: Xem trước ảnh
    const [log, setLog] = useState<string>("");
    const [isUploading, setIsUploading] = useState<boolean>(false); // Bổ sung: Trạng thái loading

    // Tạo ảnh xem trước khi chọn file
    useEffect(() => {
        if (!file) {
            setPreview(null);
            return;
        }
        const objectUrl = URL.createObjectURL(file);
        setPreview(objectUrl);
        return () => URL.revokeObjectURL(objectUrl);
    }, [file]);

    const handleCapture = async () => {
        if (!file || !patientId) {
            return alert("⚠️ Vui lòng nhập Patient ID và chọn file ảnh võng mạc.");
        }

        const formData = new FormData();
        formData.append("imageFile", file);
        formData.append("deviceId", deviceId);
        formData.append("patientId", patientId);

        try {
            setIsUploading(true);
            setLog("⏳ [IOT PROTOCOL] Establishing secure connection to Gateway...");
            
            // Gọi API hardware capture từ medicalApi
            const res = await medicalApi.hardwareCapture(formData);
            
            setLog(prev => prev + `\n✅ [200 OK] Image uploaded successfully! 
🆔 ImageID: ${res.imageId || 'GEN-001'}
🚀 AI Analysis triggered in background...
📡 SignalR Notification sent to Clinic Channel.`);
            
            // Tự động xóa file sau khi gửi thành công để tránh gửi nhầm
            setFile(null); 
        } catch (err: any) {
            console.error(err);
            setLog(prev => prev + `\n❌ [ERROR] Connection failed: ${err.message}`);
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <div className="container mt-5" style={{ maxWidth: '700px' }}>
            <div className="card shadow-lg border-danger">
                <div className="card-header bg-danger text-white d-flex justify-content-between align-items-center">
                    <h5 className="mb-0">🔧 Hardware Simulator (Fundus Camera v1.0)</h5>
                    <span className="badge bg-light text-danger">CONNECTED</span>
                </div>
                
                <div className="card-body">
                    <div className="row">
                        <div className="col-md-6">
                            <div className="mb-3">
                                <label className="form-label fw-bold">Device ID (Serial):</label>
                                <input 
                                    className="form-control" 
                                    value={deviceId} 
                                    onChange={e => setDeviceId(e.target.value)} 
                                />
                            </div>
                            <div className="mb-3">
                                <label className="form-label fw-bold">Target Patient ID (UUID):</label>
                                <input 
                                    className="form-control" 
                                    value={patientId} 
                                    onChange={e => setPatientId(e.target.value)} 
                                    placeholder="Dán mã UUID từ trang Bệnh nhân..." 
                                />
                                <small className="text-muted">Mã này dùng để gán ảnh vào đúng hồ sơ bệnh nhân.</small>
                            </div>
                            <div className="mb-3">
                                <label className="form-label fw-bold">Captured Image (Simulated):</label>
                                <input 
                                    type="file" 
                                    className="form-control" 
                                    accept="image/*"
                                    onChange={e => setFile(e.target.files ? e.target.files[0] : null)} 
                                />
                            </div>
                        </div>

                        <div className="col-md-6 d-flex flex-column align-items-center justify-content-center border-start">
                            <label className="fw-bold mb-2">📸 Live Preview</label>
                            <div style={{ 
                                width: '100%', 
                                height: '200px', 
                                border: '2px dashed #ccc', 
                                borderRadius: '10px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                overflow: 'hidden',
                                background: '#f8f9fa'
                            }}>
                                {preview ? (
                                    <img src={preview} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                ) : (
                                    <span className="text-muted">No Image Selected</span>
                                )}
                            </div>
                        </div>
                    </div>

                    <hr />

                    <button 
                        className={`btn ${isUploading ? 'btn-secondary' : 'btn-danger'} w-100 py-2 fw-bold`} 
                        onClick={handleCapture}
                        disabled={isUploading}
                    >
                        {isUploading ? '📤 PROCESSING...' : '📸 SIMULATE CAPTURE & SEND TO CLOUD'}
                    </button>
                    
                    <div className="mt-4">
                        <label className="fw-bold text-danger">📟 System Logs:</label>
                        <div style={{ 
                            backgroundColor: '#1e1e1e', 
                            color: '#00ff00', 
                            padding: '15px', 
                            borderRadius: '8px',
                            fontSize: '13px',
                            minHeight: '120px',
                            maxHeight: '200px',
                            overflowY: 'auto',
                            boxShadow: 'inset 0 0 10px #000'
                        }}>
                            <pre style={{ whiteSpace: 'pre-wrap', margin: 0 }}>
                                {log || "> System ready. Waiting for hardware capture command..."}
                            </pre>
                        </div>
                    </div>
                </div>
                <div className="card-footer text-center py-2 bg-light">
                    <small className="text-muted italic">AURA Medical IoT Gateway Integration</small>
                </div>
            </div>
        </div>
    );
};

export default HardwareSimulator;