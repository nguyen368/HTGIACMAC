import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import imagingApi from '../../../../api/imagingApi'; 
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

const ClinicExamPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [examData, setExamData] = useState(null);
    const [loading, setLoading] = useState(true);
    
    // States cho Form bác sĩ
    const [riskLevel, setRiskLevel] = useState("Bình thường (Normal)");
    const [doctorNote, setDoctorNote] = useState("");
    const [isSaving, setIsSaving] = useState(false);

    // Ref để chụp ảnh in PDF
    const reportRef = useRef();

    useEffect(() => {
        const fetchDetail = async () => {
            try {
                const res = await imagingApi.getDetail(id);
                setExamData(res.data || res);
            } catch (error) {
                alert("Không tải được hồ sơ: " + error.message);
            } finally {
                setLoading(false);
            }
        };
        fetchDetail();
    }, [id]);

    const handleSave = async () => {
        try {
            setIsSaving(true);
            await imagingApi.updateDiagnosis(id, {
                riskLevel: riskLevel,
                doctorNotes: doctorNote
            });
            alert("✅ Đã lưu kết luận thành công!");
        } catch (error) {
            alert("Lỗi khi lưu: " + error.message);
        } finally {
            setIsSaving(false);
        }
    };

    // --- HÀM XUẤT PDF ---
    const handleExportPDF = async () => {
        const element = reportRef.current;
        if(!element) return;

        try {
            const canvas = await html2canvas(element, { scale: 2 });
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF('p', 'mm', 'a4');
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
            
            pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
            pdf.save(`BenhAn_${examData?.PatientName || 'Report'}.pdf`);
        } catch (err) {
            console.error(err);
            alert("Lỗi xuất PDF");
        }
    };

    if (loading) return <div style={{padding:'50px', textAlign:'center', color:'#64748b'}}>Đang tải hồ sơ bệnh án...</div>;
    if (!examData) return <div style={{padding:'50px', textAlign:'center', color:'#ef4444'}}>Không tìm thấy dữ liệu ảnh.</div>;

    // Logic xử lý dữ liệu
    const finalImageUrl = examData.imageUrl || examData.ImageUrl || examData.url || "";
    const rawAiResult = examData.aiResult || examData.AiResult || examData.AiAnalysisResultJson;
    let aiResult = {};
    try {
        if (typeof rawAiResult === 'string') aiResult = JSON.parse(rawAiResult);
        else if (typeof rawAiResult === 'object') aiResult = rawAiResult;
    } catch (e) {}

    const riskScore = aiResult?.risk_score || 0;

    return (
        <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: '#f8fafc', fontFamily: 'Segoe UI, sans-serif' }}>
            {/* HEADER */}
            <div style={{ height: '60px', background: 'white', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', padding: '0 25px', justifyContent: 'space-between', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                    <button onClick={() => navigate(-1)} style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontSize: '18px', color: '#64748b', display: 'flex', alignItems: 'center' }}>
                        <i className="fas fa-arrow-left"></i> <span style={{fontSize:'14px', marginLeft:'5px'}}>Quay lại</span>
                    </button>
                    <div style={{height: '24px', width: '1px', background: '#e2e8f0'}}></div>
                    <h2 style={{ margin: 0, fontSize: '18px', color: '#0f172a', fontWeight: '600' }}>Hồ sơ chẩn đoán</h2>
                </div>
                <div style={{display:'flex', gap:'10px'}}>
                    {/* NÚT XUẤT PDF MỚI */}
                    <button onClick={handleExportPDF} style={{ background: 'white', border: '1px solid #cbd5e1', color: '#334155', padding: '8px 15px', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <i className="fas fa-print"></i> Xuất PDF
                    </button>
                    <button onClick={handleSave} disabled={isSaving} style={{ background: '#0ea5e9', color: 'white', border: 'none', padding: '8px 20px', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <i className="fas fa-save"></i> {isSaving ? 'Đang lưu...' : 'Lưu Kết Luận'}
                    </button>
                </div>
            </div>

            {/* MAIN CONTENT - WORKSPACE */}
            <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
                {/* Vùng làm việc (Hiển thị trên màn hình) */}
                <div style={{ flex: 7, background: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                    {finalImageUrl ? (
                        <img src={aiResult?.heatmap_url || finalImageUrl} alt="Medical Scan" style={{ maxWidth: '95%', maxHeight: '90%', objectFit: 'contain', borderRadius: '8px' }} />
                    ) : <div style={{color:'white'}}>Không có ảnh</div>}
                </div>

                <div style={{ flex: 3, background: 'white', borderLeft: '1px solid #e2e8f0', padding: '25px', overflowY: 'auto' }}>
                    <h3 style={{ marginTop: 0, color: '#0f172a' }}>AI Phân tích</h3>
                    <div style={{ padding: '15px', background: '#f1f5f9', borderRadius: '8px', marginBottom: '20px' }}>
                        <p><strong>Chẩn đoán:</strong> {aiResult?.diagnosis}</p>
                        <p><strong>Độ tin cậy:</strong> {Math.round(riskScore)}%</p>
                    </div>

                    <h3 style={{ color: '#0f172a' }}>Kết luận Bác sĩ</h3>
                    <select className="form-control" style={{width:'100%', padding:'10px', marginBottom:'15px', borderRadius:'6px', border:'1px solid #cbd5e1'}} value={riskLevel} onChange={e => setRiskLevel(e.target.value)}>
                        <option>Bình thường (Normal)</option>
                        <option>Nhẹ (Mild)</option>
                        <option>Trung bình (Moderate)</option>
                        <option>Nặng (Severe)</option>
                    </select>
                    <textarea rows="6" style={{width:'100%', padding:'10px', borderRadius:'6px', border:'1px solid #cbd5e1'}} placeholder="Ghi chú bác sĩ..." value={doctorNote} onChange={e => setDoctorNote(e.target.value)}></textarea>
                </div>
            </div>

            {/* --- TEMPLATE ẨN ĐỂ IN PDF (CHỈ DÙNG KHI BẤM NÚT IN) --- */}
            <div style={{ position: 'absolute', top: '-10000px', left: 0 }}>
                <div ref={reportRef} style={{ width: '210mm', minHeight: '297mm', background: 'white', padding: '20mm', fontFamily: 'Times New Roman, serif', color: '#000' }}>
                    
                    {/* Header Báo Cáo */}
                    <div style={{ borderBottom: '2px solid #000', paddingBottom: '10px', marginBottom: '20px', display:'flex', justifyContent:'space-between', alignItems:'flex-end' }}>
                        <div>
                            <h1 style={{ margin: 0, fontSize: '24pt', color: '#1e3a8a', textTransform: 'uppercase' }}>AURA CLINIC</h1>
                            <p style={{ margin: '5px 0 0', fontSize: '10pt', color: '#555' }}>Hệ thống chẩn đoán bệnh võng mạc tự động</p>
                        </div>
                        <div style={{textAlign:'right'}}>
                            <p style={{ margin: 0, fontWeight: 'bold' }}>PHIẾU KẾT QUẢ KHÁM BỆNH</p>
                            <p style={{ margin: 0, fontSize: '10pt' }}>Ngày: {new Date().toLocaleDateString('vi-VN')}</p>
                        </div>
                    </div>

                    {/* Thông tin bệnh nhân */}
                    <div style={{ marginBottom: '20px' }}>
                        <p><strong>Họ tên bệnh nhân:</strong> {examData?.PatientName || "................................"}</p>
                        <p><strong>Mã hồ sơ:</strong> {examData?.Id}</p>
                        <p><strong>Ngày chụp:</strong> {examData?.UploadedAt}</p>
                    </div>

                    {/* Hình ảnh */}
                    <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', height: '300px' }}>
                        <div style={{ flex: 1, border: '1px solid #ddd', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection:'column' }}>
                            <img src={finalImageUrl} alt="Original" style={{ maxWidth: '95%', maxHeight: '250px', objectFit: 'contain' }} />
                            <p style={{fontSize:'10pt', marginTop:'5px', fontStyle:'italic'}}>Ảnh gốc</p>
                        </div>
                        <div style={{ flex: 1, border: '1px solid #ddd', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection:'column' }}>
                            <img src={aiResult?.heatmap_url || finalImageUrl} alt="Heatmap" style={{ maxWidth: '95%', maxHeight: '250px', objectFit: 'contain' }} />
                            <p style={{fontSize:'10pt', marginTop:'5px', fontStyle:'italic'}}>Phân tích AI</p>
                        </div>
                    </div>

                    {/* Kết quả chi tiết */}
                    <div style={{ marginBottom: '20px', border: '1px solid #000', padding: '15px' }}>
                        <h3 style={{ borderBottom: '1px solid #ccc', paddingBottom: '5px', marginTop: 0 }}>KẾT QUẢ PHÂN TÍCH AI</h3>
                        <p><strong>Chẩn đoán sơ bộ:</strong> {aiResult?.diagnosis}</p>
                        <p><strong>Mức độ rủi ro:</strong> {Math.round(riskScore)}%</p>
                    </div>

                    <div style={{ marginBottom: '30px', border: '1px solid #000', padding: '15px', minHeight: '150px' }}>
                        <h3 style={{ borderBottom: '1px solid #ccc', paddingBottom: '5px', marginTop: 0 }}>KẾT LUẬN CỦA BÁC SĨ</h3>
                        <p><strong>Đánh giá mức độ:</strong> {riskLevel}</p>
                        <p><strong>Ghi chú chuyên môn:</strong></p>
                        <p style={{whiteSpace: 'pre-wrap'}}>{doctorNote || "(Chưa có ghi chú)"}</p>
                    </div>

                    {/* Footer */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '50px' }}>
                        <div style={{ textAlign: 'center' }}>
                            <p><strong>Bệnh nhân</strong></p>
                            <p style={{fontSize:'10pt', fontStyle:'italic'}}>(Ký và ghi rõ họ tên)</p>
                        </div>
                        <div style={{ textAlign: 'center' }}>
                            <p><strong>Bác sĩ chuyên khoa</strong></p>
                            <p style={{fontSize:'10pt', fontStyle:'italic'}}>(Ký và ghi rõ họ tên)</p>
                            <br /><br /><br />
                            <p>Dr. Aura AI</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ClinicExamPage;