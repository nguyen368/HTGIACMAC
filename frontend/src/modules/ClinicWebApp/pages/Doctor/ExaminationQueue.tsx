import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import medicalApi from '../../../../api/medicalApi';
import { useAuth } from '../../../../context/AuthContext';
import { Examination } from '../../../../types/medical';

const ExaminationQueue: React.FC = () => {
    const [patients, setPatients] = useState<Examination[]>([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
    const { user } = useAuth();

    const fetchQueue = async () => {
        // [FIX]: Phải lấy clinicId từ user để truyền vào API
        const clinicId = user?.clinicId;
        if (!clinicId) {
            setLoading(false);
            return;
        }

        try {
            // [FIX TS2554]: Đã truyền đúng clinicId để build thành công
            const data = await medicalApi.getWaitingList(clinicId);
            setPatients(data || []);
        } catch (error) {
            console.error("Lỗi tải danh sách chờ:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user?.clinicId) {
            fetchQueue();
        }
    }, [user?.clinicId]);

    if (loading) return <div style={{padding: '50px', textAlign: 'center'}}>Đang tải danh sách hàng đợi...</div>;

    return (
        <div className="queue-container">
            <h2 className="page-title">Hàng đợi khám bệnh</h2>
            <div className="table-responsive">
                <table className="modern-table">
                    <thead>
                        <tr>
                            <th>Bệnh nhân</th>
                            <th>Ngày đăng ký</th>
                            <th>Mức độ rủi ro</th>
                            <th>Hành động</th>
                        </tr>
                    </thead>
                    <tbody>
                        {patients.length > 0 ? patients.map((p) => (
                            <tr key={p.id}>
                                <td><b>{p.patientName}</b></td>
                                <td>{new Date(p.createdDate).toLocaleString('vi-VN')}</td>
                                <td>
                                    <span className={`risk-badge ${p.aiRiskLevel?.toLowerCase()}`}>
                                        {p.aiRiskLevel} ({p.aiRiskScore}%)
                                    </span>
                                </td>
                                <td>
                                    <button onClick={() => navigate(`/clinic/exam/${p.id}`)} className="btn-examine">
                                        Vào khám
                                    </button>
                                </td>
                            </tr>
                        )) : (
                            <tr><td colSpan={4} style={{textAlign: 'center', padding: '30px'}}>Hàng đợi hiện đang trống</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default ExaminationQueue;