import React, { useState, useEffect, useCallback, ChangeEvent } from "react";
import { useNavigate } from 'react-router-dom';
// @ts-ignore
import imagingApi from "../../../../api/imagingApi"; 
// @ts-ignore
import authApi from "../../../../api/authApi"; 
import "./ClinicUploadPage.css"; 

// --- Interfaces (Giữ lại chuẩn TS của nhánh main) ---
interface Patient {
  id: string;
  fullName?: string;
  userName?: string;
  email?: string;
  citizenId?: string; // Bổ sung
}

interface UploadResult {
  fileName: string;
  status: string;
  Id?: string;
  id?: string;
  Url?: string;
  url?: string;
  error?: string;
  aiNote?: string;
  aiDiagnosis?: {
    risk_score?: number;
    riskScore?: number;
    risk_level?: string;
    riskLevel?: string;
    status?: string;
    heatmap_url?: string;
    heatmap?: string;
    diagnosis?: string;
    result?: string;
  };
}

interface ImageItem {
  id: string;
  fileName: string;
  imageUrl: string;
}

interface RecentActivity {
  id?: string;
  Id?: string;
  uploadedAt: string;
  imageUrl: string;
  status: string;
}

interface SystemStats {
  summary?: { totalScans: number; };
  recentActivity?: RecentActivity[];
}

