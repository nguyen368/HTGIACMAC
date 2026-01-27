import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { jwtDecode } from 'jwt-decode';
import authApi from '../api/authApi'; 
import axiosClient from '../api/axiosClient';

export interface User {
    id: string; role: string; token: string; fullName: string; email?: string; clinicId?: string;
}

interface AuthContextType {
    user: User | null;
    isAuthenticated: boolean;
    login: (input1: any, input2?: string) => Promise<{ success: boolean; role?: string; message?: string }>;
    logout: () => void;
    loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState<boolean>(true);

    const fetchUserProfile = async (token: string) => {
        try {
            const response = await axiosClient.get('/patients/me', {
                headers: { Authorization: `Bearer ${token}` }
            });
            return response.data?.value || response.data;
        } catch (error: any) { 
            if (error.response?.status === 404) return {}; 
            return null; 
        }
    };

    useEffect(() => {
        const initAuth = async () => {
            const token = localStorage.getItem('aura_token');
            const savedUser = localStorage.getItem('aura_user');
            if (token) {
                try {
                    const decoded: any = jwtDecode(token);
                    if (decoded?.exp && decoded.exp * 1000 < Date.now()) { 
                        logout(); 
                    } else {
                        const userObj = savedUser ? JSON.parse(savedUser) : null;
                        if (userObj) setUser(userObj);
                        
                        // FIX 404: Chỉ fetch profile nếu là bệnh nhân
                        const role = (decoded["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"] || decoded.role || "").toLowerCase();
                        if (role === 'patient') {
                            await fetchUserProfile(token);
                        }
                    }
                } catch { logout(); }
            }
            setLoading(false);
        };
        initAuth();
    }, []);

    const login = async (input1: any, input2?: string) => {
        try {
            let token = "";
            if (typeof input1 === 'object' && input1.token) { 
                token = input1.token; 
            } else {
                const response: any = await authApi.login({ email: input1, password: input2 });
                token = response.data?.value?.token || response.data?.token;
            }

            localStorage.setItem('aura_token', token);
            const decoded: any = jwtDecode(token);
            const roleKey = "http://schemas.microsoft.com/ws/2008/06/identity/claims/role";
            
            const baseUser = {
                id: decoded.nameid || decoded.sub,
                role: String(decoded[roleKey] || decoded.role || 'patient').toLowerCase(),
                token: token,
                fullName: decoded.unique_name || decoded.fullName || "Người dùng",
                email: decoded.email,
                clinicId: decoded.clinicId 
            };

            setUser(baseUser);
            localStorage.setItem('aura_user', JSON.stringify(baseUser));
            return { success: true, role: baseUser.role };
        } catch (error: any) { 
            return { success: false, message: error.response?.data?.message || "Sai thông tin đăng nhập" }; 
        }
    };

    const logout = () => {
        localStorage.removeItem('aura_token');
        localStorage.removeItem('aura_user');
        setUser(null);
        window.location.href = '/auth';
    };

    return (
        <AuthContext.Provider value={{ user, isAuthenticated: !!user, login, logout, loading }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) throw new Error("useAuth must be used within AuthProvider");
    return context;
};