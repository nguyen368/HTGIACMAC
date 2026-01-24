import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import jwtDecode from 'jwt-decode';
import authApi from '../api/authApi'; 
import axiosClient from '../api/axiosClient';

// 1. Định nghĩa Interface cho User
export interface User {
    id: string;
    role: string;
    token: string;
    fullName: string;
    email?: string;
    phoneNumber?: string;
    picture?: string;
    clinicId?: string;
}

interface AuthContextType {
    user: User | null;
    login: (input1: string | object, input2?: string) => Promise<{ success: boolean; role?: string; message?: string }>;
    logout: () => void;
    loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const parseJwt = (token: string): any => {
    try {
        return jwtDecode(token);
    } catch (e) { return null; }
};

const cleanPhoneNumber = (raw: any): string => {
    if (!raw || typeof raw !== 'string') return ''; 
    let str = String(raw).trim();
    if (str.startsWith('+840')) return '0' + str.slice(4); 
    if (str.startsWith('+84')) return '0' + str.slice(3);
    if (str.startsWith('84')) return '0' + str.slice(2);
    return str;
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState<boolean>(true);

    const mergeUserData = (baseUser: any, dbProfile: any): User => {
        if (!dbProfile) return baseUser;
        return {
            ...baseUser,
            ...dbProfile,
            fullName: dbProfile.fullName || dbProfile.FullName || baseUser.fullName,
            phoneNumber: cleanPhoneNumber(dbProfile.phoneNumber || dbProfile.PhoneNumber || baseUser.phoneNumber)
        };
    };

    const fetchUserProfile = async (token: string) => {
        try {
            const response = await axiosClient.get('/patients/me', {
                headers: { Authorization: `Bearer ${token}` }
            });
            return response.data?.value || response.data || response; 
        } catch (error) { 
            console.warn("Lỗi lấy thông tin user:", error);
            return null; 
        }
    };

    useEffect(() => {
        const initAuth = async () => {
            const token = localStorage.getItem('aura_token');
            const savedUser = localStorage.getItem('aura_user');
            
            if (token) {
                const decoded = parseJwt(token);
                if (decoded?.exp && decoded.exp * 1000 < Date.now()) {
                    logout();
                } else {
                    let currentUser = savedUser ? JSON.parse(savedUser) : {};
                    setUser(currentUser);
                    
                    const dbProfile = await fetchUserProfile(token);
                    if (dbProfile) {
                        const updated = mergeUserData(currentUser, dbProfile);
                        setUser(updated);
                        localStorage.setItem('aura_user', JSON.stringify(updated));
                    }
                }
            }
            setLoading(false);
        };
        initAuth();
    }, []);

    const login = async (input1: any, input2?: string) => {
        try {
            let token: string | null = null;
            let userData: any = {};

            if (typeof input1 === 'object' && input1.token) {
                token = input1.token;
                userData = input1; 
            } 
            else if (typeof input1 === 'string') {
                const cleanPhone = cleanPhoneNumber(input1);
                const response: any = await authApi.login({ 
                    phoneNumber: cleanPhone,
                    email: input1,
                    password: input2 
                });
                
                const data = response.data?.value || response.data || response;
                token = data.token;
                if (!token) throw new Error("Không tìm thấy token trong phản hồi");
            }

            if (!token) return { success: false, message: "Đăng nhập thất bại" };

            localStorage.setItem('aura_token', token);
            const decoded = parseJwt(token);
            const roleKey = "http://schemas.microsoft.com/ws/2008/06/identity/claims/role";
            
            const baseUser = {
                id: decoded?.nameid || decoded?.sub || decoded?.id,
                role: String(decoded?.[roleKey] || decoded?.role || userData.role || 'Patient').toLowerCase(),
                token: token,
                fullName: userData.fullName || decoded?.name || decoded?.unique_name || "Người dùng",
                email: userData.email || decoded?.email,
                picture: userData.picture
            };

            const dbProfile = await fetchUserProfile(token);
            const finalUser = mergeUserData(baseUser, dbProfile);

            setUser(finalUser);
            localStorage.setItem('aura_user', JSON.stringify(finalUser));

            return { success: true, role: finalUser.role };

        } catch (error: any) {
            console.error("Login Error:", error);
            return { success: false, message: error.message };
        }
    };

    const logout = () => {
        localStorage.removeItem('aura_token');
        localStorage.removeItem('aura_user');
        setUser(null);
        window.location.href = '/auth';
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, loading }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) throw new Error("useAuth must be used within AuthProvider");
    return context;
};