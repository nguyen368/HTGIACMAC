import React, { useEffect, useState } from 'react';
import imagingApi from '../../../../api/imagingApi';
import { useAuth } from '../../../../context/AuthContext';

const PatientHistory = () => {
    const { user } = useAuth();
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedItem, setSelectedItem] = useState(null);

    const fetchHistory = async () => {
        if (!user) return;
        setLoading(true);
        try {
            const patientId = user.id || user.userId;
            const data = await imagingApi.getImagesByPatient(patientId);
            const list = Array.isArray(data) ? data : (data.data || []);
            setHistory([...list].reverse());
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchHistory(); }, [user]);

    const handleDelete = async (e, id) => {
        e.stopPropagation();
        if (!window.confirm("Bạn có muốn xóa kết quả này không?")) return;
        try {
            await imagingApi.deleteImage(id);
            alert("✅ Đã xóa thành công!");
            fetchHistory();
        } catch (err) { alert("❌ Lỗi khi xóa"); }
    };

    // HÀM FORMAT NGÀY AN TOÀN
    const formatDate = (dateStr) => {
        const d = new Date(dateStr || Date.now());
        return isNaN(d.getTime()) ? "N/A" : d.toLocaleDateString('vi-VN');
    };

    const renderDetailModal = () => {
        if (!selectedItem) return null;
        const diag = selectedItem.aiDiagnosis || {};
        const isRej = selectedItem.status === 'Rejected' || diag.risk_level === 'Invalid';

        return (
            <div className="modal-overlay" style={{position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center'}} onClick={() => setSelectedItem(null)}>
                <div className="modal-content" style={{background: 'white', padding: '20px', borderRadius: '12px', width: '90%', maxWidth: '800px'}} onClick={e => e.stopPropagation()}>
                    <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '20px'}}>
                        <h3>Chi tiết chẩn đoán</h3>
                        <button onClick={() => setSelectedItem(null)} style={{border:'none', fontSize:'20px'}}>&times;</button>
                    </div>
                    <div style={{display: 'flex', gap: '20px'}}>
                        <img src={selectedItem.imageUrl} style={{width: '50%', borderRadius: '8px', background: '#000'}} alt="Gốc" />
                        <div style={{flex: 1}}>
                            <p><strong>Ngày chụp:</strong> {formatDate(selectedItem.uploadedAt)}</p>
                            <p><strong>Kết luận:</strong> <span style={{color: isRej ? 'red' : 'blue'}}>{diag.diagnosis || "N/A"}</span></p>
                            {diag.heatmap_url && <img src={diag.heatmap_url} style={{width: '100%', marginTop: '10px', borderRadius: '8px', background: '#000'}} alt="Heatmap" />}
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    if (loading) return <div style={{padding: '40px', textAlign: 'center'}}>Đang tải...</div>;

    return (
        <div className="pro-card">
            <div className="card-header">
                <h3>Lịch sử khám bệnh</h3>
                <button className="btn-save" onClick={fetchHistory} style={{background: '#eee', color: '#333'}}><i className="fas fa-sync"></i></button>
            </div>
            <div className="table-container">
                <table className="modern-table">
                    <thead>
                        <tr><th>Thời gian</th><th>Ảnh</th><th>Trạng thái</th><th>Hành động</th></tr>
                    </thead>
                    <tbody>
                        {history.map((item) => (
                            <tr key={item.id} onClick={() => setSelectedItem(item)} style={{cursor: 'pointer'}}>
                                <td>{formatDate(item.uploadedAt || item.createdAt)}</td>
                                <td><img src={item.imageUrl || item.url} style={{width: '40px', borderRadius: '4px'}} /></td>
                                <td><span className={`badge ${item.status === 'Rejected' ? 'danger' : 'success'}`}>{item.status}</span></td>
                                <td>
                                    <button className="btn-sm" style={{background: '#fee2e2', color: '#dc2626', border: 'none'}} onClick={(e) => handleDelete(e, item.id)}>Xóa</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            {renderDetailModal()}
        </div>
    );
};

export default PatientHistory;