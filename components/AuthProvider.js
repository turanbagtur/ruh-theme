'use client';
import { createContext, useContext, useState, useEffect, useCallback } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(null);
    const [loading, setLoading] = useState(true);

    // Load saved session on mount
    useEffect(() => {
        const savedToken = localStorage.getItem('yomi_token');
        const savedUser = localStorage.getItem('yomi_user');
        if (savedToken && savedUser) {
            setToken(savedToken);
            setUser(JSON.parse(savedUser));
        }
        setLoading(false);
    }, []);

    // Refresh user data from server when token is available (sync points, avatar etc.)
    useEffect(() => {
        if (!token) return;
        async function refreshUser() {
            try {
                const res = await fetch('/api/auth/me', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    if (data.user) {
                        setUser(data.user);
                        localStorage.setItem('yomi_user', JSON.stringify(data.user));
                    }
                }
            } catch {}
        }
        refreshUser();
    }, [token]);

    const login = useCallback(async (email, password, turnstileToken = '') => {
        const res = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password, turnstileToken }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        setUser(data.user);
        setToken(data.token);
        localStorage.setItem('yomi_token', data.token);
        localStorage.setItem('yomi_user', JSON.stringify(data.user));
        return data;
    }, []);

    const register = useCallback(async (username, email, password, turnstileToken = '') => {
        const res = await fetch('/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, email, password, turnstileToken }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        setUser(data.user);
        setToken(data.token);
        localStorage.setItem('yomi_token', data.token);
        localStorage.setItem('yomi_user', JSON.stringify(data.user));
        return data;
    }, []);

    const logout = useCallback(async () => {
        setUser(null);
        setToken(null);
        localStorage.removeItem('yomi_token');
        localStorage.removeItem('yomi_user');
        // Clear httpOnly cookie used for server-side maintenance mode check
        await fetch('/api/auth/logout', { method: 'POST' }).catch(() => {});
    }, []);

    const authFetch = useCallback(async (url, options = {}) => {
        return fetch(url, {
            ...options,
            headers: {
                ...options.headers,
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
        });
    }, [token]);

    // Update user in state AND localStorage (fixed key: was 'ruh_user' instead of 'yomi_user')
    const updateUser = useCallback((newUser) => {
        setUser(newUser);
        localStorage.setItem('yomi_user', JSON.stringify(newUser));
    }, []);

    // Refresh user data from server (call this after earning points etc.)
    const refreshUser = useCallback(async () => {
        if (!token) return;
        try {
            const res = await fetch('/api/auth/me', {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                if (data.user) {
                    setUser(data.user);
                    localStorage.setItem('yomi_user', JSON.stringify(data.user));
                }
            }
        } catch {}
    }, [token]);

    return (
        <AuthContext.Provider value={{ user, token, loading, login, register, logout, authFetch, updateUser, refreshUser }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);
