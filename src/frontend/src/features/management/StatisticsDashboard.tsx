import React from 'react';
import { Card, Col, Row, Statistic } from 'antd';
import { ArrowUpOutlined, UserOutlined, WarningOutlined } from '@ant-design/icons';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

// Dữ liệu giả lập cho biểu đồ (Mock Data)
const riskData = [
  { name: 'High', value: 12 },
  { name: 'Medium', value: 25 },
  { name: 'Low', value: 48 },
  { name: 'Normal', value: 15 },
];

const weeklyData = [
  { day: 'T2', cases: 4 },
  { day: 'T3', cases: 7 },
  { day: 'T4', cases: 5 },
  { day: 'T5', cases: 10 },
  { day: 'T6', cases: 8 },
  { day: 'T7', cases: 12 },
  { day: 'CN', cases: 3 },
];

const COLORS = ['#FF4D4F', '#FAAD14', '#52C41A', '#1890FF'];

const StatisticsDashboard: React.FC = () => {
  return (
    <div style={{ padding: 24 }}>
      <h2>Thống Kê Tổng Quan Hệ Thống</h2>
      
      {/* Phần thẻ số liệu tổng hợp */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={8}>
          <Card>
            <Statistic
              title="Tổng số bệnh nhân"
              value={1128}
              prefix={<UserOutlined />}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              title="Ca nguy cơ cao (Tuần này)"
              value={12}
              valueStyle={{ color: '#cf1322' }}
              prefix={<WarningOutlined />}
              suffix={<ArrowUpOutlined />}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              title="Độ chính xác AI trung bình"
              value={98.5}
              precision={2}
              suffix="%"
            />
          </Card>
        </Col>
      </Row>

      {/* Phần Biểu đồ */}
      <Row gutter={24}>
        {/* Biểu đồ tròn: Tỷ lệ bệnh */}
        <Col span={12}>
          <Card title="Phân Bố Mức Độ Nguy Cơ">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={riskData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  fill="#8884d8"
                  paddingAngle={5}
                  dataKey="value"
                  label
                >
                  {riskData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </Card>
        </Col>

        {/* Biểu đồ cột: Số ca theo ngày */}
        <Col span={12}>
          <Card title="Số Lượng Ca Khám Trong Tuần">
            <ResponsiveContainer width="100%" height={300}>
<BarChart data={weeklyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="cases" name="Số ca khám" fill="#1890FF" />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default StatisticsDashboard;