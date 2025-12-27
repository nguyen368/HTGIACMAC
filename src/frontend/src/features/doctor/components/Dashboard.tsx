import React, { Suspense, lazy } from 'react';
import { Row, Col, Card, Button, Typography, Skeleton, Statistic } from 'antd';
import { CloudUploadOutlined, HistoryOutlined, LineChartOutlined, RightOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

const { Title, Text } = Typography;

// --- QUAN TRỌNG: ĐOẠN NÀY SẼ GỌI CODE CỦA BẠN ---
// Đảm bảo đường dẫn này trỏ đúng vào file StatisticsDashboard.tsx thật của bạn
const StatisticsPreview = lazy(() => import('../../management/StatisticsDashboard'));
const RecentHistoryPreview = lazy(() => import('../../management/HistoryList'));

const Dashboard: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div style={{ padding: 24 }}>
      {/* KHU VỰC 1: HEADER CHÀO MỪNG */}
      <Card bordered={false} style={{ marginBottom: 24, borderRadius: 12, background: 'linear-gradient(135deg, #0050b3 0%, #1890ff 100%)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'white' }}>
          <div>
            <Title level={3} style={{ color: 'white', margin: 0 }}>Tổng quan hệ thống</Title>
            <Text style={{ color: 'rgba(255,255,255,0.85)' }}>
              Chào mừng quay trở lại. Dưới đây là báo cáo thống kê từ module quản lý.
            </Text>
          </div>
          <Button 
            ghost 
            shape="round"
            icon={<CloudUploadOutlined />} 
            onClick={() => navigate('/upload')}
          >
            Chẩn đoán mới
          </Button>
        </div>
      </Card>

      <Row gutter={[24, 24]}>
        {/* KHU VỰC 2: PHẦN CỦA BẠN (TV5) SẼ HIỆN Ở ĐÂY */}
        <Col xs={24} lg={16}>
          <Card 
            title={<><LineChartOutlined /> Biểu đồ thống kê (Module TV5)</>}
            bordered={false} 
            style={{ borderRadius: 8, minHeight: 400 }}
          >
            {/* Suspense giúp loading mượt mà nếu code của bạn nặng */}
            <Suspense fallback={<Skeleton active paragraph={{ rows: 8 }} />}>
               <StatisticsPreview />
            </Suspense>
          </Card>
        </Col>

        {/* KHU VỰC 3: PHẦN LỊCH SỬ (TV6) */}
        <Col xs={24} lg={8}>
          <Card 
            title={<><HistoryOutlined /> Hoạt động gần đây</>}
            bordered={false} 
            extra={<Button type="link" onClick={() => navigate('/history')}>Xem thêm</Button>}
            style={{ borderRadius: 8, height: '100%' }}
          >
            <Suspense fallback={<Skeleton active avatar paragraph={{ rows: 4 }} />}>
              <RecentHistoryPreview />
            </Suspense>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Dashboard;