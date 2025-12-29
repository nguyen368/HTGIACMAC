import React, { useState } from 'react';
import { Form, Input, Button, Checkbox, message, Row, Col, Typography } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

const { Title, Text } = Typography;

const LoginPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const onFinish = async (values: any) => {
    setLoading(true);
    // Xóa token cũ để đảm bảo sạch sẽ
    localStorage.removeItem('accessToken');

    try {
      // --- GIẢ LẬP API ĐĂNG NHẬP ---
      // Sau này bạn thay bằng axios.post tới API thật của bạn
      await new Promise((resolve, reject) => {
        setTimeout(() => {
          if (values.username === 'kythuat' && values.password === '123456') {
             resolve(true);
          } else {
             reject(new Error('Sai thông tin'));
          }
        }, 1000);
      });

      // Nếu chạy đến đây là thành công
      message.success('Đăng nhập thành công!');
      localStorage.setItem('accessToken', 'demo-token-123456'); // Lưu token
      navigate('/'); // Chuyển về trang chủ (Dashboard)
      
    } catch (error) {
      message.error('Sai tên tài khoản hoặc mật khẩu!');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ height: '100vh', overflow: 'hidden' }}>
      <Row style={{ height: '100%' }}>
        <Col span={12} style={{ background: '#002140', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', color: 'white' }}>
          <Title level={1} style={{ color: 'white', marginBottom: 0 }}>H+ MED VISION AI</Title>
          <Text style={{ color: 'rgba(255, 255, 255, 0.8)', marginTop: 20, fontSize: 16 }}>
            Hệ thống ứng dụng AI chẩn đoán bệnh lý mắt
          </Text>
        </Col>

        <Col span={12} style={{ background: '#141414', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <div style={{ width: 400, padding: 24 }}>
            <div style={{ textAlign: 'center', marginBottom: 40 }}>
              <Title level={2} style={{ color: 'white' }}>Đăng nhập</Title>
            </div>

            <Form
              name="login"
              initialValues={{ remember: true, username: 'kythuat', password: '123456' }}
              onFinish={onFinish}
              size="large"
            >
              <Form.Item name="username" rules={[{ required: true, message: 'Nhập tài khoản!' }]}>
                <Input prefix={<UserOutlined />} placeholder="Tài khoản" />
              </Form.Item>

              <Form.Item name="password" rules={[{ required: true, message: 'Nhập mật khẩu!' }]}>
                <Input.Password prefix={<LockOutlined />} placeholder="Mật khẩu" />
              </Form.Item>

              <Form.Item>
                <Button type="primary" htmlType="submit" loading={loading} block>ĐĂNG NHẬP</Button>
              </Form.Item>
            </Form>
          </div>
        </Col>
      </Row>
    </div>
  );
};

export default LoginPage;