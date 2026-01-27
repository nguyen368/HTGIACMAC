import React, { useState, useEffect, useCallback, ChangeEvent } from "react";
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify'; 
// @ts-ignore
import imagingApi from "../../../../api/imagingApi"; 
// @ts-ignore
import authApi from "../../../../api/authApi"; 
// @ts-ignore
import medicalApi from "../../../../api/medicalApi"; 
import { useAuth } from "../../../../context/AuthContext";
import "./ClinicUploadPage.css"; 

// --- Interfaces ---
interface Patient { id: string; fullName?: string; userName?: string; email?: string; citizenId?: string; }
interface UploadResult { fileName: string; status: string; Id?: string; id?: string; Url?: string; url?: string; error?: string; aiNote?: string; aiDiagnosis?: { risk_score?: number; riskScore?: number; risk_level?: string; riskLevel?: string; status?: string; heatmap_url?: string; heatmap?: string; diagnosis?: string; result?: string; }; }
interface ImageItem { id: string; fileName: string; imageUrl: string; status?: string; }

interface RecentActivity { 
    id?: string; 
    Id?: string; 
    patientName?: string; 
    PatientName?: string;
    examDate?: string; 
    ExamDate?: string;
    status?: string; 
    Status?: string; 
    uploadedAt?: string; 
}

interface SystemStats { 
    summary?: { 
        totalScans?: number; 
        totalPatients?: number;
        pendingExams?: number;
        highRiskCases?: number;
        TotalScans?: number;
        TotalPatients?: number;
        PendingExams?: number;
        HighRiskCases?: number;
        [key: string]: number | undefined; // Thêm dòng này để TypeScript linh hoạt hơn
    }; 
    recentActivity?: RecentActivity[]; 
    totalImages?: number; 
    todayUploads?: number; 
}

const ClinicUploadPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const currentUser = user as any;
  const CURRENT_CLINIC_ID = currentUser?.clinicId || currentUser?.ClinicId || "7538ae31-a8e1-48e9-9c6d-340da15cf1e2";

  const [activeTab, setActiveTab] = useState<string>("upload"); 
  const [activeUploadMode, setActiveUploadMode] = useState<string>("single"); 
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [uploadResults, setUploadResults] = useState<UploadResult[]>([]); 
  const [stats, setStats] = useState<SystemStats | null>(null); 
  
  const [patientImages, setPatientImages] = useState<any[]>([]); 
  const [isLoadingImages, setIsLoadingImages] = useState<boolean>(false);
  
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState<string>("");
  const [showModal, setShowModal] = useState(false);
  const [newPatientForm, setNewPatientForm] = useState({ fullName: '', citizenId: '', phoneNumber: '', age: 30, gender: 'Male' });

  // --- 1. Fetch Patients ---
  const fetchPatients = useCallback(async () => {
    try {
        const res: any = await authApi.getAllPatients();
        let patientList: Patient[] = Array.isArray(res) ? res : (res && res.value ? res.value : []);
        setPatients(patientList);
    } catch (error) { console.error("Lỗi danh sách BN:", error); }
  }, []);

  // --- 2. Fetch Stats ---
  const fetchStats = useCallback(async () => {
    try {
      const data: any = await medicalApi.getStats(CURRENT_CLINIC_ID);
      
      const mappedStats: SystemStats = {
          summary: data.summary || data.Summary,
          recentActivity: data.recentActivity || data.RecentActivity
      };
      
      setStats(mappedStats);
    } catch (error) { console.error("Lỗi thống kê:", error); }
  }, [CURRENT_CLINIC_ID]);

  // --- 3. Fetch Images ---
  const fetchImages = useCallback(async () => {
    setIsLoadingImages(true);
    try {
        let data: any;
        if (selectedPatientId) {
             data = await imagingApi.getImagesByPatient(selectedPatientId);
        } else {
             if (imagingApi.getImagesByClinic) {
                 const res = await imagingApi.getImagesByClinic(CURRENT_CLINIC_ID);
                 data = res.data || res;
             }
        }

        const mappedData = (Array.isArray(data) ? data : []).map((img: any) => ({
            id: img.id || img.Id,
            fileName: img.fileName || "Scan",
            imageUrl: img.url || img.Url || img.originalImageUrl || img.OriginalImageUrl || img.imageUrl || "https://via.placeholder.com/150",
            status: img.status || img.Status
        }));

        setPatientImages(mappedData);
    } catch (error) { 
        console.error("Error fetching images:", error);
        setPatientImages([]); 
    } finally { 
        setIsLoadingImages(false); 
    }
  }, [selectedPatientId, CURRENT_CLINIC_ID]);

  useEffect(() => { fetchPatients(); fetchStats(); }, [fetchPatients, fetchStats]);

  useEffect(() => { 
      if (activeTab === 'storage') {
          fetchImages(); 
      }
      if (activeTab === 'validation' || activeTab === 'analytics') {
          fetchStats();
      }
  }, [activeTab, selectedPatientId, fetchImages, fetchStats]);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files ? e.target.files[0] : null;
    if (file) setSelectedFile(file);
  };

  // --- Upload Logic ---
  const handleUpload = async () => {
    if (!selectedFile || !selectedPatientId) return toast.warning("Vui lòng chọn đủ BN và file!");
    setLoading(true); setUploadResults([]); 
    try {
      let res: any;
      if (activeUploadMode === 'batch') {
          const fd = new FormData(); fd.append("zipFile", selectedFile);
          fd.append("ClinicId", CURRENT_CLINIC_ID); fd.append("PatientId", selectedPatientId);
          res = await imagingApi.uploadBatch(fd);
      } else { res = await imagingApi.uploadSingle(selectedFile, CURRENT_CLINIC_ID, selectedPatientId); }
      
      const details: UploadResult[] = res.details || res.Details || [];
      setUploadResults(details);
      toast.success("✅ Thành công!"); 
      fetchStats(); 
      if(activeTab === 'storage') fetchImages(); 
    } catch (err: any) { toast.error("❌ Lỗi: " + err.message); }
    finally { setLoading(false); }
  };

  const handleDeleteImage = async (imageId: string) => {
      if(!window.confirm("Xác nhận xóa ảnh này?")) return;
      try { 
          await imagingApi.deleteImage(imageId); 
          toast.success("Đã xóa."); 
          setPatientImages(prev => prev.filter(img => img.id !== imageId));
          fetchStats(); 
      }
      catch (error: any) { toast.error("Lỗi xóa: " + error.message); }
  };

  const handleCreatePatient = async () => {
    if (!newPatientForm.fullName) return toast.warning("Nhập tên!");
    setLoading(true);
    try {
        const res: any = await authApi.createPatient(newPatientForm);
        setPatients(prev => [res, ...prev]); setSelectedPatientId(res.id || res.Id);
        setShowModal(false); setNewPatientForm({ fullName: '', citizenId: '', phoneNumber: '', age: 30, gender: 'Male' });
        toast.success("✅ Đã thêm!");
    } catch (error: any) { toast.error("Lỗi: " + error.message); }
    finally { setLoading(false); }
  };

  // --- FIX LỖI TYPESCRIPT ---
  // Thay đổi: Nhận tham số là string và ép kiểu stats.summary thành any để truy cập linh hoạt
  const getSummaryValue = (key1: string, key2: string): number => {
      if (!stats || !stats.summary) return 0;
      const s = stats.summary as any; // Ép kiểu any để tránh lỗi "never"
      return (s[key1] as number) ?? (s[key2] as number) ?? 0;
  }

  return (
    <div className="container">
      <div className="header"><div className="logo-text"><h1>AURA IMAGING SUITE</h1></div></div>
      
      <div className="main-content">
        <div className="services-nav">
            <div className="nav-group-title">Menu Chức năng</div>
            {[{id:"upload",icon:"fa-cloud-upload-alt",label:"Upload & AI"},{id:"storage",icon:"fa-database",label:"Kho dữ liệu"},{id:"validation",icon:"fa-history",label:"Lịch sử gần đây"},{id:"analytics",icon:"fa-chart-pie",label:"Thống kê"}].map(item => (
                <div key={item.id} className={`nav-item ${activeTab === item.id ? "active" : ""}`} onClick={() => setActiveTab(item.id)}>
                    <i className={`fas ${item.icon}`}></i> {item.label}
                </div>
            ))}
        </div>

        <div className="services-container">
            {(activeTab === 'upload' || activeTab === 'storage') && (
                <div style={{ background: '#e0f2fe', padding: '15px', borderRadius: '12px', marginBottom: '20px', display: 'flex', gap: '15px', alignItems: 'center' }}>
                    <div style={{fontWeight:'bold', color:'#0369a1'}}>Chọn Bệnh nhân:</div>
                    <select className="form-select" value={selectedPatientId} onChange={(e) => setSelectedPatientId(e.target.value)} style={{ flex: 1, padding: '10px' }}>
                        <option value="">-- {activeTab === 'storage' ? 'Tất cả bệnh nhân' : 'Chọn hồ sơ bệnh nhân'} --</option>
                        {patients.map(p => <option key={p.id} value={p.id}>{p.fullName || p.userName} - {p.citizenId || p.email}</option>)}
                    </select>
                    <button onClick={() => setShowModal(true)} style={{background:'#0ea5e9', color:'white', border:'none', borderRadius:'8px', width:'40px', height:'40px', fontSize:'24px', cursor:'pointer'}}>+</button>
                </div>
            )}
            
            {/* --- TAB: UPLOAD --- */}
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
                        <button className="btn-modern" onClick={handleUpload} disabled={!selectedFile || !selectedPatientId || loading}>{loading ? "Đang xử lý..." : "Bắt đầu Upload"}</button>
                    </div>
                    
                    {uploadResults.length > 0 && (
                        <div className="results-wrapper">
                            {uploadResults.map((item, idx) => {
                                const riskScore = item.aiDiagnosis?.risk_score || item.aiDiagnosis?.riskScore || 0;
                                let displayRiskLevel = item.aiDiagnosis?.risk_level || item.aiDiagnosis?.riskLevel || (riskScore >= 80 ? "High" : riskScore >= 40 ? "Medium" : "Low");
                                return (
                                <div key={idx} style={{ background: '#fff', borderRadius: '12px', marginBottom: '20px', border: '1px solid #e0e0e0', overflow: 'hidden' }}>
                                    <div style={{ background: '#f0fdf4', padding: '15px', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between' }}>
                                        <span style={{ fontWeight: 'bold' }}>File: {item.fileName}</span>
                                        <button className="btn-sm" style={{background: '#0ea5e9', color: 'white', border:'none', borderRadius:'4px', padding:'5px 10px', cursor:'pointer'}} onClick={() => navigate(`/clinic/exam/${item.Id || item.id}`)}>Xem chi tiết</button>
                                    </div>
                                    {item.aiDiagnosis && (
                                        <div style={{ padding: '15px', display: 'flex', gap: '20px' }}>
                                            <div style={{flex:1}}><p><b>Ảnh gốc:</b></p><img src={item.Url || item.url} alt="Original" style={{width:'100%', maxHeight:'200px', objectFit:'contain', borderRadius:'6px'}}/></div>
                                            <div style={{flex:1}}><p><b>Heatmap AI:</b></p><img src={item.aiDiagnosis.heatmap_url || item.aiDiagnosis.heatmap} alt="Heatmap" style={{width:'100%', maxHeight:'200px', objectFit:'contain', borderRadius:'6px'}}/></div>
                                            <div style={{flex:1, background:'#f8fafc', padding:'10px', borderRadius:'6px'}}><p><b>Chẩn đoán:</b> {item.aiDiagnosis.diagnosis || item.aiDiagnosis.result}</p><p><b>Rủi ro:</b> {displayRiskLevel} ({Math.round(riskScore)}%)</p></div>
                                        </div>
                                    )}
                                </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}

            {/* --- TAB: STORAGE --- */}
            {activeTab === 'storage' && (
                <div className="service-content active">
                    <div style={{display:'flex', justifyContent:'space-between'}}><h3>Thư viện ảnh</h3><button className="btn-modern" onClick={fetchImages}>Refresh</button></div>
                    {isLoadingImages ? (
                        <p>Đang tải dữ liệu...</p>
                    ) : (
                        <div className="image-gallery-grid" style={{display:'flex', flexWrap:'wrap', gap:'15px', marginTop:'15px'}}>
                            {patientImages.length > 0 ? patientImages.map((img) => (
                                <div key={img.id} className="gallery-item" style={{width:'200px', border:'1px solid #eee', padding:'10px', borderRadius:'8px', background: '#fff'}}>
                                    <img 
                                        src={img.imageUrl} 
                                        alt="Scan" 
                                        style={{width:'100%', height:'150px', objectFit:'cover', borderRadius:'4px'}}
                                        onError={(e) => { (e.target as HTMLImageElement).src = "https://via.placeholder.com/150?text=No+Image"; }}
                                    />
                                    <div style={{marginTop:'5px', fontSize: '0.9em', fontWeight: 'bold', color: '#555'}}>Status: {img.status || 'Uploaded'}</div>
                                    <div style={{marginTop:'10px', display:'flex', gap:'5px'}}>
                                        <button onClick={() => navigate(`/clinic/exam/${img.id}`)} style={{flex:1, background:'#0ea5e9', color:'white', border:'none', padding:'5px', borderRadius:'4px', cursor:'pointer'}}>Xem</button>
                                        <button onClick={() => handleDeleteImage(img.id)} style={{flex:1, background:'#ef4444', color:'white', border:'none', padding:'5px', borderRadius:'4px', cursor:'pointer'}}>Xóa</button>
                                    </div>
                                </div>
                            )) : (
                                <p style={{color: '#888', fontStyle: 'italic'}}>Chưa có ảnh nào.</p>
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* --- TAB: RECENT HISTORY --- */}
            {activeTab === 'validation' && (
                <div className="service-content active">
                    <h3>Hoạt động gần đây</h3>
                    <table className="modern-table" style={{width:'100%'}}>
                        <thead><tr><th>Thời gian</th><th>Bệnh nhân</th><th>Trạng thái</th><th>Hành động</th></tr></thead>
                        <tbody>
                            {stats?.recentActivity && stats.recentActivity.length > 0 ? (
                                stats.recentActivity.map((act, idx) => (
                                    <tr key={idx}>
                                        <td>{new Date(act.examDate || act.ExamDate || act.uploadedAt || Date.now()).toLocaleDateString('vi-VN')}</td>
                                        <td><strong>{act.patientName || act.PatientName || 'Unknown'}</strong></td>
                                        <td><span className={`badge ${act.status === 'Verified' ? 'success' : 'warning'}`}>{act.status || act.Status}</span></td>
                                        <td><button onClick={() => navigate(`/clinic/exam/${act.id || act.Id}`)} style={{background:'#0ea5e9', color:'white', border:'none', padding:'5px 10px', borderRadius:'4px', cursor:'pointer'}}>Xem</button></td>
                                    </tr>
                                ))
                            ) : (
                                <tr><td colSpan={4} style={{textAlign:'center', padding:'20px'}}>Chưa có hoạt động nào.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {/* --- TAB: ANALYTICS (THỐNG KÊ) --- */}
            {activeTab === 'analytics' && (
                <div className="service-content active">
                     <h3>Thống kê tổng quan</h3>
                     <div style={{display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:'20px', marginTop:'20px'}}>
                         <div style={{background:'#e0f2fe', padding:'20px', borderRadius:'12px', textAlign:'center'}}>
                             <h4>Tổng Bệnh Nhân</h4>
                             <h2 style={{color:'#0284c7', fontSize:'2.5em'}}>
                                {getSummaryValue('totalPatients', 'TotalPatients')}
                             </h2>
                         </div>
                         <div style={{background:'#dcfce7', padding:'20px', borderRadius:'12px', textAlign:'center'}}>
                             <h4>Tổng Lượt Chụp</h4>
                             <h2 style={{color:'#16a34a', fontSize:'2.5em'}}>
                                {getSummaryValue('totalScans', 'TotalScans')}
                             </h2>
                         </div>
                         <div style={{background:'#fef9c3', padding:'20px', borderRadius:'12px', textAlign:'center'}}>
                             <h4>Chờ Duyệt</h4>
                             <h2 style={{color:'#ca8a04', fontSize:'2.5em'}}>
                                {getSummaryValue('pendingExams', 'PendingExams')}
                             </h2>
                         </div>
                         <div style={{background:'#fee2e2', padding:'20px', borderRadius:'12px', textAlign:'center'}}>
                             <h4>Nguy Cơ Cao</h4>
                             <h2 style={{color:'#dc2626', fontSize:'2.5em'}}>
                                {getSummaryValue('highRiskCases', 'HighRiskCases')}
                             </h2>
                         </div>
                     </div>
                </div>
            )}
        </div>
      </div>

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
                        <select className="form-control" value={newPatientForm.gender} onChange={e=>setNewPatientForm({...newPatientForm, gender:e.target.value})} style={{flex:1, padding:'8px', border:'1px solid #ddd', borderRadius:'4px'}}><option value="Male">Nam</option><option value="Female">Nữ</option></select>
                    </div>
                </div>
                <div style={{marginTop:'20px', display:'flex', justifyContent:'flex-end', gap:'10px'}}><button onClick={()=>setShowModal(false)} style={{padding:'8px 15px', border:'none', background:'#eee', borderRadius:'4px', cursor:'pointer'}}>Hủy</button><button onClick={handleCreatePatient} disabled={loading} style={{padding:'8px 15px', border:'none', background:'#0ea5e9', color:'white', borderRadius:'4px', cursor:'pointer'}}>{loading ? 'Đang lưu...' : 'Lưu'}</button></div>
            </div>
        </div>
      )}
    </div>
  );
};

export default ClinicUploadPage;