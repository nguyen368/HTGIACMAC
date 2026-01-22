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
    } catch (e) { return null; }
};

const cleanPhoneNumber = (raw) => {
    if (!raw) return '';
    let str = String(raw).trim();
    if (str.startsWith('+840')) return '0' + str.slice(4); 
    if (str.startsWith('+84')) return '0' + str.slice(3);
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
        } catch (error) { return null; }
    };

    // --- MERGE LOGIC: Hỗ trợ cả fullName (FE) và FullName (BE) ---
    const mergeUserData = (baseUser, dbProfile) => {
        if (!dbProfile) return baseUser;
        return {
            ...baseUser,
            ...dbProfile,
            fullName: dbProfile.fullName || dbProfile.FullName || baseUser.fullName,
            phoneNumber: cleanPhoneNumber(dbProfile.phoneNumber || dbProfile.PhoneNumber || baseUser.phoneNumber)
        };
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
                    if (savedUser) setUser(JSON.parse(savedUser));
                    const dbProfile = await fetchUserProfile(token);
                    if (dbProfile) {
                        const updated = mergeUserData(JSON.parse(savedUser || '{}'), dbProfile);
                        setUser(updated);
                        localStorage.setItem('aura_user', JSON.stringify(updated));
                    }
                }
            }
            setLoading(false);
        };
        initAuth();
    }, []);

    const login = async (loginRes) => {
        const token = loginRes.token || loginRes.value?.token;
        if (!token) return;
        localStorage.setItem('aura_token', token);
        const decoded = parseJwt(token);
        const roleKey = "http://schemas.microsoft.com/ws/2008/06/identity/claims/role";
        
        let userData = { 
            id: decoded?.nameid || decoded?.sub || decoded?.id,
            role: String(decoded?.[roleKey] || decoded?.role || 'Patient').toLowerCase(),
            token: token,
            fullName: loginRes.fullName || decoded?.unique_name || "Bệnh nhân"
        };

        const dbProfile = await fetchUserProfile(token);
        const finalUser = mergeUserData(userData, dbProfile);
        setUser(finalUser);
        localStorage.setItem('aura_user', JSON.stringify(finalUser));
    };

    const logout = () => {
        localStorage.clear();
        setUser(null);
        window.location.href = '/login'; 
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, loading }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
export default AuthContext;