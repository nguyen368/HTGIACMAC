import React, { useState } from 'react';
import { Layout, Menu, Button, theme, Avatar, Dropdown, Space, Badge } from 'antd';
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

  // Menu items cho User Dropdown
  const userMenu = [
    { key: '1', label: 'Hồ sơ cá nhân', icon: <UserOutlined /> },
    { key: '2', label: 'Cài đặt hệ thống', icon: <SettingOutlined /> },
    { type: 'divider' },
    { key: '3', label: 'Đăng xuất', icon: <LogoutOutlined />, danger: true },
  ];

  return (
    <Layout style={{ minHeight: '100vh' }}>
      {/* Sidebar bên trái */}
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
        {/* Logo Area */}
        <div style={{ 
          height: 64, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          background: '#002140',
          overflow: 'hidden'
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
      
      {/* Layout nội dung chính */}
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
            {/* Notifications */}
            <Badge count={3} size="small">
              <Button type="text" icon={<BellOutlined style={{ fontSize: 20 }} />} shape="circle" />
            </Badge>

            {/* User Profile */}
            <Dropdown menu={{ items: userMenu as any }} placement="bottomRight" arrow>
              <Space style={{ cursor: 'pointer', padding: '4px 8px', borderRadius: '4px', transition: 'background 0.3s' }} className="user-dropdown">
                <Avatar style={{ backgroundColor: '#0050b3' }} icon={<UserOutlined />} />
                <div style={{ lineHeight: '1.2', textAlign: 'right', display: collapsed ? 'none' : 'block' }}>
                  <div style={{ fontWeight: 600, fontSize: '14px' }}>BS. Trần Minh</div>
                  <div style={{ fontSize: '11px', color: '#888' }}>Khoa Nhãn Khoa</div>
                </div>
              </Space>
            </Dropdown>
          </div>
        </Header>
        
        <Content style={{ margin: '0', background: '#f0f2f5', minHeight: 280 }}>
          {/* Outlet là nơi render các route con (Upload, Result...) */}
          <Outlet />
        </Content>

        <Footer style={{ textAlign: 'center', color: '#888' }}>
          Med Vision AI ©{new Date().getFullYear()} Created by HTGM Team. 
          <br/>Hệ thống hỗ trợ chẩn đoán bệnh lý giác mạc.
        </Footer>
      </Layout>
    </Layout>
  );
};

export default MainLayout;