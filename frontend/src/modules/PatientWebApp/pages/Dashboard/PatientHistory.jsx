import React, { useEffect, useState } from 'react';
import imagingApi from '../../../../api/imagingApi';
import { useAuth } from '../../../../context/AuthContext';

const PatientHistory = () => {
    const { user } = useAuth();
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user) {
            imagingApi.getImagesByPatient(user.id)
                .then(data => {
                    if (Array.isArray(data)) setHistory(data);
                    else setHistory([]);
                })
                .catch(console.error)
                .finally(() => setLoading(false));
        }
    }, [user]);

    if (loading) return <div style={{padding: '40px', textAlign: 'center'}}>Đang tải dữ liệu...</div>;

    return (
        <div className="pro-card">
            <div className="card-header">
                <div>
                    <h3>Lịch sử chẩn đoán</h3>
                    <p className="subtitle">Danh sách các lần sàng lọc trước đây.</p>
                </div>
            </div>

            <div className="table-container">
                {history.length === 0 ? (
                    <div style={{padding: '40px', textAlign: 'center', color: '#94a3b8'}}>
                        <i className="fas fa-folder-open" style={{fontSize: '48px', marginBottom: '16px'}}></i>
                        <p>Chưa có dữ liệu khám bệnh.</p>
                    </div>
                ) : (
                    <table className="modern-table">
                        <thead>
                            <tr>
                                <th>Hình ảnh</th>
                                <th>Ngày thực hiện</th>
                                <th>Trạng thái</th>
                                <th>Kết quả AI</th>
                                <th>Hành động</th>
                            </tr>
                        </thead>
                        <tbody>
                            {history.map((item) => (
                                <tr key={item.id} className="table-row">
                                    <td>
                                        <img src={item.imageUrl} alt="Eye" 
                                            style={{width: '60px', height: '60px', objectFit: 'cover', borderRadius: '8px', border: '1px solid #e2e8f0'}} 
                                        />
                                    </td>
                                    <td>
                                        <div style={{fontWeight: '600', color: '#334155'}}>
                                            {new Date(item.uploadedAt).toLocaleDateString('vi-VN')}
                                        </div>
                                        <div style={{fontSize: '12px', color: '#94a3b8'}}>
                                            {new Date(item.uploadedAt).toLocaleTimeString('vi-VN')}
                                        </div>
                                    </td>
                                    <td>
                                        <span className={`result-badge ${item.status === 'Analyzed' ? 'low' : 'high'}`} 
                                              style={{background: item.status === 'Pending' ? '#fff7ed' : undefined, color: item.status === 'Pending' ? '#c2410c' : undefined}}>
                                            {item.status === 'Pending' ? 'Đang xử lý' : 'Hoàn tất'}
                                        </span>
                                    </td>
                                    <td>
                                        {item.aiAnalysisResultJson ? (
                                            <div>
                                                <span style={{fontWeight: 'bold', color: '#334155'}}>Đã có kết quả</span>
                                            </div>
                                        ) : (
                                            <span style={{fontStyle: 'italic', color: '#94a3b8'}}>Chờ phân tích...</span>
                                        )}
                                    </td>
                                    <td>
                                        <button style={{
                                            border: '1px solid #cbd5e1', background: 'white', 
                                            padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', color: '#475569'
                                        }}>
                                            Xem chi tiết
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
};

export default PatientHistory;