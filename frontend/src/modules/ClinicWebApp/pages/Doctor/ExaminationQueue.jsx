import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import medicalApi from "../../../../api/medicalApi";
import { useSignalR } from "../../../../context/SignalRContext";

const ExaminationQueue = () => {
  const [queue, setQueue] = useState([]);
  const navigate = useNavigate();
  const { lastNotification } = useSignalR(); // Lắng nghe real-time

  const fetchQueue = async () => {
    try {
      const res = await medicalApi.getWaitingList();
      setQueue(res);
    } catch (error) {
      console.error(error);
    }
  };

  // Load lần đầu
  useEffect(() => {
    fetchQueue();
  }, []);

  // Khi có thông báo mới từ AI -> Tự động reload danh sách
  useEffect(() => {
    if (lastNotification?.Type === "AiFinished") {
      fetchQueue();
    }
  }, [lastNotification]);

  const getRiskBadge = (level) => {
    switch (level) {
      case "High": return <span className="badge bg-danger">🔴 NGUY CƠ CAO</span>;
      case "Medium": return <span className="badge bg-warning text-dark">🟡 Trung bình</span>;
      case "Low": return <span className="badge bg-success">🟢 Thấp</span>;
      default: return <span className="badge bg-secondary">⚪ Đang chờ AI...</span>;
    }
  };

  return (
    <div className="container mt-4">
      <h2>📋 Danh sách chờ khám (CDS Priority)</h2>
      <p className="text-muted">Hệ thống tự động ưu tiên các ca có dấu hiệu bất thường.</p>
      
      <div className="table-responsive shadow-sm rounded">
        <table className="table table-hover align-middle">
          <thead className="table-light">
            <tr>
              <th>Ưu tiên</th>
              <th>Bệnh nhân</th>
              <th>Thời gian chụp</th>
              <th>AI Đánh giá (Sơ bộ)</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {queue.map((exam, index) => (
              <tr key={exam.id} className={exam.aiRiskLevel === 'High' ? "table-danger" : ""}>
                <td>
                  {/* Logic hiển thị thứ tự ưu tiên */}
                  {exam.aiRiskLevel === 'High' ? <b className="text-danger">#{index + 1} (Ưu tiên)</b> : `#${index + 1}`}
                </td>
                <td>
                  <div className="d-flex align-items-center">
                    <img src={exam.imageUrl} alt="eye" className="rounded-circle me-2" width="40" height="40" style={{objectFit: 'cover'}}/>
                    <div>
                      <strong>{exam.patientName}</strong><br/>
                      <small className="text-muted">ID: {exam.patientId.substring(0,8)}...</small>
                    </div>
                  </div>
                </td>
                <td>{new Date(exam.examDate).toLocaleString()}</td>
                <td>
                  {getRiskBadge(exam.aiRiskLevel)} <br/>
                  <small>{exam.aiDiagnosis}</small>
                </td>
                <td>
                  <button 
                    className="btn btn-primary btn-sm"
                    onClick={() => navigate(`/clinic/exam/${exam.id}`)}
                  >
                    🔍 Chẩn đoán
                  </button>
                </td>
              </tr>
            ))}
            {queue.length === 0 && (
              <tr><td colSpan="5" className="text-center py-4">Không có bệnh nhân đang chờ.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ExaminationQueue;