import React, { useEffect, useState } from 'react';
import { 
  Card, Avatar, Button, Form, Input, message, Upload, Spin, Row, Col, 
  Descriptions, Tag, Divider, Badge 
} from 'antd';
import { 
  UserOutlined, SaveOutlined, EditOutlined, 
  MailOutlined, PhoneOutlined, HomeOutlined, SafetyCertificateOutlined, 
  GlobalOutlined, BankOutlined, CheckCircleFilled, CameraFilled,
  MedicineBoxOutlined
} from '@ant-design/icons';
import type { RcFile } from 'antd/es/upload/interface';

// --- UTILS ---
const getBase64 = (file: RcFile): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });

// --- STYLES (CSS-in-JS) ---
const styles = {
  container: {
    minHeight: '100vh',
    backgroundColor: '#f0f2f5',
    padding: '30px 20px',
  },
  wrapper: {
    maxWidth: '1200px',
    margin: '0 auto',
  },
  // Card bên trái
  leftCard: {
    borderRadius: '16px',
    border: 'none',
    boxShadow: '0 10px 30px rgba(0,0,0,0.05)',
    textAlign: 'center' as const,
    overflow: 'hidden',
    height: '100%',
  },
  cardHeaderBg: {
    height: '120px',
    background: 'linear-gradient(135deg, #1890ff 0%, #0050b3 100%)',
    marginBottom: '-60px',
  },
  // Card bên phải
  rightCard: {
    borderRadius: '16px',
    border: 'none',
    boxShadow: '0 10px 30px rgba(0,0,0,0.05)',
    minHeight: '600px',
  },
  avatarContainer: {
    position: 'relative' as const,
    display: 'inline-block',
    marginBottom: '15px',
    zIndex: 1,
  },
  avatar: {
    border: '5px solid #fff',
    backgroundColor: '#e6f7ff',
    color: '#1890ff',
    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
  },
  uploadBtn: {
    position: 'absolute' as const,
    bottom: '5px',
    right: '5px',
    backgroundColor: '#1890ff',
    color: '#fff',
    border: '2px solid #fff',
    boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
  },
  nameText: {
    color: '#002766',
    fontWeight: 700,
    fontSize: '22px',
    marginBottom: '5px',
  },
  roleTag: {
    padding: '4px 12px',
    borderRadius: '12px',
    fontSize: '13px',
    marginBottom: '20px',
    display: 'inline-block',
  },
  contactRow: {
    display: 'flex',
    alignItems: 'center',
    marginBottom: '15px',
    color: '#595959',
    textAlign: 'left' as const,
    background: '#f9f9f9',
    padding: '10px',
    borderRadius: '8px',
  },
  iconBox: {
    minWidth: '36px',
    height: '36px',
    borderRadius: '50%',
    background: '#e6f7ff',
    color: '#1890ff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: '12px',
    fontSize: '16px',
  },
  sectionTitle: {
    fontSize: '18px',
    fontWeight: 600,
    color: '#003a8c',
    marginBottom: '20px',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  }
};

