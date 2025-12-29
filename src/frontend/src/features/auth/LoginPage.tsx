// src/features/auth/LoginPage.tsx
import React, { useState } from 'react';
import { Form, Input, Button, Checkbox, message, Typography } from 'antd';
import { UserOutlined, LockOutlined, EyeInvisibleOutlined, EyeTwoTone } from '@ant-design/icons';
import { useAuth } from '../../contexts/AuthContext'; // Import Hook Auth
import './LoginPage.css';

const { Text } = Typography;

const LoginPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const { login } = useAuth(); // Lấy hàm login

  const onFinish = (values: any) => {
    setLoading(true);
    // Giả lập API call
    setTimeout(() => {
      const { username, password } = values;
      
      if ((username === 'bacsi' || username === 'kythuat') && password === '123456') {
        message.success('Đăng nhập thành công!');
        
        // Gọi hàm login để lưu trạng thái
        login({
          username,
          role: username as 'bacsi' | 'kythuat',
          fullName: username === 'bacsi' ? 'Bác sĩ Nguyễn Văn A' : 'Kỹ thuật viên Trần Thị B'
        }, 'fake-jwt-token-123456');
        
      } else {
        message.error('Tên đăng nhập hoặc mật khẩu không đúng!');
      }
      setLoading(false);
    }, 1000);
  };

  return (
    <div className="login-page">
      <div className="login-branding">
        <div className="branding-content">
          <h1 className="branding-title"><i className="fas fa-eye"></i> Hệ thống Sàng lọc Võng mạc</h1>
          <p className="branding-desc">Hệ thống ứng dụng AI chẩn đoán bệnh lý mắt.</p>
        </div>
      </div>

      <div className="login-form-container">
        <div className="login-card">
          <h2 className="form-title">Đăng nhập</h2>
          <Form
            name="login_form"
            initialValues={{ remember: true }}
            onFinish={onFinish}
            layout="vertical"
            size="large"
          >
            <Form.Item name="username" rules={[{ required: true, message: 'Nhập tên đăng nhập!' }]}>
              <Input prefix={<UserOutlined />} placeholder="Tên đăng nhập" />
            </Form.Item>

            <Form.Item name="password" rules={[{ required: true, message: 'Nhập mật khẩu!' }]}>
              <Input.Password
                prefix={<LockOutlined />}
                placeholder="Mật khẩu"
                iconRender={(visible) => (visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />)}
              />
            </Form.Item>

            <Form.Item>
              <Form.Item name="remember" valuePropName="checked" noStyle>
                <Checkbox>Ghi nhớ</Checkbox>
              </Form.Item>
            </Form.Item>

            <Form.Item>
              <Button type="primary" htmlType="submit" className="login-form-button" block loading={loading}>
                ĐĂNG NHẬP
              </Button>
            </Form.Item>
          </Form>

          <div className="demo-credentials">
            <Text strong>Thông tin demo:</Text>
            <p>Tài khoản: <b>bacsi</b> | Mật khẩu: <b>123456</b></p>
            <p>Tài khoản: <b>kythuat</b> | Mật khẩu: <b>123456</b></p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;