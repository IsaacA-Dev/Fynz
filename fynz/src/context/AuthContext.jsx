import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { auth as authApi, users } from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(() => localStorage.getItem('fynz_token'));
    const [loading, setLoading] = useState(true);

    const fetchProfile = useCallback(async () => {
        try {
            const res = await users.me();
            setUser(res.data);
        } catch {
            // Token inválido
            localStorage.removeItem('fynz_token');
            setToken(null);
            setUser(null);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (token) {
            fetchProfile();
        } else {
            setLoading(false);
        }
    }, [token, fetchProfile]);

    const login = async (email, password) => {
        const res = await authApi.login({ email, password });
        const jwt = res.data.token;
        localStorage.setItem('fynz_token', jwt);
        setToken(jwt);
        setUser(res.data.user);
        return res;
    };

    const register = async (email, username, password) => {
        const res = await authApi.register({ email, username, password });
        return res;
    };

    const logout = () => {
        localStorage.removeItem('fynz_token');
        setToken(null);
        setUser(null);
    };

    const refreshProfile = () => fetchProfile();

    return (
        <AuthContext.Provider
            value={{ user, token, loading, login, register, logout, refreshProfile }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider');
    return ctx;
};