const ClinicUploadPage: React.FC = () => {
  const navigate = useNavigate();
  // ID phòng khám cố định (tạm thời)
  const CURRENT_CLINIC_ID = "d2b51336-6c1c-426d-881e-45051666617a";

  // --- STATES ---
  const [activeTab, setActiveTab] = useState<string>("upload"); 
  const [activeUploadMode, setActiveUploadMode] = useState<string>("single"); 
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [uploadResults, setUploadResults] = useState<UploadResult[]>([]); 
  const [stats, setStats] = useState<SystemStats | null>(null); 
  const [patientImages, setPatientImages] = useState<ImageItem[]>([]); 
  const [isLoadingImages, setIsLoadingImages] = useState<boolean>(false);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState<string>("");

  // State Modal (Tích hợp từ code cũ của bạn)
  const [showModal, setShowModal] = useState(false);
  const [newPatientForm, setNewPatientForm] = useState({
      fullName: '', citizenId: '', phoneNumber: '', age: 30, gender: 'Male'
  });

  // --- FETCH API ---
  const fetchPatients = useCallback(async () => {
    try {
        const res = await authApi.getAllPatients();
        const data = res.data?.value || res.data || res.value || [];
        const patientList = Array.isArray(data) ? data : [];
        setPatients(patientList);
    } catch (error) { console.error("Lỗi lấy danh sách bệnh nhân:", error); }
  }, []);

  const fetchStats = useCallback(async () => {
    try {
      const data: any = await imagingApi.getStats(CURRENT_CLINIC_ID);
      setStats(data);
    } catch (error) { console.error("Lỗi tải thống kê:", error); }
  }, [CURRENT_CLINIC_ID]);

  const fetchPatientImages = useCallback(async () => {
    if (!selectedPatientId) return;
    setIsLoadingImages(true);
    try {
        const data: any = await imagingApi.getImagesByPatient(selectedPatientId);
        const images = Array.isArray(data) ? data : (data.data || []);
        setPatientImages(images);
    } catch (error) {
        setPatientImages([]);
    } finally {
        setIsLoadingImages(false);
    }
  }, [selectedPatientId]);

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
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files ? e.target.files[0] : null;
    if (file) setSelectedFile(file);
  };

  const handleUpload = async () => {
    if (!selectedFile) return alert("Vui lòng chọn file!");
    if (!selectedPatientId) return alert("Vui lòng chọn Bệnh nhân!");
    setLoading(true);
    setUploadResults([]); 
    try {
      let res: any;
      if (activeUploadMode === 'batch') {
          // Xử lý form data thủ công nếu API yêu cầu
          const fd = new FormData();
          fd.append("zipFile", selectedFile);
          fd.append("ClinicId", CURRENT_CLINIC_ID);
          fd.append("PatientId", selectedPatientId);
          res = await imagingApi.uploadBatch(fd);
      } else {
          res = await imagingApi.uploadSingle(selectedFile, CURRENT_CLINIC_ID, selectedPatientId);
      }
      
      const details: UploadResult[] = res.details || res.Details || [];
      setUploadResults(details);
      
      if(activeUploadMode === 'batch') alert(`✅ Xử lý hoàn tất lô ảnh!`); 
      fetchStats(); 
    } catch (err: any) {
      alert("❌ Lỗi hệ thống: " + (err.message || "Unknown"));
    } finally { setLoading(false); }
  };

  const handleDeleteImage = async (imageId: string) => {
      if(!window.confirm("Xác nhận xóa ảnh này?")) return;
      try {
          await imagingApi.deleteImage(imageId);
          alert("Đã xóa thành công.");
          fetchPatientImages();
          fetchStats();
      } catch (error: any) { alert("Lỗi khi xóa: " + error.message); }
  }

  // Handler tạo bệnh nhân (Tích hợp từ code cũ)
  const handleCreatePatient = async () => {
    if (!newPatientForm.fullName) return alert("Vui lòng nhập tên!");
    setLoading(true);
    try {
        const res = await authApi.createPatient(newPatientForm);
        const newPatient = res.data || res;
        setPatients(prev => [newPatient, ...prev]);
        setSelectedPatientId(newPatient.id || newPatient.Id);
        setShowModal(false);
        setNewPatientForm({ fullName: '', citizenId: '', phoneNumber: '', age: 30, gender: 'Male' });
        alert("✅ Đã thêm hồ sơ bệnh nhân mới!");
    } catch (error: any) {
        console.error(error);
        alert("Lỗi khi tạo bệnh nhân: " + (error.response?.data || error.message));
    } finally {
        setLoading(false);
    }
  };

  // --- RENDER ---
  return (
    <div className="container">
      <div className="header"><div className="logo-text"><h1>AURA IMAGING SUITE</h1></div></div>
      <div className="main-content">
        {/* Sidebar */}
        <div className="services-nav">
            <div className="nav-group-title">Menu Chức năng</div>
            {[{id:"upload",icon:"fa-cloud-upload-alt",label:"Upload & AI"},{id:"storage",icon:"fa-database",label:"Kho dữ liệu"},{id:"validation",icon:"fa-history",label:"Lịch sử gần đây"},{id:"analytics",icon:"fa-chart-pie",label:"Thống kê"}].map(item => (
                <div key={item.id} className={`nav-item ${activeTab === item.id ? "active" : ""}`} onClick={() => setActiveTab(item.id)}>
                    <i className={`fas ${item.icon}`}></i> {item.label}
                </div>
            ))}
        </div>

        <div className="services-container">
            {/* Patient Selector */}
            {(activeTab === 'upload' || activeTab === 'storage') && (
                <div style={{ background: '#e0f2fe', padding: '15px', borderRadius: '12px', marginBottom: '20px', display: 'flex', gap: '15px', alignItems: 'center' }}>
                    <div style={{fontWeight:'bold', color:'#0369a1'}}>Chọn Bệnh nhân:</div>
                    <select className="form-select" value={selectedPatientId} onChange={(e) => setSelectedPatientId(e.target.value)} style={{ flex: 1, padding: '10px' }}>
                        <option value="">-- Chọn hồ sơ bệnh nhân --</option>
                        {patients.map(p => (
                            <option key={p.id} value={p.id}>{p.fullName || p.userName} - {p.citizenId || p.email}</option>
                        ))}
                    </select>
                    <button onClick={() => setShowModal(true)} style={{background:'#0ea5e9', color:'white', border:'none', borderRadius:'8px', width:'40px', height:'40px', fontSize:'24px', cursor:'pointer'}}>+</button>
                </div>
            )}
            
            {/* TAB: UPLOAD */}
            {activeTab === 'upload' && (
                <div className="service-content active">
                    <h2 className="section-title-main">Upload Hình ảnh</h2>
                    <div className="upload-grid">
                        <div className={`upload-card ${activeUploadMode === 'single' ? 'active' : ''}`} onClick={() => setActiveUploadMode('single')}><div className="upload-card-inner"><div className="upload-card-title"><h3>Upload Đơn lẻ</h3></div></div></div>
                        <div className={`upload-card ${activeUploadMode === 'batch' ? 'active' : ''}`} onClick={() => setActiveUploadMode('batch')}><div className="upload-card-inner"><div className="upload-card-title"><h3>Upload Zip</h3></div></div></div>
                    </div>
                    <div className="dropzone">
                        <input type="file" onChange={handleFileChange} accept={activeUploadMode === 'single' ? "image/*" : ".zip"} />
                        <p>Chọn file {activeUploadMode === 'single' ? 'Ảnh (.png, .jpg)' : 'Nén (.zip)'}</p>
                    </div>
                    <div style={{textAlign: 'center', margin: '20px 0'}}>
                        <button className="btn-modern" onClick={handleUpload} disabled={!selectedFile || !selectedPatientId || loading}>
                            {loading ? "Đang xử lý..." : "Bắt đầu Upload"}
                        </button>
                    </div>
                    
                    {/* KẾT QUẢ PHÂN TÍCH (Giao diện mới) */}
                    {uploadResults.length > 0 && (
                        <div className="results-wrapper">
                            {uploadResults.map((item, idx) => {
                                const riskScore = item.aiDiagnosis?.risk_score || item.aiDiagnosis?.riskScore || 0;
                                let displayRiskLevel = item.aiDiagnosis?.risk_level || item.aiDiagnosis?.riskLevel;
                                if (!displayRiskLevel || displayRiskLevel === "N/A") {
                                    if (riskScore >= 80) displayRiskLevel = "High (Nguy hiểm)";
                                    else if (riskScore >= 40) displayRiskLevel = "Medium (Cảnh báo)";
                                    else displayRiskLevel = "Low (Bình thường)";
                                }
                                const isRejected = item.status === 'Rejected' || (item.aiDiagnosis?.status === 'Rejected');

                                return (
                                <div key={idx} style={{ background: '#fff', borderRadius: '12px', marginBottom: '20px', border: '1px solid #e0e0e0', overflow: 'hidden' }}>
                                    <div style={{ background: isRejected ? '#fef2f2' : '#f0fdf4', padding: '15px', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between' }}>
                                        <span style={{ fontWeight: 'bold' }}>File: {item.fileName}</span>
                                        {isRejected ? <span className="badge danger">Bị Từ Chối</span> : <span className="badge success">Thành công</span>}
                                        <button className="btn-sm" style={{background: '#0ea5e9', color: 'white', border:'none', borderRadius:'4px', padding:'5px 10px', cursor:'pointer'}} 
                                            onClick={() => navigate(`/clinic/exam/${item.Id || item.id}`)}>
                                            Xem chi tiết
                                        </button>
                                    </div>
                                    {item.aiDiagnosis ? (
                                        <div style={{ padding: '15px', display: 'flex', gap: '20px' }}>
                                            <div style={{flex:1}}>
                                                <p><b>Ảnh gốc:</b></p>
                                                <img src={item.Url || item.url} alt="Original" style={{width:'100%', maxHeight:'200px', objectFit:'contain', borderRadius:'6px'}}/>
                                            </div>
                                            <div style={{flex:1}}>
                                                <p><b>Heatmap AI:</b></p>
                                                <img src={item.aiDiagnosis.heatmap_url || item.aiDiagnosis.heatmap} alt="Heatmap" 
                                                    style={{width:'100%', maxHeight:'200px', objectFit:'contain', borderRadius:'6px'}}
                                                    onError={(e) => { (e.target as HTMLImageElement).src = "https://via.placeholder.com/300?text=No+Heatmap"; }}
                                                />
                                            </div>
                                            <div style={{flex:1, background:'#f8fafc', padding:'10px', borderRadius:'6px'}}>
                                                <p><b>Chẩn đoán:</b> {item.aiDiagnosis.diagnosis || item.aiDiagnosis.result}</p>
                                                <p><b>Rủi ro:</b> {displayRiskLevel} ({Math.round(riskScore)}%)</p>
                                            </div>
                                        </div>
                                    ) : <p style={{padding:'15px'}}>Đang chờ xử lý AI...</p>}
                                </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}

            {/* TAB: KHO DỮ LIỆU */}
            {activeTab === 'storage' && (
                <div className="service-content active">
                    <div style={{display:'flex', justifyContent:'space-between'}}>
                        <h3>Thư viện ảnh</h3>
                        <button className="btn-modern" onClick={fetchPatientImages}>Refresh</button>
                    </div>
                    <div className="image-gallery-grid" style={{display:'flex', flexWrap:'wrap', gap:'15px', marginTop:'15px'}}>
                        {patientImages.length > 0 ? patientImages.map((img) => (
                            <div key={img.id} className="gallery-item" style={{width:'200px', border:'1px solid #eee', padding:'10px', borderRadius:'8px'}}>
                                <img src={img.imageUrl} alt="Scan" style={{width:'100%', height:'150px', objectFit:'cover', borderRadius:'4px'}}/>
                                <div style={{marginTop:'10px', fontSize:'12px', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap'}}>{img.fileName}</div>
                                <div style={{marginTop:'10px', display:'flex', gap:'5px'}}>
                                    <button onClick={() => navigate(`/clinic/exam/${img.id}`)} style={{flex:1, background:'#0ea5e9', color:'white', border:'none', padding:'5px', borderRadius:'4px', cursor:'pointer'}}>Xem</button>
                                    <button onClick={() => handleDeleteImage(img.id)} style={{flex:1, background:'#ef4444', color:'white', border:'none', padding:'5px', borderRadius:'4px', cursor:'pointer'}}>Xóa</button>
                                </div>
                            </div>
                        )) : <p>Chưa có ảnh.</p>}
                    </div>
                </div>
            )}

            {/* TAB: LỊCH SỬ */}
            {activeTab === 'validation' && (
                <div className="service-content active">
                    <h3>Hoạt động gần đây</h3>
                    <table className="modern-table" style={{width:'100%'}}>
                        <thead><tr><th>Thời gian</th><th>Trạng thái</th><th>Hành động</th></tr></thead>
                        <tbody>
                            {stats?.recentActivity?.map((act, idx) => (
                                <tr key={idx}>
                                    <td>{act.uploadedAt}</td>
                                    <td><span className={`badge ${act.status === 'Rejected' ? 'danger' : 'success'}`}>{act.status}</span></td>
                                    <td><button onClick={() => navigate(`/clinic/exam/${act.id || act.Id}`)} style={{background:'#0ea5e9', color:'white', border:'none', padding:'5px 10px', borderRadius:'4px', cursor:'pointer'}}>Xem</button></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
      </div>

      {/* --- MODAL (Đã khôi phục) --- */}
      {showModal && (
        <div style={{position:'fixed', top:0, left:0, right:0, bottom:0, background:'rgba(0,0,0,0.5)', display:'flex', justifyContent:'center', alignItems:'center', zIndex:999}}>
            <div style={{background:'white', padding:'30px', borderRadius:'12px', width:'400px'}}>
                <h3 style={{color:'#0369a1'}}>Thêm Bệnh Nhân</h3>
                <div style={{display:'flex', flexDirection:'column', gap:'10px', marginTop:'15px'}}>
                    <input className="form-control" placeholder="Họ tên" value={newPatientForm.fullName} onChange={e=>setNewPatientForm({...newPatientForm, fullName:e.target.value})} style={{padding:'8px', border:'1px solid #ddd', borderRadius:'4px'}}/>
                    <input className="form-control" placeholder="CCCD" value={newPatientForm.citizenId} onChange={e=>setNewPatientForm({...newPatientForm, citizenId:e.target.value})} style={{padding:'8px', border:'1px solid #ddd', borderRadius:'4px'}}/>
                    <input className="form-control" placeholder="SĐT" value={newPatientForm.phoneNumber} onChange={e=>setNewPatientForm({...newPatientForm, phoneNumber:e.target.value})} style={{padding:'8px', border:'1px solid #ddd', borderRadius:'4px'}}/>
                    <div style={{display:'flex', gap:'10px'}}>
                        <input type="number" placeholder="Tuổi" className="form-control" value={newPatientForm.age} onChange={e=>setNewPatientForm({...newPatientForm, age:parseInt(e.target.value)})} style={{flex:1, padding:'8px', border:'1px solid #ddd', borderRadius:'4px'}}/>
                        <select className="form-control" value={newPatientForm.gender} onChange={e=>setNewPatientForm({...newPatientForm, gender:e.target.value})} style={{flex:1, padding:'8px', border:'1px solid #ddd', borderRadius:'4px'}}>
                            <option value="Male">Nam</option><option value="Female">Nữ</option>
                        </select>
                    </div>
                </div>
                <div style={{marginTop:'20px', display:'flex', justifyContent:'flex-end', gap:'10px'}}>
                    <button onClick={()=>setShowModal(false)} style={{padding:'8px 15px', border:'none', background:'#eee', borderRadius:'4px', cursor:'pointer'}}>Hủy</button>
                    <button onClick={handleCreatePatient} disabled={loading} style={{padding:'8px 15px', border:'none', background:'#0ea5e9', color:'white', borderRadius:'4px', cursor:'pointer'}}>{loading ? 'Đang lưu...' : 'Lưu'}</button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default ClinicUploadPage;