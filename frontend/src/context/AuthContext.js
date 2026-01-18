import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext(null);

const parseJwt = (token) => {
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function(c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
        return JSON.parse(jsonPayload);
    } catch (e) {
        return null;
    }
};

// --- HÀM LÀM SẠCH SỐ ĐIỆN THOẠI ---
const cleanPhoneNumber = (raw) => {
    if (!raw) return '';
    let str = String(raw).trim();
    
    // Xử lý +840... (Lỗi dư số 0)
    if (str.startsWith('+840')) return '0' + str.slice(4); 
    // Xử lý +84...
    if (str.startsWith('+84')) return '0' + str.slice(3);
    // Xử lý 84...
    if (str.startsWith('84')) return '0' + str.slice(2);
    
    return str;
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    const fetchUserProfile = async (token) => {
        try {
            const response = await axios.get('http://localhost:5002/api/patients/me', {
                headers: { Authorization: `Bearer ${token}` }
            });
            return response.data;
        } catch (error) {
            return null;
        }
    };

    const mergeUserData = (baseUser, dbProfile) => {
        if (!dbProfile) return baseUser;

        const finalPhone = dbProfile.phoneNumber || baseUser.phoneNumber;
        const finalEmail = dbProfile.email || baseUser.email;
        const finalName = dbProfile.fullName || baseUser.fullName;

        return {
            ...baseUser,
            ...dbProfile,
            fullName: finalName,
            phoneNumber: cleanPhoneNumber(finalPhone),
            email: finalEmail
        };
    };

    // 1. Check Login (F5)
    useEffect(() => {
        const checkLogin = async () => {
            const token = localStorage.getItem('aura_token');
            if (token) {
                const decoded = parseJwt(token);
                if (decoded?.exp && decoded.exp * 1000 < Date.now()) {
                    logout(); setLoading(false); return;
                }

                // Tìm SĐT trong Token (thử nhiều trường hợp)
                const tokenPhone = decoded?.mobilephone || decoded?.phone || decoded?.phoneNumber || decoded?.PhoneNumber;
                
                let userData = {
                    id: decoded?.nameid || decoded?.sub || decoded?.id,
                    role: decoded?.role || decoded?.actort,
                    token: token,
                    fullName: decoded?.unique_name || decoded?.name,
                    phoneNumber: cleanPhoneNumber(tokenPhone),
                    email: decoded?.email
                };

                const dbProfile = await fetchUserProfile(token);
                userData = mergeUserData(userData, dbProfile);

                setUser(userData);
                localStorage.setItem('aura_user', JSON.stringify(userData));
            }
            setLoading(false);
        };
        checkLogin();
    }, []);

    // 2. Login
    const login = async (loginRes) => {
        // --- [DEBUG] KIỂM TRA DỮ LIỆU SERVER TRẢ VỀ ---
        // Hãy bật F12 -> Console để xem dòng này khi bấm Đăng nhập
        console.log("🔥 Dữ liệu Server trả về khi Login:", loginRes);

        const token = loginRes.token || loginRes.value?.token;
        if (!token) return;

        localStorage.setItem('aura_token', token);
        const decoded = parseJwt(token);
        
        // --- CHIẾN THUẬT TÌM SĐT KHẮP NƠI ---
        // Tìm trong loginRes (API trả về)
        // Tìm trong loginRes.user (nếu backend gói trong object user)
        // Tìm trong Token (decoded)
        const rawPhone = 
            loginRes.phoneNumber || 
            loginRes.PhoneNumber ||  // Thử viết hoa
            loginRes.phone || 
            loginRes.Phone || 
            loginRes.user?.phoneNumber || // Thử lồng nhau
            loginRes.user?.phone ||
            decoded?.mobilephone || 
            decoded?.phone || 
            decoded?.phoneNumber;

        console.log("👉 Số điện thoại tìm được:", rawPhone);

        let userData = { 
            id: decoded?.nameid || decoded?.sub || decoded?.id,
            role: decoded?.role || decoded?.actort,
            token: token,
            fullName: loginRes.fullName || decoded?.unique_name,
            
            // Làm sạch số tìm được
            phoneNumber: cleanPhoneNumber(rawPhone),
            
            email: loginRes.email || decoded?.email
        };

        const dbProfile = await fetchUserProfile(token);
        userData = mergeUserData(userData, dbProfile);

        const userToSave = { ...userData };
        delete userToSave.token; 
        
        localStorage.setItem('aura_user', JSON.stringify(userToSave));
        setUser(userToSave);
    };

    const logout = () => {
        localStorage.removeItem('aura_token');
        localStorage.removeItem('aura_user');
        setUser(null);
        window.location.href = '/login'; 
    };

    const refreshUser = async () => {
        const token = localStorage.getItem('aura_token');
        if (token) {
            const dbProfile = await fetchUserProfile(token);
            setUser(prev => {
                const updated = mergeUserData(prev, dbProfile);
                localStorage.setItem('aura_user', JSON.stringify(updated));
                return updated;
            });
        }
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, refreshUser, loading }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    return useContext(AuthContext);
};

export default AuthContext;