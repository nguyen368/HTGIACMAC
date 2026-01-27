import React, { useEffect, useState } from "react";
import axios from "axios";
import { Bar } from "react-chartjs-2";
import "chart.js/auto";

interface SystemStats {
  totalPatients: number;
  pendingExams: number;
  highRiskCases: number;
  completedToday: number;
}
interface RevenueItem {
  date: string;
  totalAmount: number;
}
interface ChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor: string;
    borderRadius: number;
  }[];
}

const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [chartData, setChartData] = useState<ChartData | null>(null);

  useEffect(() => {
    const fetchStats = async (): Promise<void> => {
      try {
        const res = await axios.get<SystemStats>("http://localhost:80/api/medical-records/examinations/stats");
        setStats(res.data);
      } catch (err) { console.error(err); }
    };

    const fetchRevenue = async (): Promise<void> => {
      try {
        const res = await axios.get<any[]>("http://localhost:80/api/billing/admin/revenue-chart");
        const data = res.data; 
        
        setChartData({
          // [FIX] Xử lý ngày tháng cho biểu đồ an toàn
          labels: data.map(d => new Date(d.date || d.Date || d.CreatedAt || Date.now()).toLocaleDateString()),
          datasets: [{
            label: "Doanh thu (VND)",
            data: data.map(d => d.totalAmount || d.TotalAmount || 0),
            backgroundColor: "#3b82f6",
            borderRadius: 5
          }]
        });
      } catch (err) { console.error(err); }
    };

    fetchStats();
    fetchRevenue();
  }, []);

  // [FIX] Accessor an toàn cho Stats
  const s = stats as any; 

  return (
    <div className="container-fluid p-4">
      <h2 className="mb-4">⚡ System Dashboard</h2>
      <div className="row mb-4">
        <div className="col-md-3"><div className="card text-white bg-primary mb-3"><div className="card-body"><h5 className="card-title">Tổng Bệnh Nhân</h5><p className="card-text display-6">{stats?.totalPatients || s?.TotalPatients || 0}</p></div></div></div>
        <div className="col-md-3"><div className="card text-white bg-warning mb-3"><div className="card-body"><h5 className="card-title">Chờ Xử Lý (Queue)</h5><p className="card-text display-6">{stats?.pendingExams || s?.PendingExams || 0}</p></div></div></div>
        <div className="col-md-3"><div className="card text-white bg-danger mb-3"><div className="card-body"><h5 className="card-title">Ca Nguy Cơ Cao (High Risk)</h5><p className="card-text display-6">{stats?.highRiskCases || s?.HighRiskCases || 0}</p></div></div></div>
        <div className="col-md-3"><div className="card text-white bg-success mb-3"><div className="card-body"><h5 className="card-title">Hoàn Thành Hôm Nay</h5><p className="card-text display-6">{stats?.completedToday || s?.CompletedToday || 0}</p></div></div></div>
      </div>
      <div className="row">
        <div className="col-md-8">
          <div className="card shadow">
            <div className="card-header bg-white font-weight-bold">💰 Biểu đồ Doanh thu (7 ngày qua)</div>
            <div className="card-body">{chartData ? <Bar data={chartData} /> : <p>Đang tải dữ liệu...</p>}</div>
          </div>
        </div>
      </div>
    </div>
  );
};
export default AdminDashboard;