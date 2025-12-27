import React, { useState } from 'react';
import { 
  Upload, 
  Button, 
  Card, 
  Typography, 
  List, 
  Image, 
  Progress, 
  message, 
  Space, 
  Alert 
} from 'antd';
import { 
  InboxOutlined, 
  DeleteOutlined, 
  CloudUploadOutlined, 
  ExperimentOutlined 
} from '@ant-design/icons';
import type { UploadFile, UploadProps } from 'antd';

const { Title, Text, Paragraph } = Typography;
const { Dragger } = Upload;

const ImageUpload: React.FC = () => {
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);

  // Cấu hình cho component Upload của Ant Design
  const uploadProps: UploadProps = {
    onRemove: (file) => {
      const index = fileList.indexOf(file);
      const newFileList = fileList.slice();
      newFileList.splice(index, 1);
      setFileList(newFileList);
    },
    beforeUpload: (file) => {
      // Kiểm tra định dạng ảnh (JPG/PNG) và kích thước (<5MB)
      const isJpgOrPng = file.type === 'image/jpeg' || file.type === 'image/png';
      if (!isJpgOrPng) {
        message.error('Bạn chỉ có thể tải lên file định dạng JPG hoặc PNG!');
        return Upload.LIST_IGNORE;
      }
      const isLt5M = file.size / 1024 / 1024 < 5;
      if (!isLt5M) {
        message.error('Ảnh phải nhỏ hơn 5MB!');
        return Upload.LIST_IGNORE;
      }

      setFileList((prev) => [...prev, file]);
      return false; // Ngăn không cho upload tự động ngay lập tức (để chờ nút Analyze)
    },
    fileList,
    multiple: true, // [FR-2] Cho phép upload nhiều ảnh
    listType: 'picture',
    maxCount: 100, // [NFR-2] Hỗ trợ xử lý số lượng lớn
  };

  // Hàm xử lý khi nhấn nút "Bắt đầu Phân tích"
  const handleAnalyze = () => {
    if (fileList.length === 0) {
      message.warning('Vui lòng chọn ít nhất một ảnh võng mạc để phân tích.');
      return;
    }

    setUploading(true);
    setAnalysisProgress(0);

    // Giả lập quá trình upload và phân tích (Mocking API call)
    // Thực tế bạn sẽ gọi API đến UploadController.cs ở đây
    const formData = new FormData();
    fileList.forEach((file) => {
      formData.append('files', file as any);
    });

    // Giả lập tiến trình [NFR-1]: 10-20s
    let progress = 0;
    const interval = setInterval(() => {
      progress += 10;
      setAnalysisProgress(progress);
      if (progress >= 100) {
        clearInterval(interval);
        setUploading(false);
        message.success('Phân tích hoàn tất! Đang chuyển hướng đến trang kết quả...');
        // Tại đây sẽ chuyển hướng (navigate) sang trang DiagnosisViewer
      }
    }, 1500); 
  };

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        
        {/* Phần Header */}
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <Title level={2} style={{ color: '#1890ff' }}>
            <ExperimentOutlined /> Sàng Lọc Sức Khỏe Mạch Máu Võng Mạc
          </Title>
          <Paragraph>
            Tải lên hình ảnh chụp đáy mắt (Fundus) hoặc OCT để hệ thống AI (AURA) phân tích và phát hiện sớm các rủi ro bệnh lý.
          </Paragraph>
        </div>

        <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
          {/* Khu vực Upload (Bên trái) */}
          <Card title="Tải ảnh lên" bordered={false} style={{ flex: 1, minWidth: '300px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
            <Dragger {...uploadProps} style={{ padding: '40px 0' }}>
              <p className="ant-upload-drag-icon">
                <InboxOutlined style={{ color: '#1890ff', fontSize: '48px' }} />
              </p>
              <p className="ant-upload-text">Nhấp hoặc kéo thả ảnh vào khu vực này</p>
              <p className="ant-upload-hint">
                Hỗ trợ tải lên đơn lẻ hoặc hàng loạt. Định dạng: .JPG, .PNG
              </p>
            </Dragger>
            
            <div style={{ marginTop: '20px' }}>
              <Alert 
                message="Lưu ý quan trọng" 
                description="Đảm bảo ảnh chụp rõ nét, không bị lóa sáng để AI có thể đưa ra kết quả chính xác nhất. Tất cả dữ liệu bệnh nhân sẽ được mã hóa."
                type="info" 
                showIcon 
              />
            </div>
          </Card>

          {/* Khu vực Danh sách & Xem trước (Bên phải) */}
          <Card 
            title={`Danh sách ảnh (${fileList.length})`} 
            bordered={false} 
            style={{ flex: 1, minWidth: '300px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
            extra={
               fileList.length > 0 && (
                <Button 
                    type="text" 
                    danger 
                    icon={<DeleteOutlined />} 
                    onClick={() => setFileList([])}
                    disabled={uploading}
                >
                    Xóa tất cả
                </Button>
               )
            }
          >
            {fileList.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
                    Chưa có ảnh nào được chọn.
                </div>
            ) : (
                <List
                    itemLayout="horizontal"
                    dataSource={fileList}
                    renderItem={(file) => (
                    <List.Item
                        actions={[
                            <Button 
                                type="text" 
                                icon={<DeleteOutlined />} 
                                danger 
                                onClick={() => {
                                    const index = fileList.indexOf(file);
                                    const newFileList = fileList.slice();
                                    newFileList.splice(index, 1);
                                    setFileList(newFileList);
                                }}
                                disabled={uploading}
                            />
                        ]}
                    >
                        <List.Item.Meta
                        avatar={
                            <Image
                                src={file.originFileObj ? URL.createObjectURL(file.originFileObj as Blob) : ''}
                                alt={file.name}
                                width={60}
                                height={60}
                                style={{ objectFit: 'cover', borderRadius: '4px' }}
                            />
                        }
                        title={<Text strong>{file.name}</Text>}
                        description={<Text type="secondary">{(file.size ? (file.size / 1024).toFixed(2) : 0)} KB</Text>}
                        />
                    </List.Item>
                    )}
                    style={{ maxHeight: '400px', overflowY: 'auto' }}
                />
            )}

            {/* Nút hành động */}
            <div style={{ marginTop: '24px' }}>
                {uploading && (
                    <div style={{ marginBottom: '16px' }}>
                        <Text>Đang phân tích...</Text>
                        <Progress percent={analysisProgress} status="active" />
                    </div>
                )}
                
                <Button 
                    type="primary" 
                    icon={<CloudUploadOutlined />} 
                    size="large" 
                    block 
                    onClick={handleAnalyze}
                    loading={uploading}
                    disabled={fileList.length === 0}
                    style={{ height: '50px', fontSize: '16px', fontWeight: 600 }}
                >
                    {uploading ? 'Đang xử lý AI...' : 'Bắt đầu Phân tích'}
                </Button>
            </div>
          </Card>
        </div>
      </Space>
    </div>
  );
};

export default ImageUpload;