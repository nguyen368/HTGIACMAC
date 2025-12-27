// File: src/frontend/src/layouts/MainLayout.tsx
import React, { useState } from 'react';
import { 
  Layout, 
  Menu, 
  Avatar, 
  Dropdown, 
  Space, 
  Breadcrumb, 
  Button, 
  theme,
  Badge // SỬA LỖI 1: Đã thêm Badge vào import
} from 'antd';
import type { MenuProps } from 'antd'; // SỬA LỖI 2: Import kiểu dữ liệu cho Menu
import { 
  CloudUploadOutlined,    
  MedicineBoxOutlined,    
  TeamOutlined,           
  BarChartOutlined,       
  SettingOutlined,        
  LogoutOutlined,
  UserOutlined,
  MenuUnfoldOutlined,
  MenuFoldOutlined,
  BellOutlined            
} from '@ant-design/icons';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';

const { Header, Sider, Content } = Layout;

const MainLayout: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();

  // SỬA LỖI 3: Thêm type ": MenuProps['items']" để hết báo đỏ dòng items={menuItems}
  const menuItems: MenuProps['items'] = [
    {
      key: 'grp-clinical',
      label: 'Nghiệp vụ Lâm sàng',
      type: 'group',
      children: [
        {
          key: '/upload',
          icon: <CloudUploadOutlined />,
          label: 'Sàng lọc (Upload)', 
        },
        {
          key: '/diagnosis',
          icon: <MedicineBoxOutlined />,
          label: 'Kết quả Chẩn đoán', 
        },
      ]
    },
    {
      key: 'grp-management',
      label: 'Quản lý',
      type: 'group',
      children: [
        {
          key: '/patients',
          icon: <TeamOutlined />,
          label: 'Hồ sơ Bệnh nhân', 
        },
        {
          key: '/reports',
          icon: <BarChartOutlined />,
          label: 'Báo cáo Thống kê', 
        },
      ]
    },
  ];

  const userMenu: MenuProps = {
    items: [
      { key: 'profile', label: 'Hồ sơ cá nhân', icon: <UserOutlined /> },
      { key: 'settings', label: 'Cài đặt hệ thống', icon: <SettingOutlined /> },
      { type: 'divider' },
      { key: 'logout', label: 'Đăng xuất', icon: <LogoutOutlined />, danger: true },
    ],
  };

  return (
    <Layout style={{ height: '100vh', overflow: 'hidden' }}>
      
      {/* SIDEBAR */}
      <Sider 
        trigger={null} 
        collapsible 
        collapsed={collapsed} 
        width={260}
        style={{ 
          background: '#001529',
          overflowY: 'auto',
          height: '100vh',
          position: 'fixed',
          left: 0,
          top: 0,
          bottom: 0,
          zIndex: 1000
        }}
      >
        <div style={{ height: '64px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#002140' }}>
             <div style={{ color: 'white', fontWeight: 'bold', fontSize: collapsed ? '14px' : '20px', transition: 'all 0.2s' }}>
                {collapsed ? 'AURA' : 'AURA SYSTEM'}
             </div>
        </div>
        <Menu
          theme="dark"
          mode="inline"
          defaultSelectedKeys={['/upload']}
          selectedKeys={[location.pathname]}
          onClick={({ key }) => navigate(key)}
          items={menuItems} // Hết lỗi đỏ ở đây
          style={{ borderRight: 0 }}
        />
      </Sider>

      {/* RIGHT SIDE */}
      <Layout style={{ marginLeft: collapsed ? 80 : 260, transition: 'all 0.2s' }}>
        
        {/* HEADER */}
        <Header style={{ 
          padding: '0 24px', 
          background: colorBgContainer, 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          boxShadow: '0 1px 4px rgba(0,21,41,0.08)',
          position: 'sticky',
          top: 0,
          zIndex: 999,
          width: '100%'
        }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <Button
              type="text"
              icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              onClick={() => setCollapsed(!collapsed)}
              style={{ fontSize: '16px', width: 64, height: 64, marginLeft: -24 }}
            />
            
            <div style={{ marginLeft: '16px', display: 'flex', flexDirection: 'column', lineHeight: '1.2' }}>
                <span style={{ fontSize: '18px', fontWeight: 700, color: '#1f1f1f' }}>
                  Bệnh Viện Mắt Trung Ương
                </span>
                <span style={{ fontSize: '12px', color: '#666' }}>
                  Phòng Khám Số 1 - Khoa Chẩn Đoán Hình Ảnh (Clinic ID: CL-001)
                </span>
            </div>
          </div>

          <Space size="large">
            {/* Component Badge đã được import, hết lỗi đỏ */}
            <Badge count={5} size="small">
                <Button type="text" icon={<BellOutlined style={{ fontSize: 20 }} />} />
            </Badge>

            <Dropdown menu={userMenu} trigger={['click']}>
              <Space style={{ cursor: 'pointer', padding: '4px 12px', border: '1px solid #f0f0f0', borderRadius: '30px' }}>
                <Avatar style={{ backgroundColor: '#1677ff' }} icon={<UserOutlined />} />
                <div style={{ display: 'flex', flexDirection: 'column', lineHeight: '1.2' }}>
                    <span style={{ fontWeight: 600, fontSize: '14px' }}>BS. Nguyễn Văn An</span>
                    <span style={{ fontSize: '10px', color: '#888' }}>Chuyên khoa II</span>
                </div>
              </Space>
            </Dropdown>
          </Space>
        </Header>

        {/* CONTENT */}
        <Content style={{ 
          margin: '24px 16px', 
          padding: 24, 
          minHeight: 280, 
          background: colorBgContainer, 
          borderRadius: borderRadiusLG,
          overflowY: 'auto', 
          height: 'calc(100vh - 112px)' 
        }}>
          <Breadcrumb 
            items={[
              { title: 'AURA' },
              { title: location.pathname === '/upload' ? 'Sàng lọc (Task TV2)' : 'Chẩn đoán (Task TV3)' },
            ]} 
            style={{ marginBottom: '16px' }}
          />
          
          <Outlet /> 
        </Content>
      </Layout>
    </Layout>
  );
};

export default MainLayout;