import React from 'react';
import { 
  Card, Row, Col, Typography, Button, Descriptions, 
  Tag, Divider, Progress, Tabs, Timeline, Statistic, Alert, Space 
} from 'antd';
import { 
  ReloadOutlined, 
  FilePdfOutlined, 
  ShareAltOutlined,
  MedicineBoxOutlined,
  CheckCircleOutlined,
  WarningOutlined,
  EyeOutlined
} from '@ant-design/icons';
import { useParams, useNavigate } from 'react-router-dom';

const { Title, Text, Paragraph } = Typography;

// Bạn có thể định nghĩa Interface ở đây hoặc file types.ts
interface DiagnosisData {
    patient: {
        id: string;
        name: string;
        dob: string;
        gender: string;
        address: string;
        history: string;
    };
    aiResult: {
        date: string;
        prediction: string;
        confidence: number;
        severity: string;
        description: string;
    };
}

const DiagnosisViewer: React.FC = () => {
  const { id } = useParams(); // Lấy ID từ URL (ví dụ: /diagnosis/123)
  const navigate = useNavigate();

  // Dữ liệu giả lập (Hardcode để không bị lỗi prop khi gọi từ App.tsx)
  const data: DiagnosisData = {
    patient: {
      id: id || "BN-2024-001",
      name: "Nguyễn Văn An",
      dob: "15/08/1985",
      gender: "Nam",
      address: "Hà Nội",
      history: "Mắt phải mờ dần 2 tuần nay, có tiền sử chấn thương nhẹ."
    },
    aiResult: {
      date: new Date().toLocaleString('vi-VN'),
      prediction: "Viêm Giác Mạc (Keratitis)",
      confidence: 94.5,
      severity: "Mức độ trung bình",
      description: "Phát hiện vùng tổn thương nhu mô tại vị trí trung tâm, kích thước khoảng 2.5mm. Có dấu hiệu thâm nhiễm."
    }
  };

  // Hàm chọn màu sắc dựa trên độ tin cậy
  const getConfidenceColor = (percent: number) => {
    if (percent >= 80) return '#52c41a';
    if (percent >= 50) return '#faad14';
    return '#f5222d';
  };

  return (
    <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
      
      {/* Header Page */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
           <Space align="center" size="middle">
             <Button onClick={() => navigate('/upload')} icon={<ReloadOutlined />}>Chẩn đoán lại</Button>
             <Title level={3} style={{ margin: 0, color: '#003a8c' }}>Kết Quả Chẩn Đoán AI</Title>
           </Space>
           <div style={{ marginTop: 8, color: '#666' }}>
             Hồ sơ: <Tag color="blue">{data.patient.id}</Tag> | Thời gian: {data.aiResult.date}
           </div>
        </div>
        <Space>
          <Button icon={<ShareAltOutlined />}>Hội chẩn</Button>
          <Button type="primary" icon={<FilePdfOutlined />} style={{ background: '#0050b3' }}>Xuất PDF</Button>
        </Space>
      </div>

      <Row gutter={[24, 24]}>
        
        {/* Cột Trái: Hình ảnh */}
        <Col xs={24} lg={14} xl={15}>
          <Card bordered={false} className="shadow-card" style={{ borderRadius: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
            <Tabs 
              defaultActiveKey="1" 
              items={[
                {
                  key: '1',
                  label: <span><EyeOutlined /> Phân Tích AI</span>,
                  children: (
                    <div style={{ padding: '10px' }}>
                      <Row gutter={16}>
                        <Col span={12}>
                          <div style={{ textAlign: 'center' }}>
                             <Text strong>Ảnh Gốc</Text>
                             <img src="/eye.jpg" alt="Original" style={{ width: '100%', marginTop: 10, borderRadius: 8, border: '1px solid #eee' }} />
                          </div>
                        </Col>
                        <Col span={12}>
                          <div style={{ textAlign: 'center' }}>
                             <Text strong>Bản Đồ Nhiệt (Heatmap)</Text>
                             <img src="/eye.jpg" alt="Heatmap" style={{ width: '100%', marginTop: 10, borderRadius: 8, border: '1px solid #eee', filter: 'hue-rotate(45deg) contrast(1.2)' }} />
                          </div>
                        </Col>
                      </Row>
                      <Divider />
                      <Alert 
                        message="Giải thích vùng tổn thương"
                        description={data.aiResult.description}
                        type="warning"
                        showIcon
                        icon={<WarningOutlined />}
                        style={{ background: '#fffbe6', borderColor: '#ffe58f' }}
                      />
                    </div>
                  )
                }
              ]}
            />
          </Card>

          <Card title="Gợi Ý Phác Đồ Điều Trị (Tham khảo)" style={{ marginTop: 24, borderRadius: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }} bordered={false}>
             <Timeline
                items={[
                  { color: 'red', children: 'Xét nghiệm vi sinh xác định tác nhân.' },
                  { color: 'blue', children: 'Sử dụng kháng sinh/kháng nấm tại chỗ liều tấn công.' },
                  { color: 'green', children: 'Theo dõi đáp ứng lâm sàng sau 24h.' },
                  { color: 'gray', children: 'Tái khám và chỉnh liều.' },
                ]}
              />
          </Card>
        </Col>

        {/* Cột Phải: Kết luận và Thông tin bệnh nhân */}
        <Col xs={24} lg={10} xl={9}>
          
          {/* Card Kết Quả */}
          <Card style={{ marginBottom: 24, background: '#f6ffed', borderColor: '#b7eb8f', borderRadius: 12 }}>
             <div style={{ textAlign: 'center' }}>
                <Text type="secondary">AI dự đoán bệnh lý:</Text>
                <Title level={2} style={{ color: '#d4380d', margin: '10px 0' }}>
                  {data.aiResult.prediction}
                </Title>
                <Divider style={{ margin: '12px 0' }} />
                <Row gutter={16}>
                    <Col span={12}>
                        <Statistic title="Độ tin cậy" value={data.aiResult.confidence} suffix="%" valueStyle={{ color: '#389e0d', fontWeight: 'bold' }} />
                    </Col>
                    <Col span={12}>
                        <Statistic title="Mức độ" value={data.aiResult.severity} valueStyle={{ fontSize: 16 }} />
                    </Col>
                </Row>
                <div style={{ marginTop: 15 }}>
                    <Progress percent={data.aiResult.confidence} strokeColor={getConfidenceColor(data.aiResult.confidence)} showInfo={false} />
                </div>
             </div>
          </Card>

          {/* Card Thông Tin Bệnh Nhân */}
          <Card title={<><MedicineBoxOutlined /> Thông Tin Bệnh Nhân</>} bordered={false} style={{ borderRadius: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
            <Descriptions column={1} layout="horizontal" labelStyle={{ fontWeight: 'bold', width: 100 }}>
              <Descriptions.Item label="Họ tên">{data.patient.name}</Descriptions.Item>
              <Descriptions.Item label="Ngày sinh">{data.patient.dob}</Descriptions.Item>
              <Descriptions.Item label="Giới tính">{data.patient.gender}</Descriptions.Item>
              <Descriptions.Item label="Địa chỉ">{data.patient.address}</Descriptions.Item>
              <Descriptions.Item label="Tiền sử">{data.patient.history}</Descriptions.Item>
            </Descriptions>
          </Card>

          {/* Card Xác Nhận */}
          <Card style={{ marginTop: 24, borderRadius: 12 }} bordered={false}>
             <Title level={5}>Xác nhận của bác sĩ</Title>
             <Space direction="vertical" style={{ width: '100%' }}>
               <Button type="primary" block icon={<CheckCircleOutlined />} style={{ background: '#0050b3' }}>Đồng ý kết quả này</Button>
               <Button block danger>Chỉnh sửa chẩn đoán</Button>
             </Space>
          </Card>

        </Col>
      </Row>
    </div>
  );
};

export default DiagnosisViewer;