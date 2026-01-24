import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import medicalApi from "../../../../api/medicalApi";
import { useSignalR } from "../../../../context/SignalRContext";
import { toast } from "react-toastify";
import { Examination } from "../../../../types/medical";

const ExaminationQueue: React.FC = () => {
  const [queue, setQueue] = useState<Examination[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const navigate = useNavigate();
  const { lastNotification, connection } = useSignalR(); 

  const fetchQueue = async () => {
    try {
      setLoading(true);
      const res = await medicalApi.getWaitingList();
      setQueue(res || []);
    } catch (error) {
      toast.error("Không thể tải danh sách hàng chờ.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueue();
  }, []);

  useEffect(() => {
    const userData = localStorage.getItem("user") || localStorage.getItem("aura_user");
    const user = userData ? JSON.parse(userData) : null;

    if (connection && user?.clinicId) {
      connection.invoke("JoinClinicChannel", user.clinicId)
        .catch(err => console.error("Lỗi tham gia kênh SignalR:", err));
        
      return () => {
        connection.invoke("LeaveClinicChannel", user.clinicId).catch(() => {});
      };
    }
  }, [connection]);

  useEffect(() => {
    if (lastNotification?.Type === "AiFinished" || lastNotification?.type === "AiFinished") {
      toast.info(`Phát hiện kết quả AI mới cho bệnh nhân: ${lastNotification.PatientName || 'Hệ thống'}`);
      fetchQueue();
    }
  }, [lastNotification]);

  const getRiskBadge = (level: string) => {
    switch (level) {
      case "High": return <span className="badge bg-danger">🔴 NGUY CƠ CAO</span>;
      case "Medium": return <span className="badge bg-warning text-dark">🟡 Trung bình</span>;
      case "Low": return <span className="badge bg-success">🟢 Thấp</span>;
      default: return <span className="badge bg-secondary">⚪ Đang chờ AI...</span>;
    }
  };

  return (
    <div className="container mt-4">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <div>
          <h2 style={{ fontWeight: 'bold', color: '#2c3e50' }}>📋 Danh sách chờ khám</h2>
        </div>
        <button className="btn btn-outline-primary shadow-sm" onClick={fetchQueue}>🔄 Làm mới</button>
      </div>
      
      <div className="table-responsive shadow-sm rounded">
        <table className="table table-hover align-middle mb-0" style={{ backgroundColor: 'white' }}>
          <thead className="table-light">
            <tr>
              <th>Thứ tự</th>
              <th>Bệnh nhân</th>
              <th>Thời gian chụp</th>
              <th>AI Đánh giá</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} className="text-center py-4">Đang tải...</td></tr>
            ) : queue.length > 0 ? (
              queue.map((exam, index) => (
                <tr key={exam.id} className={exam.aiRiskLevel === 'High' ? "table-danger" : ""}>
                  <td><b>#{index + 1}</b></td>
                  <td>{exam.patientName || "Chưa có tên"}</td>
                  <td>{new Date(exam.examDate).toLocaleString('vi-VN')}</td>
                  <td>{getRiskBadge(exam.aiRiskLevel)}</td>
                  <td>
                    <button className="btn btn-primary btn-sm" onClick={() => navigate(`/doctor/exam/${exam.id}`)}>🔍 Chẩn đoán</button>
                  </td>
                </tr>
              ))
            ) : (
              <tr><td colSpan={5} className="text-center py-5">Hàng chờ trống.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ExaminationQueue;