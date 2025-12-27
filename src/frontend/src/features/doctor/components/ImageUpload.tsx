import React, { useState } from 'react';
import { Upload, Button, Card, Typography, message, Row, Col, Steps, Alert, Progress, Spin } from 'antd';
import { 
  CloudUploadOutlined, 
  FileImageOutlined, 
  MedicineBoxOutlined, 
  ScanOutlined, 
  SafetyCertificateOutlined 
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import type { UploadProps } from 'antd';

const { Dragger } = Upload;
const { Title, Text } = Typography;

const ImageUpload: React.FC = () => {
  const navigate = useNavigate();
  const [uploadState, setUploadState] = useState<'idle' | 'uploading' | 'analyzing' | 'success'>('idle');
  const [progress, setProgress] = useState(0);

  const customUploadProps: UploadProps = {
    name: 'file',
    multiple: false,
    showUploadList: false,
    action: 'https://run.mocky.io/v3/435ba68c-13a8-44d2-8589-2948718f8b4b', // Mock API
    beforeUpload(file) {
      const isJpgOrPng = file.type === 'image/jpeg' || file.type === 'image/png';
      if (!isJpgOrPng) {
        message.error('Chỉ hỗ trợ định dạng JPG/PNG!');
      }
      return isJpgOrPng;
    },
    onChange(info) {
      const { status } = info.file;
      
      if (status === 'uploading') {
        setUploadState('uploading');
        // Giả lập tiến trình upload
        const interval = setInterval(() => {
            setProgress((prev) => {
                if (prev >= 90) {
                    clearInterval(interval);
                    return 90;
                }
                return prev + 10;
            });
        }, 100);
      }
      
      if (status === 'done') {
        setProgress(100);
        setUploadState('analyzing');
        message.success(`Tải ảnh lên thành công. Đang phân tích...`);
        
        // Giả lập thời gian AI phân tích (2 giây)
        setTimeout(() => {
            setUploadState('success');
            setTimeout(() => navigate('/diagnosis/BN-2024-0892'), 500); 
        }, 2000);

      } else if (status === 'error') {
        setUploadState('idle');
        message.error(`Tải ảnh thất bại.`);
      }
    },
  };

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '24px' }}>
      
      {/* Header Section */}
      <div style={{ textAlign: 'center', marginBottom: 40 }}>
        <Title level={2} style={{ color: '#003a8c', marginBottom: 8 }}>
          Tải Lên Hình Ảnh Giác Mạc
        </Title>
        <Text type="secondary" style={{ fontSize: 16 }}>
          Hệ thống AI sẽ phân tích hình ảnh đèn khe để chẩn đoán bệnh lý
        </Text>
      </div>

      <Row gutter={[32, 32]} align="stretch">
        
        {/* Cột Trái: Hướng dẫn & Quy trình */}
        <Col xs={24} lg={9}>
          <Card 
            title={<span style={{ color: '#0050b3' }}><SafetyCertificateOutlined /> Quy Trình Tiêu Chuẩn</span>}
            bordered={false}
            style={{ height: '100%', boxShadow: '0 6px 16px rgba(0,0,0,0.06)', borderRadius: 16 }}
          >
            <Steps
              direction="vertical"
              current={uploadState === 'idle' ? 0 : uploadState === 'uploading' ? 1 : 2}
              items={[
                {
                  title: 'Chọn ảnh',
                  description: 'Ảnh chụp đèn khe rõ nét (JPG/PNG).',
                  icon: <FileImageOutlined />,
                },
                {
                  title: 'Tải lên & Mã hóa',
                  description: 'Dữ liệu được bảo mật chuẩn HIPAA.',
                  icon: <CloudUploadOutlined />,
                },
                {
                  title: 'AI Phân tích',
                  description: 'Deep Learning chẩn đoán tổn thương.',
                  icon: <ScanOutlined />,
                },
                {
                  title: 'Kết quả',
                  description: 'Hiển thị bản đồ nhiệt & phác đồ.',
                  icon: <MedicineBoxOutlined />,
                },
              ]}
            />
            <div style={{ marginTop: 24 }}>
                <Alert 
                    message="Lưu ý chất lượng ảnh" 
                    description="Tránh ảnh bị mờ hoặc lóa sáng quá mức để đảm bảo độ chính xác >95%."
                    type="info" 
                    showIcon 
                    style={{ background: '#e6f7ff', border: '1px solid #91d5ff', borderRadius: 8 }}
                />
            </div>
          </Card>
        </Col>

        {/* Cột Phải: Khu vực Upload */}
        <Col xs={24} lg={15}>
          <Card 
            bordered={false}
            style={{ 
                height: '100%', 
                boxShadow: '0 6px 16px rgba(0,0,0,0.06)', 
                borderRadius: 16,
                display: 'flex',
                flexDirection: 'column'
            }}
            bodyStyle={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}
          >
            {uploadState === 'analyzing' ? (
                // Giao diện khi đang phân tích
                <div style={{ textAlign: 'center', padding: 40 }}>
                    <Spin size="large" />
                    <Title level={4} style={{ color: '#0050b3', marginTop: 20 }}>Đang phân tích hình ảnh...</Title>
                    <Text type="secondary">AI đang quét vùng tổn thương trên giác mạc</Text>
                </div>
            ) : uploadState === 'uploading' ? (
                // Giao diện khi đang upload
                <div style={{ textAlign: 'center', padding: 40 }}>
                    <Title level={4} style={{ color: '#0050b3' }}>Đang tải lên máy chủ...</Title>
                    <Progress 
                        percent={progress} 
                        status="active" 
                        strokeColor={{ from: '#108ee9', to: '#87d068' }} 
                        strokeWidth={12}
                    />
                </div>
            ) : (
                // Giao diện mặc định (Chưa upload)
                <Dragger 
                    {...customUploadProps} 
                    style={{ 
                        padding: '40px 20px', 
                        background: '#f9fcff', 
                        border: '2px dashed #40a9ff', 
                        borderRadius: 16,
                        transition: 'all 0.3s ease'
                    }}
                    className="custom-dragger"
                >
                    <p className="ant-upload-drag-icon">
                        <CloudUploadOutlined style={{ color: '#1890ff', fontSize: 64 }} />
                    </p>
                    <Title level={4} style={{ color: '#003a8c', marginBottom: 10 }}>
                        Kéo thả hình ảnh vào đây
                    </Title>
                    <Text type="secondary" style={{ display: 'block', marginBottom: 20 }}>
                        Hỗ trợ tải lên nhanh hoặc nhấn nút bên dưới
                    </Text>
                    <Button 
                        type="primary" 
                        size="large" 
                        shape="round"
                        icon={<CloudUploadOutlined />} 
                        style={{ height: 45, paddingLeft: 30, paddingRight: 30, background: '#0050b3' }}
                    >
                        Chọn Ảnh Từ Máy Tính
                    </Button>
                </Dragger>
            )}
            
            {/* Ảnh mẫu test nhanh */}
            {uploadState === 'idle' && (
                <div style={{ marginTop: 30, borderTop: '1px solid #f0f0f0', paddingTop: 20 }}>
                    <Text type="secondary" style={{ fontSize: 13 }}>Thử nhanh với dữ liệu mẫu:</Text>
                    <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
                        {[1, 2, 3].map(i => (
                            <div 
                                key={i}
                                onClick={() => message.info('Tính năng đang phát triển')}
                                style={{ 
                                    width: 80, 
                                    height: 60, 
                                    background: '#e6f7ff', 
                                    borderRadius: 8, 
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    justifyContent: 'center',
                                    cursor: 'pointer',
                                    border: '1px solid #bae7ff',
                                    color: '#0050b3',
                                    fontWeight: 500
                                }}
                            >
                                Mẫu {i}
                            </div>
                        ))}
                    </div>
                </div>
            )}
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default ImageUpload;