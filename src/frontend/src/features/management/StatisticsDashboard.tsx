import React, { useState } from 'react';
import { Card, Col, Row, Statistic, Select, List, Avatar, Tag, Space, Typography, DatePicker } from 'antd';
import { 
  ArrowUpOutlined, 
  ArrowDownOutlined, 
  UserOutlined, 
  MedicineBoxOutlined, 
  CheckCircleOutlined,
  ClockCircleOutlined 
} from '@ant-design/icons';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, 
  ResponsiveContainer, PieChart, Pie, Cell, Legend 
} from 'recharts';
import dayjs from 'dayjs';

const { Option } = Select;
const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

// --- Dữ liệu Mock (Giả lập) ---

// Dữ liệu biểu đồ tròn (Risk)
const riskData = [
  { name: 'Nguy cơ cao', value: 15 },
  { name: 'Trung bình', value: 30 },
  { name: 'Thấp', value: 45 },
  { name: 'Bình thường', value: 10 },
];

// Dữ liệu biểu đồ xu hướng (Area Chart)
const trendData = [
  { date: '20/12', cases: 12, aiAccuracy: 92 },
  { date: '21/12', cases: 18, aiAccuracy: 95 },
  { date: '22/12', cases: 10, aiAccuracy: 88 },
  { date: '23/12', cases: 25, aiAccuracy: 96 },
  { date: '24/12', cases: 20, aiAccuracy: 94 },
  { date: '25/12', cases: 32, aiAccuracy: 98 },
  { date: '26/12', cases: 28, aiAccuracy: 97 },
];

// Dữ liệu hoạt động gần đây (Recent Activity)
const recentActivities = [
  { id: 1, doctor: 'Dr. Strange', action: 'đã chẩn đoán', patient: 'Nguyễn Văn A', risk: 'High', time: '10 phút trước' },
  { id: 2, doctor: 'Dr. House', action: 'đã tải lên ảnh', patient: 'Trần Thị B', risk: 'Processing', time: '30 phút trước' },
  { id: 3, doctor: 'Dr. Who', action: 'đã xác thực', patient: 'Lê Văn C', risk: 'Low', time: '1 giờ trước' },
  { id: 4, doctor: 'Dr. Watson', action: 'đã hoàn tất hồ sơ', patient: 'Phạm Thị D', risk: 'Normal', time: '2 giờ trước' },
];

// Màu sắc theo chuẩn Medical Blue
const COLORS = ['#ff4d4f', '#faad14', '#52c41a', '#1890ff']; 

