import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { message } from 'antd';
import authApi from '../api/authApi';

// Định nghĩa kiểu dữ liệu User đầy đủ hơn (thêm userId, email)
export interface User {
  userId?: number;
  username: string;
  role: 'bacsi' | 'kythuat' | string;
  fullName: string;
  email?: string;
}

interface AuthContextType {
  user: User | null;
  // Sửa login để chấp nhận 2 tham số: (thông tin, token tùy chọn)
  login: (data: any, token?: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const navigate = useNavigate();

  useEffect(() => {
    const initAuth = async () => {
      const storedUser = localStorage.getItem('user');
      const token = localStorage.getItem('accessToken'); // Đổi tên key cho thống nhất
      if (storedUser && token) {
        try {
          setUser(JSON.parse(storedUser));
        } catch (error) {
          console.error("Lỗi khôi phục user:", error);
          logout();
        }
      }
      setIsLoading(false);
    };
    initAuth();
  }, []);

  // --- HÀM LOGIN ĐA NĂNG (QUAN TRỌNG) ---
  const login = async (data: any, token?: string) => {
    try {
      // TRƯỜNG HỢP 1: Login Giả lập (được gọi từ LoginPage demo)
      if (token) {
        // Tự động thêm userId nếu thiếu (để trang Profile không bị lỗi)
        const fakeUser: User = { 
            userId: 1, 
            email: 'demo@medvision.vn',
            ...data 
        };
        
        setUser(fakeUser);
        localStorage.setItem('accessToken', token);
        localStorage.setItem('user', JSON.stringify(fakeUser));
        navigate('/'); // Chuyển trang ngay lập tức
        return;
      }

      // TRƯỜNG HỢP 2: Login thật (Gọi API Server)
      const response: any = await authApi.login(data);
      const apiUser = {
        userId: response.userId,
        username: response.username || data.username,
        fullName: response.fullName,
        role: response.role,
        email: response.email
      };
      
      setUser(apiUser);
      localStorage.setItem('accessToken', response.token);
      localStorage.setItem('user', JSON.stringify(apiUser));
      message.success('Đăng nhập thành công!');
      navigate('/');

    } catch (error: any) {
      console.error("Login failed:", error);
      const errorMsg = error.response?.data?.message || 'Đăng nhập thất bại!';
      message.error(errorMsg);
      throw error;
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('accessToken');
    localStorage.removeItem('user');
    navigate('/login');
    message.info('Đã đăng xuất.');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated: !!user, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};