const ProfilePage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [form] = Form.useForm();

  // Dữ liệu mặc định
  const defaultUser = {
    fullName: 'Tấn Sang daden',
    email: 'sangdaden@medvision.vn',
    phone: '0909.123.456',
    address: 'TP. Hồ Chí Minh, Việt Nam',
    role: 'Chuyên khoa siêu âm',
    department: 'Khoa Nhãn Khoa',
    bio: 'Chuyên gia chẩn đoán hình ảnh với hơn 10 năm kinh nghiệm trong ngành y tế.',
    avatar: '',
    status: 'Active'
  };

  const [user, setUser] = useState<any>(defaultUser);

  // 1. Load dữ liệu
  useEffect(() => {
    setTimeout(() => {
      const storedUserString = localStorage.getItem('user');
      if (storedUserString) {
        try {
          const savedUser = JSON.parse(storedUserString);
          setUser({ ...defaultUser, ...savedUser });
        } catch {
          setUser(defaultUser);
        }
      }
      setLoading(false);
    }, 400);
  }, []);

  // 2. Xử lý Lưu Form
  const onFinish = (values: any) => {
    const newUser = { ...user, ...values };
    setUser(newUser);
    localStorage.setItem('user', JSON.stringify(newUser));
    message.success('Cập nhật hồ sơ thành công!');
    setIsEditing(false); 
  };

  // 3. Xử lý đổi Avatar
  const handleUpload = async (info: any) => {
    const file = info.file;
    if (!file) return;
    try {
      const base64Url = await getBase64(file as RcFile);
      const newUser = { ...user, avatar: base64Url };
      setUser(newUser);
      localStorage.setItem('user', JSON.stringify(newUser));
      message.success('Đã đổi ảnh đại diện!');
    } catch (e) {
      message.error('Lỗi tải ảnh');
    }
    return false;
  };

  if (loading) return <div style={{ height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}><Spin size="large" /></div>;

  return (
    <div style={styles.container}>
      <div style={styles.wrapper}>
        
        <Row gutter={[24, 24]}>
          
          {/* --- CỘT TRÁI --- */}
          <Col xs={24} md={8} lg={7}>
            <Card style={styles.leftCard} bodyStyle={{ padding: 0 }}>
              <div style={styles.cardHeaderBg}></div>
              
              <div style={{ padding: '0 20px 30px' }}>
                <div style={styles.avatarContainer}>
                   <Avatar 
                      size={130} 
                      src={user.avatar} 
                      icon={<UserOutlined />} 
                      style={styles.avatar} 
                   />
                   <Upload showUploadList={false} beforeUpload={(file) => { handleUpload({file}); return false; }}>
                      <Button 
                         shape="circle" 
                         icon={<CameraFilled />} 
                         style={styles.uploadBtn} 
                      />
                   </Upload>
                </div>

                <div style={styles.nameText}>
                  {user.fullName}
                  <CheckCircleFilled style={{ color: '#52c41a', fontSize: '18px', marginLeft: '8px' }} />
                </div>
                <Tag color="blue" style={styles.roleTag}>{user.role}</Tag>
                
                <div style={{ marginBottom: 20 }}>
                   <Badge status="processing" text="Đang hoạt động" color="green" />
                </div>

                <Divider style={{ margin: '15px 0' }} />

                <div style={styles.contactRow}>
                   <div style={styles.iconBox}><MailOutlined /></div>
                   <div style={{ overflow: 'hidden' }}>
                      <div style={{ fontSize: '11px', color: '#8c8c8c' }}>Email</div>
                      <div style={{ fontWeight: 500, fontSize: '13px', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden', maxWidth: '180px' }}>
                        {user.email}
                      </div>
                   </div>
                </div>

                <div style={styles.contactRow}>
                   <div style={styles.iconBox}><PhoneOutlined /></div>
                   <div>
                      <div style={{ fontSize: '11px', color: '#8c8c8c' }}>Điện thoại</div>
                      <div style={{ fontWeight: 500, fontSize: '13px' }}>{user.phone}</div>
                   </div>
                </div>

                <div style={styles.contactRow}>
                   <div style={styles.iconBox}><HomeOutlined /></div>
                   <div>
                      <div style={{ fontSize: '11px', color: '#8c8c8c' }}>Địa chỉ</div>
                      <div style={{ fontWeight: 500, fontSize: '13px' }}>{user.address}</div>
                   </div>
                </div>
              </div>
            </Card>
          </Col>

          {/* --- CỘT PHẢI --- */}
          <Col xs={24} md={16} lg={17}>
            <Card style={styles.rightCard} bodyStyle={{ padding: '30px' }}>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 30, borderBottom: '1px solid #f0f0f0', paddingBottom: 15 }}>
                <div style={styles.sectionTitle}>
                   <MedicineBoxOutlined style={{ fontSize: '24px' }} /> 
                   Hồ Sơ Chi Tiết
                </div>
                {!isEditing ? (
                   <Button type="primary" icon={<EditOutlined />} onClick={() => { setIsEditing(true); form.setFieldsValue(user); }}>
                      Chỉnh sửa
                   </Button>
                ) : (
                   <Button onClick={() => setIsEditing(false)}>Hủy bỏ</Button>
                )}
              </div>

              {isEditing ? (
                // FORM CHỈNH SỬA
                <Form form={form} layout="vertical" onFinish={onFinish} initialValues={user}>
                  <Row gutter={24}>
                     <Col span={24}><Tag color="cyan" style={{ marginBottom: 15, padding: '5px 10px', width: '100%', fontSize: '14px' }}>THÔNG TIN HÀNH CHÍNH</Tag></Col>
                     
                     <Col xs={24} md={12}>
                        <Form.Item label="Họ và Tên" name="fullName" rules={[{ required: true }]}>
                           <Input size="large" prefix={<UserOutlined />} />
                        </Form.Item>
                     </Col>
                     <Col xs={24} md={12}>
                        <Form.Item label="Số điện thoại" name="phone">
                           <Input size="large" prefix={<PhoneOutlined />} />
                        </Form.Item>
                     </Col>
                     <Col xs={24} md={12}>
                        <Form.Item label="Email" name="email">
                           <Input size="large" prefix={<MailOutlined />} />
                        </Form.Item>
                     </Col>
                     <Col xs={24} md={12}>
                        <Form.Item label="Địa chỉ" name="address">
                           <Input size="large" prefix={<HomeOutlined />} />
                        </Form.Item>
                     </Col>

                     <Col span={24}><Tag color="blue" style={{ margin: '15px 0', padding: '5px 10px', width: '100%', fontSize: '14px' }}>CHUYÊN MÔN</Tag></Col>
                     
                     <Col xs={24} md={12}>
                        <Form.Item label="Chức vụ / Chuyên khoa" name="role">
                           <Input size="large" prefix={<SafetyCertificateOutlined />} />
                        </Form.Item>
                     </Col>
                     <Col xs={24} md={12}>
                        <Form.Item label="Đơn vị công tác" name="department">
                           <Input size="large" prefix={<BankOutlined />} />
                        </Form.Item>
                     </Col>
                     <Col span={24}>
                        <Form.Item label="Giới thiệu kinh nghiệm" name="bio">
                           <Input.TextArea rows={4} showCount maxLength={500} />
                        </Form.Item>
                     </Col>
                     
                     <Col span={24} style={{ textAlign: 'right', marginTop: 10 }}>
                        <Button type="primary" htmlType="submit" icon={<SaveOutlined />} size="large" style={{ width: '180px' }}>
                           LƯU LẠI
                        </Button>
                     </Col>
                  </Row>
                </Form>
              ) : (
                // CHẾ ĐỘ XEM
                <div style={{ padding: '0 10px' }}>
                   <Descriptions bordered column={1} labelStyle={{ width: '180px', fontWeight: 'bold', background: '#fafafa' }} size="middle">
                      <Descriptions.Item label="Họ và Tên">
                         <span style={{ fontSize: '16px', fontWeight: 600, color: '#002766' }}>{user.fullName}</span>
                      </Descriptions.Item>
                      <Descriptions.Item label="Chức vụ">
                         <span style={{ color: '#1890ff', fontWeight: 500 }}>{user.role}</span>
                      </Descriptions.Item>
                      <Descriptions.Item label="Đơn vị công tác">
                         {user.department}
                      </Descriptions.Item>
                      <Descriptions.Item label="Email liên hệ">
                         {user.email}
                      </Descriptions.Item>
                      <Descriptions.Item label="Số điện thoại">
                         {user.phone}
                      </Descriptions.Item>
                      <Descriptions.Item label="Địa chỉ">
                         <span style={{ display: 'flex', alignItems: 'center' }}>
                            <GlobalOutlined style={{ marginRight: 6, color: '#fa8c16' }} /> {user.address}
                         </span>
                      </Descriptions.Item>
                      <Descriptions.Item label="Giới thiệu">
                         <div style={{ background: '#f6ffed', padding: '10px', border: '1px dashed #b7eb8f', borderRadius: '6px', color: '#389e0d' }}>
                           {user.bio}
                         </div>
                      </Descriptions.Item>
                   </Descriptions>
                </div>
              )}
            </Card>
          </Col>

        </Row>
      </div>
    </div>
  );
};

export default ProfilePage;