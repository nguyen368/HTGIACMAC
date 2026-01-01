import React from 'react';
import { Card, Typography, Button } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import PatientQueueTable from './PatientQueueTable';

const { Title, Paragraph } = Typography;

const PatientQueuePage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div style={{ padding: 24 }}>
      <Button 
        icon={<ArrowLeftOutlined />} 
        onClick={() => navigate('/')} 
        style={{ marginBottom: 16 }}
      >
        Quay lại Dashboard
      </Button>
      
      <Card bordered={false} style={{ borderRadius: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
        <Title level={3}>Hàng chờ khám bệnh</Title>
        <Paragraph>
          Danh sách bệnh nhân đã được hệ thống phân công. Vui lòng chọn bệnh nhân để tiến hành chẩn đoán.
        </Paragraph>
        <PatientQueueTable />
      </Card>
    </div>
  );
};

export default PatientQueuePage;