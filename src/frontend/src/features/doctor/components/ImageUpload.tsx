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
import type { UploadProps, RcFile } from 'antd/es/upload/interface';
import dayjs from 'dayjs';

const { Dragger } = Upload;
const { Title, Text } = Typography;

// Hàm chuyển ảnh sang Base64
const getBase64 = (file: RcFile): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });

const ImageUpload: React.FC = () => {
  const navigate = useNavigate();
  const [uploadState, setUploadState] = useState<'idle' | 'uploading' | 'analyzing' | 'success'>('idle');
  const [progress, setProgress] = useState(0);

  // --- LOGIC XỬ LÝ UPLOAD VÀ LƯU DỮ LIỆU ---
  const handleFileUpload = async (file: RcFile) => {
    // 1. Bắt đầu Upload
    setUploadState('uploading');
    setProgress(0);

    // 2. Chạy thanh progress giả lập (từ 0 -> 90%)
    let currentProgress = 0;
    const timer = setInterval(() => {
      currentProgress += 10;
      if (currentProgress > 90) {
        clearInterval(timer); // Dừng ở 90 để chờ xử lý xong
      } else {
        setProgress(currentProgress);
      }
    }, 200); // Tốc độ chạy (200ms nhảy 1 lần)

    try {
      // 3. Giả lập độ trễ mạng (1.5 giây)
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Xử lý xong -> Đẩy lên 100%
      clearInterval(timer);
      setProgress(100);
      setUploadState('analyzing');
      message.success('Tải ảnh thành công. Đang phân tích AI...');

      // 4. Xử lý dữ liệu (Lưu vào LocalStorage)
      const base64Url = await getBase64(file);
      
      // Tạo ID hồ sơ động (Ví dụ: BN-20251231-1030)
      const newRecordId = `BN-${dayjs().format('YYYYMMDD-HHmmss')}`;

      // Tạo object hồ sơ
      const newRecord = {
          id: newRecordId,
          patientName: 'Bệnh nhân Mới', // Tên tạm (sau này có form nhập sẽ thay thế)
          doctorName: 'BS. Trần Minh',
          date: dayjs().format('YYYY-MM-DD HH:mm'),
          riskLevel: 'Đang xử lý', 
          imageUrl: base64Url,
          status: 'completed'
      };

      // Lưu vào kho
      const storedHistory = localStorage.getItem('medical_history');
      const historyList = storedHistory ? JSON.parse(storedHistory) : [];
      localStorage.setItem('medical_history', JSON.stringify([newRecord, ...historyList]));

      // 5. Giả lập AI phân tích (2 giây nữa)
      setTimeout(() => {
          setUploadState('success');
          message.success('Phân tích hoàn tất!');
          // Chuyển hướng sang trang kết quả
          // Lưu ý: Đảm bảo bạn đã có Route cho /diagnosis/:id
          setTimeout(() => navigate(`/diagnosis/${newRecordId}`), 500); 
      }, 2000);

    } catch (error) {
      clearInterval(timer);
      setUploadState('idle');
      message.error('Có lỗi xảy ra khi xử lý ảnh');
    }
  };

  const customUploadProps: UploadProps = {
    name: 'file',
    multiple: false,
    showUploadList: false,
    // Tắt action mặc định để dùng customRequest
    customRequest: ({ file }) => {
        // Gọi hàm xử lý chính của chúng ta
        handleFileUpload(file as RcFile);
    },
    beforeUpload(file) {
      const isJpgOrPng = file.type === 'image/jpeg' || file.type === 'image/png';
      if (!isJpgOrPng) {
        message.error('Chỉ hỗ trợ định dạng JPG/PNG!');
      }
      return isJpgOrPng;
    },
  };

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '24px' }}>
      
      <div style={{ textAlign: 'center', marginBottom: 40 }}>
        <Title level={2} style={{ color: '#003a8c', marginBottom: 8 }}>
          Tải Lên Hình Ảnh Giác Mạc
        </Title>
        <Text type="secondary" style={{ fontSize: 16 }}>
          Hệ thống AI sẽ phân tích hình ảnh đèn khe để chẩn đoán bệnh lý
        </Text>
      </div>

      <Row gutter={[32, 32]} align="stretch">
        
        {/* Cột Trái */}
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
                { title: 'Chọn ảnh', description: 'Ảnh chụp đèn khe rõ nét.', icon: <FileImageOutlined /> },
                { title: 'Tải lên & Mã hóa', description: 'Bảo mật chuẩn HIPAA.', icon: <CloudUploadOutlined /> },
                { title: 'AI Phân tích', description: 'Chẩn đoán tổn thương.', icon: <ScanOutlined /> },
                { title: 'Kết quả', description: 'Bản đồ nhiệt & phác đồ.', icon: <MedicineBoxOutlined /> },
              ]}
            />
            <div style={{ marginTop: 24 }}>
                <Alert 
                  message="Lưu ý chất lượng" 
                  description="Tránh ảnh mờ hoặc lóa sáng."
                  type="info" showIcon 
                  style={{ background: '#e6f7ff', border: '1px solid #91d5ff', borderRadius: 8 }}
                />
            </div>
          </Card>
        </Col>

        {/* Cột Phải */}
        <Col xs={24} lg={15}>
          <Card 
            bordered={false}
            style={{ 
                height: '100%', 
                boxShadow: '0 6px 16px rgba(0,0,0,0.06)', 
                borderRadius: 16,
                display: 'flex', flexDirection: 'column'
            }}
            bodyStyle={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}
          >
            {uploadState === 'analyzing' ? (
                <div style={{ textAlign: 'center', padding: 40 }}>
                    <Spin size="large" />
                    <Title level={4} style={{ color: '#0050b3', marginTop: 20 }}>Đang phân tích hình ảnh...</Title>
                    <Text type="secondary">AI đang quét vùng tổn thương trên giác mạc</Text>
                </div>
            ) : uploadState === 'uploading' ? (
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
                <Dragger 
                    {...customUploadProps} 
                    style={{ 
                        padding: '40px 20px', 
                        background: '#f9fcff', 
                        border: '2px dashed #40a9ff', 
                        borderRadius: 16,
                        transition: 'all 0.3s ease'
                    }}
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
                        type="primary" size="large" shape="round"
                        icon={<CloudUploadOutlined />} 
                        style={{ height: 45, paddingLeft: 30, paddingRight: 30, background: '#0050b3' }}
                    >
                        Chọn Ảnh Từ Máy Tính
                    </Button>
                </Dragger>
            )}
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default ImageUpload;