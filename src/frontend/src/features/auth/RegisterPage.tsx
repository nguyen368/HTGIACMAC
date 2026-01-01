import React, { useState } from 'react';
import { Form, Input, Button, message, Typography } from 'antd';
import { UserOutlined, LockOutlined, MailOutlined } from '@ant-design/icons';
import { Link, useNavigate } from 'react-router-dom';
import authApi from '../../api/authApi'; // Import API vừa sửa
import './LoginPage.css'; // Tận dụng lại CSS của trang Login

const { Title, Text } = Typography;

const RegisterPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const onFinish = async (values: any) => {
    setLoading(true);
    try {
      // Gọi API Backend thật
      await authApi.register({
        fullName: values.fullName,
        email: values.email,
        password: values.password
      });

      message.success('Đăng ký thành công! Vui lòng đăng nhập.');
      navigate('/login'); // Chuyển hướng về trang đăng nhập
    } catch (error: any) {
      // Hiển thị lỗi từ Backend trả về (ví dụ: Email đã tồn tại)
      const errorMsg = error.response?.data || 'Đăng ký thất bại';
      message.error(typeof errorMsg === 'string' ? errorMsg : 'Có lỗi xảy ra');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-form-container">
        <div className="login-card">
          <Title level={2} style={{ textAlign: 'center', marginBottom: 20 }}>Đăng Ký</Title>
          <Form
            name="register_form"
            onFinish={onFinish}
            layout="vertical"
            size="large"
          >
            <Form.Item
              name="fullName"
              rules={[{ required: true, message: 'Vui lòng nhập họ tên!' }]}
            >
              <Input prefix={<UserOutlined />} placeholder="Họ và tên" />
            </Form.Item>

            <Form.Item
              name="email"
              rules={[
                { required: true, message: 'Vui lòng nhập Email!' },
                { type: 'email', message: 'Email không hợp lệ!' }
              ]}
            >
              <Input prefix={<MailOutlined />} placeholder="Email" />
            </Form.Item>

            <Form.Item
              name="password"
              rules={[{ required: true, message: 'Vui lòng nhập mật khẩu!' }]}
            >
              <Input.Password prefix={<LockOutlined />} placeholder="Mật khẩu" />
            </Form.Item>

            <Form.Item
              name="confirm"
              dependencies={['password']}
              rules={[
                { required: true, message: 'Vui lòng xác nhận mật khẩu!' },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value || getFieldValue('password') === value) {
                      return Promise.resolve();
                    }
                    return Promise.reject(new Error('Hai mật khẩu không khớp!'));
                  },
                }),
              ]}
            >
              <Input.Password prefix={<LockOutlined />} placeholder="Nhập lại mật khẩu" />
            </Form.Item>

            <Form.Item>
              <Button type="primary" htmlType="submit" block loading={loading}>
                ĐĂNG KÝ NGAY
              </Button>
            </Form.Item>

            <div style={{ textAlign: 'center' }}>
              <Text>Đã có tài khoản? </Text>
              <Link to="/login">Đăng nhập tại đây</Link>
            </div>
          </Form>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;