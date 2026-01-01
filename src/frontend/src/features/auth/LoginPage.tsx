import React, { useState } from 'react';
import { Form, Input, Button, Checkbox, message, Typography } from 'antd';
import { UserOutlined, LockOutlined, EyeInvisibleOutlined, EyeTwoTone } from '@ant-design/icons';
import { Link, useNavigate } from 'react-router-dom'; // <--- MỚI THÊM: Link và useNavigate
import { useAuth } from '../../contexts/AuthContext';
import authApi from '../../api/authApi'; // <--- MỚI THÊM: Import API
import './LoginPage.css';

const { Text } = Typography;

const LoginPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const { login } = useAuth(); 
  // const navigate = useNavigate(); // Nếu cần redirect thủ công, nhưng useAuth thường đã xử lý rồi

  const onFinish = async (values: any) => {
    setLoading(true);
    try {
      // --- GỌI API BACKEND THẬT ---
      // Lưu ý: Backend API Login của bạn đang trả về: { message, userId, fullName, role }
      const response = await authApi.login({
        email: values.username, // Mapping: Form 'username' -> API 'email'
        password: values.password
      });

      message.success('Đăng nhập thành công!');

      // --- CẬP NHẬT TRẠNG THÁI LOGIN ---
      // Vì tuần 3 chưa có JWT Token thật, ta dùng tạm một chuỗi placeholder
      // Sang tuần 4 sẽ thay bằng response.token
      login({
        userId: response.userId,
        username: values.username,
        fullName: response.fullName,
        role: response.role as 'bacsi' | 'kythuat' | 'User', // Cast kiểu dữ liệu cho khớp
      }, 'temp-token-week-3');

    } catch (error: any) {
      // Xử lý lỗi từ Backend trả về (ví dụ: Sai mật khẩu)
      console.error(error);
      message.error('Đăng nhập thất bại! Vui lòng kiểm tra Email/Mật khẩu.');
    } finally {
      setLoading(false);
    }
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
            {/* Sửa label thành Email để người dùng đỡ nhầm lẫn */}
            <Form.Item 
              name="username" 
              rules={[
                { required: true, message: 'Vui lòng nhập Email!' },
                { type: 'email', message: 'Email không đúng định dạng!' }
              ]}
            >
              <Input prefix={<UserOutlined />} placeholder="Email đăng nhập" />
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
              
              {/* --- MỚI THÊM: LIÊN KẾT ĐẾN TRANG ĐĂNG KÝ --- */}
              <div style={{ marginTop: 16, textAlign: 'center' }}>
                 Bạn chưa có tài khoản? <Link to="/register">Đăng ký ngay</Link>
              </div>
            </Form.Item>
          </Form>

          <div className="demo-credentials">
            <Text type="secondary" style={{ fontSize: '12px' }}>
              * Lưu ý: Hệ thống đã kết nối Database. Vui lòng dùng tài khoản bạn vừa Đăng Ký để đăng nhập.
            </Text>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;