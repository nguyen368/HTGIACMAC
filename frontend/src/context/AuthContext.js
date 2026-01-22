import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import jwtDecode from 'jwt-decode';
import authApi from '../api/authApi'; 
import axiosClient from '../api/axiosClient'; // Import thêm axiosClient

const AuthContext = createContext(null);

const parseJwt = (token) => {
    try {
        return jwtDecode(token);
    } catch (e) { return null; }
};

const cleanPhoneNumber = (raw) => {
    if (!raw || typeof raw !== 'string') return ''; 
    let str = String(raw).trim();
    if (str.startsWith('+840')) return '0' + str.slice(4); 
    if (str.startsWith('+84')) return '0' + str.slice(3);
    if (str.startsWith('84')) return '0' + str.slice(2);
    return str;
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    const mergeUserData = (baseUser, dbProfile) => {
        if (!dbProfile) return baseUser;
        return {
            ...baseUser,
            ...dbProfile,
            fullName: dbProfile.fullName || dbProfile.FullName || baseUser.fullName,
            phoneNumber: cleanPhoneNumber(dbProfile.phoneNumber || dbProfile.PhoneNumber || baseUser.phoneNumber)
        };
    };

    // --- FETCH PROFILE (ĐÃ SỬA: TRUYỀN TOKEN TRỰC TIẾP) ---
    const fetchUserProfile = async (token) => {
        try {
            // Quan trọng: Truyền header Authorization trực tiếp tại đây
            // để đảm bảo backend nhận được token ngay lập tức sau khi login
            const response = await axiosClient.get('/patients/me', {
                headers: { Authorization: `Bearer ${token}` }
            });
            return response; 
        } catch (error) { 
            console.warn("Lỗi lấy thông tin user (có thể do user mới chưa có profile):", error);
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
                    
                    // Gọi hàm với token
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

    const login = async (input1, input2) => {
        try {
            let token = null;
            let userData = {};

            if (typeof input1 === 'object' && input1.token) {
                console.log("👉 Phát hiện đăng nhập Google/Token trực tiếp");
                token = input1.token;
                userData = input1; 
            } 
            else if (typeof input1 === 'string') {
                const cleanPhone = cleanPhoneNumber(input1);
                const response = await authApi.login({ 
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

            // Truyền token vào đây để đảm bảo request có quyền
            const dbProfile = await fetchUserProfile(token);
            const finalUser = mergeUserData(baseUser, dbProfile);

            setUser(finalUser);
            localStorage.setItem('aura_user', JSON.stringify(finalUser));

            return { success: true, role: finalUser.role };

        } catch (error) {
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

export const useAuth = () => useContext(AuthContext);
export default AuthContext;