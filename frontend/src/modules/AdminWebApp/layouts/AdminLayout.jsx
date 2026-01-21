import React from 'react';
import { Outlet, useNavigate } from 'react-router-dom';

const AdminLayout = () => {
  const navigate = useNavigate();
  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/auth');
  };

  return (
    <div style={{ display: 'flex', height: '100vh' }}>
      <div style={{ width: '250px', background: '#001529', color: 'white', padding: '20px' }}>
        <h2>Admin Panel</h2>
        <ul style={{ listStyle: 'none', padding: 0, marginTop: '20px' }}>
          <li style={{ padding: '10px', cursor: 'pointer' }} onClick={() => navigate('/admin/dashboard')}>Dashboard</li>
          <li style={{ padding: '10px', cursor: 'pointer' }} onClick={() => navigate('/admin/users')}>Users</li>
          <li style={{ padding: '10px', cursor: 'pointer', color: 'red' }} onClick={handleLogout}>Logout</li>
        </ul>
      </div>
      <div style={{ flex: 1, padding: '20px', overflow: 'auto' }}>
        <Outlet />
      </div>
    </div>
  );
};
export default AdminLayout;