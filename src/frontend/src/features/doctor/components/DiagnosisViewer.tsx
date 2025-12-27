import React, { useState } from 'react';
import { 
  Layout, Menu, Breadcrumb, Card, Row, Col, 
  Switch, Radio, Input, Button, Modal, 
  message, Space, Descriptions, Tag, Empty, 
  Typography, Avatar, Tooltip 
} from 'antd';
import { 
  EyeOutlined, SaveOutlined, UserOutlined, 
  HomeOutlined, WarningOutlined, CheckCircleOutlined,
  ZoomInOutlined, ZoomOutOutlined, UngroupOutlined,
  MenuUnfoldOutlined, MenuFoldOutlined, MedicineBoxOutlined
} from '@ant-design/icons';
import type { DiagnosisProps } from '../types';

const { Header, Content, Sider } = Layout;
const { Text, Title } = Typography;

const DiagnosisViewer: React.FC<DiagnosisProps> = ({ patient, aiResult, originalImageUrl }) => {
  // --- STATE ---
  const [collapsed, setCollapsed] = useState(false);
  const [showHeatmap, setShowHeatmap] = useState(true);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [finalRisk, setFinalRisk] = useState('High');
  const [loading, setLoading] = useState(false);
  const [imgError, setImgError] = useState(false);

  // --- LOGIC ---
  const handleZoom = (type: 'in' | 'out') => {
    if (type === 'in' && zoomLevel < 3) setZoomLevel(prev => prev + 0.2);
    if (type === 'out' && zoomLevel > 0.6) setZoomLevel(prev => prev - 0.2);
  };

  const handleVerify = () => {
    Modal.confirm({
      title: 'Ký duyệt hồ sơ bệnh án (EMR)',
      icon: <CheckCircleOutlined style={{ color: '#52c41a' }} />,
      content: 'Xác nhận lưu kết quả chẩn đoán vào hệ thống?',
      onOk() {
        setLoading(true);
        setTimeout(() => {
          setLoading(false);
          message.success('Đã lưu thành công!');
        }, 1000);
      }
    });
  };

  return (
    // QUAN TRỌNG: style={{ height: '100vh' }} để layout luôn full màn hình
    <Layout style={{ height: '100vh', overflow: 'hidden' }}>
      
      {/* 1. SIDEBAR TRÁI */}
      <Sider trigger={null} collapsible collapsed={collapsed} width={240} style={{ background: '#001529' }}>
        <div style={{ height: 64, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: collapsed ? 12 : 18, transition: 'all 0.2s' }}>
          {collapsed ? 'AURA' : 'AURA HOSPITAL'}
        </div>
        <Menu
          theme="dark"
          mode="inline"
          defaultSelectedKeys={['2']}
          items={[
            { key: '1', icon: <HomeOutlined />, label: 'Dashboard' },
            { key: '2', icon: <EyeOutlined />, label: 'Chẩn đoán AI' },
            { key: '3', icon: <UserOutlined />, label: 'Bệnh nhân' },
          ]}
        />
      </Sider>

      <Layout>
        {/* 2. HEADER */}
        <Header style={{ background: '#fff', padding: '0 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f0f0f0' }}>
          <Space>
            {React.createElement(collapsed ? MenuUnfoldOutlined : MenuFoldOutlined, {
              className: 'trigger',
              onClick: () => setCollapsed(!collapsed),
              style: { fontSize: 18, cursor: 'pointer' }
            })}
            <Breadcrumb items={[{ title: 'Hệ thống' }, { title: 'Chuyên khoa Mắt' }, { title: 'Xử lý ảnh' }]} />
          </Space>
          <Space>
             <Tag color="cyan">Ver 2.0</Tag>
             <Avatar style={{ backgroundColor: '#1890ff' }} icon={<UserOutlined />} />
             <Text strong>BS. Trưởng Ca</Text>
          </Space>
        </Header>

        {/* 3. CONTENT CHÍNH */}
        <Content style={{ margin: '16px', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          
          {/* Thông tin bệnh nhân */}
          <Card size="small" style={{ marginBottom: 12, borderLeft: '4px solid #1890ff' }}>
             <Descriptions size="small" column={4}>
                <Descriptions.Item label="Họ tên"><b>{patient.name}</b></Descriptions.Item>
                <Descriptions.Item label="Mã BN"><Tag>{patient.id}</Tag></Descriptions.Item>
                <Descriptions.Item label="Tuổi">{patient.age}</Descriptions.Item>
                <Descriptions.Item label="Tiền sử">{patient.history}</Descriptions.Item>
             </Descriptions>
          </Card>

          {/* Khu vực làm việc chia 2 cột */}
          <div style={{ flex: 1, display: 'flex', gap: '16px', overflow: 'hidden' }}>
             
             {/* CỘT ẢNH (Image Viewer) */}
             <div style={{ flex: 3, display: 'flex', flexDirection: 'column', background: '#262626', borderRadius: 8, overflow: 'hidden' }}>
                {/* Toolbar */}
                <div style={{ padding: '8px 16px', background: '#141414', display: 'flex', justifyContent: 'space-between' }}>
                   <Space>
                      <Text style={{ color: '#fff' }}>Lớp phủ AI:</Text>
                      <Switch checked={showHeatmap} onChange={setShowHeatmap} size="small" />
                   </Space>
                   <Space>
                      <Button type="text" icon={<ZoomInOutlined style={{ color: '#fff' }} />} onClick={() => handleZoom('in')} />
                      <Button type="text" icon={<ZoomOutOutlined style={{ color: '#fff' }} />} onClick={() => handleZoom('out')} />
                      <Button type="text" icon={<UngroupOutlined style={{ color: '#fff' }} />} onClick={() => setZoomLevel(1)} />
                   </Space>
                </div>

                {/* Vùng hiển thị ảnh */}
                <div style={{ flex: 1, position: 'relative', overflow: 'hidden', display: 'flex', justifyContent: 'center', alignItems: 'center', background: '#000' }}>
                   {!imgError ? (
                     <div style={{ transform: `scale(${zoomLevel})`, transition: 'transform 0.3s', position: 'relative', width: '100%', height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                        <img src={originalImageUrl} onError={() => setImgError(true)} style={{ maxHeight: '95%', maxWidth: '95%', objectFit: 'contain', position: 'absolute' }} />
                        {showHeatmap && <img src={aiResult.heatmapUrl} style={{ maxHeight: '95%', maxWidth: '95%', objectFit: 'contain', position: 'absolute', opacity: 0.6, mixBlendMode: 'screen' }} />}
                     </div>
                   ) : <Empty description={<span style={{color: '#fff'}}>Không tải được ảnh</span>} />}
                </div>
             </div>

             {/* CỘT FORM (Clinical Decision) */}
             <div style={{ flex: 2, background: '#fff', borderRadius: 8, padding: '16px', border: '1px solid #f0f0f0', display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
                <Title level={5}><MedicineBoxOutlined /> Kết luận lâm sàng</Title>
                
                {/* Cảnh báo AI */}
                {aiResult.riskScore > 0.7 && (
                   <div style={{ padding: 12, background: '#fff2f0', border: '1px solid #ffccc7', borderRadius: 4, marginBottom: 16 }}>
                      <WarningOutlined style={{ color: 'red' }} /> <b>AI Cảnh báo: Nguy cơ CAO</b>
                   </div>
                )}

                <div style={{ marginBottom: 20 }}>
                   <Text strong>Đánh giá rủi ro:</Text>
                   <Radio.Group value={finalRisk} onChange={e => setFinalRisk(e.target.value)} buttonStyle="solid" style={{ width: '100%', marginTop: 8 }}>
                      <Radio.Button value="Low" style={{ width: '33%', textAlign: 'center' }}>Thấp</Radio.Button>
                      <Radio.Button value="Medium" style={{ width: '33%', textAlign: 'center' }}>TB</Radio.Button>
                      <Radio.Button value="High" style={{ width: '33%', textAlign: 'center' }}>Cao</Radio.Button>
                   </Radio.Group>
                </div>

                <div style={{ flex: 1 }}>
                   <Text strong>Ghi chú chuyên môn:</Text>
                   <Input.TextArea rows={6} placeholder="Nhập ghi chú..." style={{ marginTop: 8 }} />
                </div>

                <Button type="primary" size="large" icon={<SaveOutlined />} block onClick={handleVerify} loading={loading} style={{ marginTop: 16 }}>
                   Lưu hồ sơ
                </Button>
             </div>
          </div>

        </Content>
      </Layout>
    </Layout>
  );
};

export default DiagnosisViewer;