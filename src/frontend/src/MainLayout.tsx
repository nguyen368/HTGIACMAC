import React, { useState, useEffect } from 'react';
import { Layout, Menu, Button, theme, Avatar, Dropdown, Space, Badge, message } from 'antd';
import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  UploadOutlined,
  UserOutlined,
  DashboardOutlined,
  FileTextOutlined,
  BellOutlined,
  SettingOutlined,
  LogoutOutlined
} from '@ant-design/icons';
import { useNavigate, Outlet, useLocation } from 'react-router-dom';

const { Header, Sider, Content, Footer } = Layout;

const MainLayout: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation(); 
  
  const {
    token: { colorBgContainer },
  } = theme.useToken();

  // --- QUẢN LÝ THÔNG TIN USER TRÊN HEADER ---
  const [userInfo, setUserInfo] = useState({
    fullName: 'Đang tải...',
    role: '',
    avatar: ''
  });

  const loadUserData = () => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUserInfo({
            fullName: parsedUser.fullName || 'Người dùng',
            role: parsedUser.role || 'Thành viên',
            avatar: parsedUser.avatar || ''
        });
      } catch (error) {
        console.error("Lỗi đọc user data");
      }
    } else {
        setUserInfo({ fullName: 'Khách', role: 'Chưa đăng nhập', avatar: '' });
    }
  };

  useEffect(() => {
    loadUserData();
  }, [location]); 
  // ----------------------------------------------------

  const handleUserMenuClick = ({ key }: { key: string }) => {
    if (key === 'logout') {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('user'); 
      message.success('Đã đăng xuất thành công');
      navigate('/login');
    } else if (key === 'profile') {
      navigate('/profile'); 
    } else if (key === 'settings') {
      message.info('Tính năng Cài đặt đang phát triển');
    }
  };

  const userMenuItems = [
    { key: 'profile', label: 'Hồ sơ cá nhân', icon: <UserOutlined /> },
    { key: 'settings', label: 'Cài đặt hệ thống', icon: <SettingOutlined /> },
    { type: 'divider' },
    { key: 'logout', label: 'Đăng xuất', icon: <LogoutOutlined />, danger: true },
  ];

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider 
        trigger={null} 
        collapsible 
        collapsed={collapsed}
        width={250}
        style={{ 
            background: '#001529',
            boxShadow: '2px 0 8px rgba(0,0,0,0.15)',
            zIndex: 10
        }}
      >
        <div style={{ 
          height: 64, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          background: '#002140',
          overflow: 'hidden',
          transition: 'all 0.2s'
        }}>
            {collapsed ? (
              <div style={{ color: 'white', fontWeight: 'bold', fontSize: '20px' }}>H+</div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                 <div style={{ width: 32, height: 32, background: '#1890ff', borderRadius: 6, display: 'flex', alignItems:'center', justifyContent:'center', color:'white', fontWeight:'bold' }}>H+</div>
                 <span style={{ color: 'white', fontWeight: 'bold', fontSize: '18px', whiteSpace: 'nowrap' }}>MED VISION AI</span>
              </div>
            )}
        </div>

        <Menu
          theme="dark"
          mode="inline"
          defaultSelectedKeys={[location.pathname]}
          onClick={({ key }) => navigate(key)}
          style={{ padding: '16px 0', fontSize: '15px' }}
          items={[
            {
              key: '/',
              icon: <DashboardOutlined />,
              label: 'Tổng quan (Dashboard)',
            },
            {
              key: '/upload',
              icon: <UploadOutlined />,
              label: 'Chẩn đoán hình ảnh',
            },
            {
              key: '/history',
              icon: <FileTextOutlined />,
              label: 'Lịch sử bệnh án',
            },
            // --- ĐÃ XÓA MỤC HỒ SƠ Ở ĐÂY ---
            {
              type: 'divider', 
            },
            {
              key: '/settings',
              icon: <SettingOutlined />,
              label: 'Cấu hình hệ thống',
            },
          ]}
        />
      </Sider>
      
      <Layout>
        <Header style={{ 
          padding: '0 24px', 
          background: colorBgContainer, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          boxShadow: '0 2px 8px #f0f1f2',
          position: 'sticky',
          top: 0,
          zIndex: 9
        }}>
          <Button
            type="text"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => setCollapsed(!collapsed)}
            style={{ fontSize: '16px', width: 64, height: 64 }}
          />

          <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
            <Badge count={3} size="small">
              <Button type="text" icon={<BellOutlined style={{ fontSize: 20 }} />} shape="circle" />
            </Badge>

            <Dropdown 
              menu={{ 
                items: userMenuItems as any, 
                onClick: handleUserMenuClick 
              }} 
              placement="bottomRight" 
              arrow
            >
              <Space style={{ cursor: 'pointer', padding: '4px 8px', borderRadius: '4px', transition: 'background 0.3s' }} className="user-dropdown">
                {/* Avatar hiển thị từ localStorage */}
                <Avatar 
                    style={{ backgroundColor: '#1890ff' }} 
                    icon={<UserOutlined />} 
                    src={userInfo.avatar} 
                />
                
                {/* Tên hiển thị từ localStorage */}
                <div style={{ lineHeight: '1.2', textAlign: 'right', display: collapsed ? 'none' : 'block' }}>
                  <div style={{ fontWeight: 600, fontSize: '14px', color: '#002766' }}>
                      {userInfo.fullName}
                  </div>
                  <div style={{ fontSize: '11px', color: '#1890ff' }}>
                      {userInfo.role}
                  </div>
                </div>
              </Space>
            </Dropdown>
          </div>
        </Header>
        
        <Content style={{ margin: '0', background: '#f0f2f5', minHeight: 280 }}>
          <Outlet />
        </Content>

        <Footer style={{ textAlign: 'center', color: '#888' }}>
          Med Vision AI ©{new Date().getFullYear()} Created by HTGM Team. 
        </Footer>
      </Layout>
    </Layout>
  );
};

export default MainLayout;