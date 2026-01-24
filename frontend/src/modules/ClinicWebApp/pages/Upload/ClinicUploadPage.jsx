import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from 'react-router-dom';
import imagingApi from "../../../../api/imagingApi"; 
import medicalApi from "../../../../api/medicalApi"; 
import authApi from "../../../../api/authApi"; 
import "./ClinicUploadPage.css"; 

const ClinicUploadPage = () => {
    const navigate = useNavigate();

    // --- STATES CHÍNH ---
    const [activeTab, setActiveTab] = useState("upload"); 
    const [activeUploadMode, setActiveUploadMode] = useState("single"); 
    const [selectedFile, setSelectedFile] = useState(null);
    const [loading, setLoading] = useState(false);
    const [uploadResults, setUploadResults] = useState([]); 
    const [stats, setStats] = useState(null); 
    const [patientImages, setPatientImages] = useState([]); 
    const [isLoadingImages, setIsLoadingImages] = useState(false);
    const [patients, setPatients] = useState([]);
    const [selectedPatientId, setSelectedPatientId] = useState("");

    // --- STATES CHO MODAL THÊM BỆNH NHÂN ---
    const [showModal, setShowModal] = useState(false);
    const [newPatientForm, setNewPatientForm] = useState({
        fullName: '', citizenId: '', phoneNumber: '', age: 30, gender: 'Male'
    });

    // Clinic ID cố định
    const CURRENT_CLINIC_ID = "d2b51336-6c1c-426d-881e-45051666617a";

    // --- FETCH LOGIC ---
    const fetchPatients = useCallback(async () => {
        try {
            const res = await authApi.getAllPatients();
            const data = res.value || res.data?.value || res;
            const patientList = Array.isArray(data) ? data : [];
            setPatients(patientList);
        } catch (error) {
            console.error("Lỗi lấy danh sách bệnh nhân:", error);
        }
    }, []);

    const fetchStats = useCallback(async () => {
        try {
            const data = await imagingApi.getStats(CURRENT_CLINIC_ID);
            setStats(data);
        } catch (error) { 
            console.error("Lỗi tải thống kê:", error); 
        }
    }, [CURRENT_CLINIC_ID]);

    const fetchPatientImages = useCallback(async () => {
        if (!selectedPatientId) return;
        setIsLoadingImages(true);
        try {
            const data = await imagingApi.getImagesByPatient(selectedPatientId);
            const images = Array.isArray(data) ? data : (data.data || []);
            setPatientImages(images);
        } catch (error) {
            setPatientImages([]);
        } finally {
            setIsLoadingImages(false);
        }
    }, [selectedPatientId]);

    // --- EFFECTS ---
    useEffect(() => {
        fetchPatients(); 
        fetchStats();
    }, [fetchPatients, fetchStats]);

    useEffect(() => {
        if (activeTab === 'storage' && selectedPatientId) {
            fetchPatientImages();
        }
    }, [activeTab, selectedPatientId, fetchPatientImages]);

    // --- HANDLERS ---
    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) setSelectedFile(file);
    };

    const handleUpload = async () => {
        if (!selectedFile) return alert("Vui lòng chọn file!");
        if (!selectedPatientId) return alert("Vui lòng chọn Bệnh nhân!");
        setLoading(true);
        setUploadResults([]); 
        try {
            let res;
            if (activeUploadMode === 'batch') {
                res = await imagingApi.batchUpload(selectedFile, CURRENT_CLINIC_ID, selectedPatientId);
            } else {
                res = await imagingApi.uploadSingle(selectedFile, CURRENT_CLINIC_ID, selectedPatientId);
            }
            
            const details = res.details || res.Details || [];
            setUploadResults(details);
            
            if (activeUploadMode === 'batch') {
                alert(`✅ Xử lý hoàn tất lô ảnh!`);
            }
            
            fetchStats(); 
        } catch (err) {
            alert("❌ Lỗi hệ thống: " + (err.message || "Unknown"));
        } finally { 
            setLoading(false); 
        }
    };

    const handleDeleteImage = async (imageId) => {
        if(!window.confirm("Xác nhận xóa ảnh này?")) return;
        try {
            await imagingApi.deleteImage(imageId);
            alert("Đã xóa thành công.");
            fetchPatientImages();
            fetchStats();
        } catch (error) { 
            alert("Lỗi khi xóa: " + error.message); 
        }
    };

    // --- HANDLER TẠO BỆNH NHÂN ---
    const handleCreatePatient = async () => {
        if (!newPatientForm.fullName) return alert("Vui lòng nhập tên!");
        try {
            setLoading(true);
            const res = await authApi.createPatient(newPatientForm);
            const newPatient = res.data || res;

            setPatients(prev => [newPatient, ...prev]);
            setSelectedPatientId(newPatient.id || newPatient.Id);
            setShowModal(false);
            setNewPatientForm({ fullName: '', citizenId: '', phoneNumber: '', age: 30, gender: 'Male' });
            alert("✅ Đã thêm hồ sơ bệnh nhân mới!");
        } catch (error) {
            console.error(error);
            alert("Lỗi khi tạo bệnh nhân: " + (error.response?.data || error.message));
        } finally {
            setLoading(false);
        }
    };

    // --- SUB-RENDERS ---
    const renderPatientSelector = () => (
        <div style={{ background: '#e0f2fe', padding: '15px 20px', borderRadius: '12px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '15px', border: '1px solid #bae6fd' }}>
            <div style={{fontWeight: '700', color: '#0369a1', minWidth: '160px'}}>
                <i className="fas fa-user-injured"></i> Chọn Bệnh Nhân:
            </div>
            
            <select className="form-select" value={selectedPatientId} onChange={(e) => setSelectedPatientId(e.target.value)} style={{ flex: 1, padding: '10px', borderRadius: '8px' }}>
                <option value="">-- Chọn hồ sơ bệnh nhân --</option>
                {patients.map(p => (
                    <option key={p.id} value={p.id}>{p.fullName || p.userName} - {p.citizenId || p.email}</option>
                ))}
            </select>
            
            <button 
                onClick={() => setShowModal(true)}
                style={{
                    background: '#0ea5e9', color: 'white', border: 'none', 
                    borderRadius: '8px', width: '40px', height: '40px', 
                    fontSize: '20px', cursor: 'pointer', display: 'flex', 
                    alignItems: 'center', justifyContent: 'center'
                }}
                title="Thêm bệnh nhân mới"
            >
                +
            </button>
        </div>
    );

    const renderSidebar = () => {
        const menuItems = [
            { id: "upload", icon: "fa-cloud-upload-alt", label: "Upload & AI" },
            { id: "storage", icon: "fa-database", label: "Kho dữ liệu" },
            { id: "validation", icon: "fa-history", label: "Lịch sử gần đây" },
            { id: "analytics", icon: "fa-chart-pie", label: "Thống kê" },
        ];
        return (
            <div className="services-nav">
                <div className="nav-group-title">Menu Chức năng</div>
                {menuItems.map(item => (
                    <div key={item.id} className={`nav-item ${activeTab === item.id ? "active" : ""}`} onClick={() => setActiveTab(item.id)}>
                        <i className={`fas ${item.icon}`}></i> {item.label}
                    </div>
                ))}
            </div>
        );
    };

    return (
        <div className="container">
            <div className="header"><div className="logo-text"><h1>AURA IMAGING SUITE</h1></div></div>
            <div className="main-content">
                {renderSidebar()}
                <div className="services-container">
                    {(activeTab === 'upload' || activeTab === 'storage') && renderPatientSelector()}
                    
                    {/* --- TAB UPLOAD & AI --- */}
                    {activeTab === 'upload' && (
                        <div className="service-content active">
                            <h2 className="section-title-main">Upload Hình ảnh</h2>
                            <div className="upload-grid">
                                <div className={`upload-card ${activeUploadMode === 'single' ? 'active' : ''}`} onClick={() => setActiveUploadMode('single')}>
                                    <div className="upload-card-inner">
                                        <div className="upload-card-header">
                                            <div className="upload-card-icon"><i className="fas fa-image"></i></div>
                                            <div className="upload-card-title"><h3>Upload Đơn lẻ</h3><p>.jpg, .png</p></div>
                                        </div>
                                        <div className="dropzone">
                                            {activeUploadMode === 'single' && <input type="file" onChange={handleFileChange} accept="image/*" />}
                                            <i className="fas fa-cloud-upload-alt dropzone-icon"></i><div>Chọn 1 ảnh</div>
                                        </div>
                                    </div>
                                </div>
                                <div className={`upload-card ${activeUploadMode === 'batch' ? 'active' : ''}`} onClick={() => setActiveUploadMode('batch')}>
                                    <div className="upload-card-inner">
                                        <div className="upload-card-header">
                                            <div className="upload-card-icon"><i className="fas fa-file-archive"></i></div>
                                            <div className="upload-card-title"><h3>Upload Zip</h3><p>Nén nhiều ảnh</p></div>
                                        </div>
                                        <div className="dropzone">
                                            {activeUploadMode === 'batch' && <input type="file" onChange={handleFileChange} accept=".zip" />}
                                            <i className="fas fa-box-open dropzone-icon"></i><div>Chọn file .ZIP</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div style={{textAlign: 'center', marginBottom: '30px'}}>
                                <button className="btn-modern" onClick={handleUpload} disabled={!selectedFile || !selectedPatientId || loading}>
                                    {loading ? "Đang xử lý..." : "Bắt đầu Upload"}
                                </button>
                            </div>
                            
                            {/* --- KẾT QUẢ PHÂN TÍCH --- */}
                            {uploadResults.length > 0 && (
                                <div className="results-wrapper" style={{ marginTop: '30px' }}>
                                    {uploadResults.map((item, idx) => {
                                        const riskScore = item.aiDiagnosis?.risk_score || 0;
                                        let displayRiskLevel = item.aiDiagnosis?.risk_level;
                                        if (!displayRiskLevel || displayRiskLevel === "N/A") {
                                            if (riskScore >= 80) displayRiskLevel = "High";
                                            else if (riskScore >= 40) displayRiskLevel = "Medium";
                                            else displayRiskLevel = "Low";
                                        }

                                        const isRejected = item.status === 'Rejected' || (item.aiDiagnosis && item.aiDiagnosis.status === 'Rejected');

                                        return (
                                        <div key={idx} style={{ background: '#fff', borderRadius: '12px', marginBottom: '20px', border: '1px solid #e0e0e0', overflow: 'hidden' }}>
                                            <div style={{ background: isRejected ? '#fef2f2' : '#f0fdf4', padding: '15px 20px', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between' }}>
                                                <span style={{ fontWeight: 'bold' }}>File: {item.fileName}</span>
                                                {isRejected ? <span className="badge danger">Bị Từ Chối</span> : <span className="badge success">Thành công</span>}
                                                <button 
                                                    className="btn-sm" 
                                                    style={{background: '#0ea5e9', color: 'white', border:'none', borderRadius:'4px', padding: '5px 10px', cursor:'pointer'}}
                                                    onClick={() => navigate(`/clinic/exam/${item.Id || item.id}`)}
                                                >
                                                    Vào hồ sơ bệnh án
                                                </button>
                                            </div>
                                            <div style={{ padding: '20px' }}>
                                                {item.aiDiagnosis ? (
                                                    <div style={{ display: 'flex', gap: '30px' }}>
                                                        <div style={{ flex: 1 }}>
                                                            <p style={{ fontWeight: '600', marginBottom: '8px' }}>📸 Ảnh gốc</p>
                                                            <img src={item.Url || item.url} alt="Original" style={{ width: '100%', borderRadius: '6px', maxHeight: '300px', objectFit: 'contain' }} />
                                                        </div>
                                                        <div style={{ flex: 1 }}>
                                                            <p style={{ fontWeight: '600', marginBottom: '8px' }}>🔥 Heatmap</p>
                                                            <img src={item.aiDiagnosis.heatmap_url} alt="Heatmap" style={{ width: '100%', borderRadius: '6px', maxHeight: '300px', objectFit: 'contain' }} 
                                                                 onError={(e) => { e.target.onerror = null; e.target.src = "https://via.placeholder.com/400?text=No+Heatmap"; }}
                                                            />
                                                        </div>
                                                    </div>
                                                ) : <p>Không có kết quả AI</p>}
                                                <div style={{ marginTop: '15px', padding: '10px', background: '#f8fafc', borderRadius: '6px' }}>
                                                    <strong>Chẩn đoán:</strong> {item.aiDiagnosis?.diagnosis || "Chưa rõ"} <br/>
                                                    <strong>Rủi ro:</strong> {displayRiskLevel} ({Math.round(riskScore)}%)
                                                </div>
                                            </div>
                                        </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    )}

                    {/* --- TAB KHO DỮ LIỆU --- */}
                    {activeTab === 'storage' && (
                        <div className="service-content active">
                            <div className="section-header-wrapper">
                                <h2 className="section-title-main">Thư viện ảnh</h2>
                                <button className="btn-modern" onClick={fetchPatientImages}><i className="fas fa-sync"></i> Refresh</button>
                            </div>
                            {isLoadingImages ? <div>Đang tải...</div> : (
                                <div className="image-gallery-grid">
                                    {patientImages.length > 0 ? patientImages.map((img) => (
                                        <div key={img.id} className="gallery-item">
                                            <div className="gallery-thumb"><img src={img.imageUrl} alt="Scan" /></div>
                                            <div className="gallery-info">
                                                <div className="gallery-filename">{img.fileName || "Ảnh võng mạc"}</div>
                                                <div className="gallery-actions">
                                                    <button 
                                                        className="btn-sm" style={{background: '#0ea5e9', color: 'white', border:'none', marginRight: '5px', borderRadius: '4px'}}
                                                        onClick={() => navigate(`/clinic/exam/${img.id}`)}
                                                    >
                                                        Xem
                                                    </button>
                                                    <button className="btn-danger" onClick={() => handleDeleteImage(img.id)}>Xóa</button>
                                                </div>
                                            </div>
                                        </div>
                                    )) : <p>Chưa có hình ảnh nào.</p>}
                                </div>
                            )}
                        </div>
                    )}

                    {/* --- TAB LỊCH SỬ (ĐÃ CẬP NHẬT NÚT XEM) --- */}
                    {activeTab === 'validation' && (
                        <div className="service-content active">
                            <h3>Hoạt động gần đây</h3>
                            <div className="modern-table-container">
                                <table className="modern-table">
                                    <thead>
                                        <tr>
                                            <th>Thời gian</th>
                                            <th>Ảnh</th>
                                            <th>Trạng thái</th>
                                            <th>Hành động</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {stats?.recentActivity?.map((act, idx) => (
                                            <tr key={idx}>
                                                <td>{act.uploadedAt}</td>
                                                <td><img src={act.imageUrl} alt="thumb" style={{width: 40, borderRadius: 4}}/></td>
                                                <td><span className={`badge ${act.status === 'Rejected' ? 'danger' : 'success'}`}>{act.status}</span></td>
                                                <td>
                                                    <button 
                                                        className="btn-sm" 
                                                        style={{background: '#0ea5e9', color: 'white', border:'none', padding: '5px 10px', borderRadius:'4px', cursor: 'pointer', fontSize:'12px'}}
                                                        onClick={() => navigate(`/clinic/exam/${act.id || act.Id}`)}
                                                    >
                                                        <i className="fas fa-eye"></i> Xem
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* --- TAB THỐNG KÊ --- */}
                    {activeTab === 'analytics' && (
                        <div className="service-content active">
                            <h3>Thống kê hệ thống</h3>
                            <div className="stats-grid">
                                <div className="stat-card">
                                    <h4>Tổng ảnh</h4>
                                    <div className="stat-value">{stats?.summary?.totalScans || 0}</div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* --- MODAL THÊM BỆNH NHÂN --- */}
            {showModal && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', 
                    justifyContent: 'center', alignItems: 'center', zIndex: 9999
                }}>
                    <div style={{
                        background: 'white', padding: '30px', borderRadius: '12px', width: '400px',
                        boxShadow: '0 10px 25px rgba(0,0,0,0.2)'
                    }}>
                        <h3 style={{marginTop: 0, color: '#0369a1'}}>Thêm Bệnh Nhân Mới</h3>
                        <div style={{display:'flex', flexDirection:'column', gap:'15px', marginTop:'20px'}}>
                            <input 
                                placeholder="Họ và tên *" className="form-control" style={{padding:'10px', border:'1px solid #ddd', borderRadius:'6px'}}
                                value={newPatientForm.fullName}
                                onChange={e => setNewPatientForm({...newPatientForm, fullName: e.target.value})}
                            />
                            <input 
                                placeholder="CCCD/CMND" className="form-control" style={{padding:'10px', border:'1px solid #ddd', borderRadius:'6px'}}
                                value={newPatientForm.citizenId}
                                onChange={e => setNewPatientForm({...newPatientForm, citizenId: e.target.value})}
                            />
                            <input 
                                placeholder="Số điện thoại" className="form-control" style={{padding:'10px', border:'1px solid #ddd', borderRadius:'6px'}}
                                value={newPatientForm.phoneNumber}
                                onChange={e => setNewPatientForm({...newPatientForm, phoneNumber: e.target.value})}
                            />
                            <div style={{display:'flex', gap:'10px'}}>
                                <input 
                                    type="number" placeholder="Tuổi" className="form-control" style={{flex:1, padding:'10px', border:'1px solid #ddd', borderRadius:'6px'}}
                                    value={newPatientForm.age}
                                    onChange={e => setNewPatientForm({...newPatientForm, age: e.target.value})}
                                />
                                <select 
                                    className="form-control" style={{flex:1, padding:'10px', border:'1px solid #ddd', borderRadius:'6px'}}
                                    value={newPatientForm.gender}
                                    onChange={e => setNewPatientForm({...newPatientForm, gender: e.target.value})}
                                >
                                    <option value="Male">Nam</option>
                                    <option value="Female">Nữ</option>
                                </select>
                            </div>
                        </div>
                        
                        <div style={{display:'flex', gap:'10px', marginTop:'25px', justifyContent:'flex-end'}}>
                            <button onClick={() => setShowModal(false)} style={{padding:'10px 20px', border:'none', background:'#f1f5f9', borderRadius:'6px', cursor:'pointer', color:'#64748b', fontWeight:'600'}}>Hủy</button>
                            <button onClick={handleCreatePatient} disabled={loading} style={{padding:'10px 20px', border:'none', background:'#0ea5e9', color:'white', borderRadius:'6px', cursor:'pointer', fontWeight:'600'}}>
                                {loading ? 'Đang lưu...' : 'Lưu Hồ Sơ'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ClinicUploadPage;