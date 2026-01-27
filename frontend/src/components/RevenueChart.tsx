import React from 'react';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ChartData,
  ChartOptions
} from 'chart.js';

// [QUAN TRỌNG] Đăng ký các thành phần bắt buộc cho Chart.js v4+
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface Bill {
    patientId: string;
    totalAmount: number;
}

interface RevenueChartProps {
    bills: Bill[];
}

const RevenueChart: React.FC<RevenueChartProps> = ({ bills }) => {
    // Chế biến dữ liệu: Cắt ngắn ID bệnh nhân để làm nhãn
    const labels = bills.map(b => `BN: ...${b.patientId.substring(0, 5)}`); 
    const dataValues = bills.map(b => b.totalAmount);

    const data: ChartData<'bar'> = {
        labels,
        datasets: [
          {
            label: 'Doanh thu (VND)',
            data: dataValues,
            backgroundColor: 'rgba(53, 162, 235, 0.5)',
            borderColor: 'rgb(53, 162, 235)',
            borderWidth: 1,
          },
        ],
    };

    const options: ChartOptions<'bar'> = {
        responsive: true,
        plugins: {
            legend: {
                position: 'top' as const,
            },
            title: {
                display: true,
                text: 'Biểu đồ doanh thu theo bệnh nhân',
            },
        },
    };

    return <Bar options={options} data={data} />;
};

export default RevenueChart;