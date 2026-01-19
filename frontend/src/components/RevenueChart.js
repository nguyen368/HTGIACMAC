import React, { useEffect, useState } from 'react';
import { Bar } from 'react-chartjs-2';
import { getBills } from '../services/billingService';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

// Đăng ký các thành phần cho ChartJS
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const RevenueChart = () => {
  const [chartData, setChartData] = useState({
    labels: [],
    datasets: [],
  });

  useEffect(() => {
    const fetchData = async () => {
      // 1. Gọi API lấy dữ liệu
      const bills = await getBills();

      // 2. Chế biến dữ liệu (Lấy ID làm nhãn, Tổng tiền làm cột)
      const labels = bills.map(b => `BN: ...${b.patientId.substring(0, 5)}`); // Cắt ngắn ID cho đẹp
      const data = bills.map(b => b.totalAmount);

      // 3. Cập nhật vào biểu đồ
      setChartData({
        labels: labels,
        datasets: [
          {
            label: 'Doanh thu (VND)',
            data: data,
            backgroundColor: 'rgba(53, 162, 235, 0.5)', // Màu xanh dương
            borderColor: 'rgb(53, 162, 235)',
            borderWidth: 1,
          },
        ],
      });
    };

    fetchData();
  }, []);

  const options = {
    responsive: true,
    plugins: {
      legend: { position: 'top' },
      title: { display: true, text: 'Thống Kê Doanh Thu Bệnh Viện Mắt' },
    },
  };

  return (
    <div style={{ width: '800px', margin: '50px auto' }}>
      <h2 style={{ textAlign: 'center' }}>Dashboard Quản Trị</h2>
      <Bar options={options} data={chartData} />
    </div>
  );
};

export default RevenueChart;