const StatisticsDashboard: React.FC = () => {
  const [timeRange, setTimeRange] = useState('week');

  // Custom Tooltip cho biểu đồ
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div style={{ backgroundColor: '#fff', padding: '10px', border: '1px solid #f0f0f0', borderRadius: '4px', boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }}>
          <p style={{ margin: 0, fontWeight: 'bold' }}>{label}</p>
          <p style={{ margin: 0, color: '#1890ff' }}>Số ca khám: {payload[0].value}</p>
          <p style={{ margin: 0, color: '#52c41a' }}>Độ chính xác AI: {payload[1].value}%</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div style={{ padding: 24, minHeight: '100vh' }}>
      {/* Header: Tiêu đề + Bộ lọc */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
<Title level={3} style={{ margin: 0, color: '#002766' }}>Dashboard Thống Kê</Title>
          <Text type="secondary">Tổng quan hoạt động hệ thống chẩn đoán giác mạc</Text>
        </div>
        <Space>
          <Select defaultValue="week" style={{ width: 120 }} onChange={setTimeRange}>
            <Option value="week">7 ngày qua</Option>
            <Option value="month">Tháng này</Option>
            <Option value="year">Năm nay</Option>
          </Select>
          <RangePicker />
        </Space>
      </div>

      {/* Row 1: Thẻ thống kê (Metric Cards) */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card bordered={false} hoverable style={{ borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
            <Statistic
              title="Tổng Bệnh Nhân"
              value={1248}
              prefix={<UserOutlined style={{ color: '#1890ff', background: '#e6f7ff', padding: 8, borderRadius: '50%' }} />}
              suffix={<Text type="success" style={{ fontSize: 14 }}><ArrowUpOutlined /> 12%</Text>}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card bordered={false} hoverable style={{ borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
            <Statistic
              title="Ca Nguy Cơ Cao"
              value={42}
              valueStyle={{ color: '#cf1322' }}
              prefix={<MedicineBoxOutlined style={{ color: '#ff4d4f', background: '#fff1f0', padding: 8, borderRadius: '50%' }} />}
              suffix={<Text type="danger" style={{ fontSize: 14 }}><ArrowUpOutlined /> 5%</Text>}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card bordered={false} hoverable style={{ borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
            <Statistic
              title="Độ Chính Xác AI"
              value={98.5}
              precision={1}
              suffix="%"
              prefix={<CheckCircleOutlined style={{ color: '#52c41a', background: '#f6ffed', padding: 8, borderRadius: '50%' }} />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card bordered={false} hoverable style={{ borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
            <Statistic
              title="Thời Gian Xử Lý TB"
              value={1.2}
              suffix="giây"
              prefix={<ClockCircleOutlined style={{ color: '#faad14', background: '#fffbe6', padding: 8, borderRadius: '50%' }} />}
              valueStyle={{ fontSize: 24 }}
            />
          </Card>
        </Col>
      </Row>

      {/* Row 2: Biểu đồ chính */}
      <Row gutter={[24, 24]} style={{ marginBottom: 24 }}>
        {/* Biểu đồ xu hướng (Area Chart) - Chiếm 2/3 */}
        <Col xs={24} lg={16}>
<Card title="Xu Hướng Khám Bệnh & Hiệu Suất AI" bordered={false} style={{ borderRadius: 8, height: '100%' }}>
            <ResponsiveContainer width="100%" height={320}>
              <AreaChart data={trendData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorCases" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#1890ff" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#1890ff" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorAi" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#52c41a" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#52c41a" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} />
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <RechartsTooltip content={<CustomTooltip />} />
                <Legend />
                <Area type="monotone" dataKey="cases" name="Số ca khám" stroke="#1890ff" fillOpacity={1} fill="url(#colorCases)" strokeWidth={2} />
                <Area type="monotone" dataKey="aiAccuracy" name="Độ chính xác (%)" stroke="#52c41a" fillOpacity={1} fill="url(#colorAi)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </Card>
        </Col>

        {/* Biểu đồ tròn (Pie Chart) - Chiếm 1/3 */}
        <Col xs={24} lg={8}>
          <Card title="Phân Bố Mức Độ Nguy Cơ" bordered={false} style={{ borderRadius: 8, height: '100%' }}>
            <ResponsiveContainer width="100%" height={320}>
              <PieChart>
                <Pie
                  data={riskData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {riskData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <RechartsTooltip />
                <Legend layout="horizontal" verticalAlign="bottom" align="center" />
                {/* Text ở giữa biểu đồ tròn */}
                <text x="50%" y="45%" textAnchor="middle" dominantBaseline="middle" style={{ fontSize: '24px', fontWeight: 'bold', fill: '#002766' }}>
                  100%
                </text>
                <text x="50%" y="55%" textAnchor="middle" dominantBaseline="middle" style={{ fontSize: '14px', fill: '#8c8c8c' }}>
                  Tổng hợp
                </text>
              </PieChart>
            </ResponsiveContainer>
          </Card>
        </Col>
      </Row>
{/* Row 3: Hoạt động gần đây */}
      <Row gutter={24}>
        <Col span={24}>
          <Card title="Hoạt Động Gần Đây" bordered={false} style={{ borderRadius: 8 }}>
            <List
              itemLayout="horizontal"
              dataSource={recentActivities}
              renderItem={item => (
                <List.Item
                  actions={[<a key="view">Xem chi tiết</a>]}
                >
                  <List.Item.Meta
                    avatar={<Avatar style={{ backgroundColor: '#0050b3' }}>{item.doctor[4]}</Avatar>}
                    title={
                      <Space>
                        <Text strong>{item.doctor}</Text>
                        <Text type="secondary">{item.action}</Text>
                        <Text strong>{item.patient}</Text>
                      </Space>
                    }
                    description={
                      <Space>
                        <ClockCircleOutlined style={{ fontSize: 12 }} /> 
                        <Text type="secondary" style={{ fontSize: 12 }}>{item.time}</Text>
                      </Space>
                    }
                  />
                  <div>
                    {item.risk === 'High' && <Tag color="error">NGUY CƠ CAO</Tag>}
                    {item.risk === 'Medium' && <Tag color="warning">TRUNG BÌNH</Tag>}
                    {item.risk === 'Low' && <Tag color="success">THẤP</Tag>}
                    {item.risk === 'Normal' && <Tag color="processing">BÌNH THƯỜNG</Tag>}
                    {item.risk === 'Processing' && <Tag icon={<ClockCircleOutlined />} color="default">ĐANG XỬ LÝ</Tag>}
                  </div>
                </List.Item>
              )}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default StatisticsDashboard;