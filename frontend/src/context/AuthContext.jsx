import React, { createContext, useContext, useState, useEffect } from 'react';
import { loginUser, registerUser, fetchMe, completeOnboarding } from '../api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const initAuth = async () => {
            const token = localStorage.getItem('curalink_token');
            if (token) {
                try {
                    const userData = await fetchMe();
                    setUser(userData);
                } catch (err) {
                    // Silent fail for session restoration if unauthorized or token expired
                    localStorage.removeItem('curalink_token');
                }
            }
            setLoading(false);
        };
        initAuth();
    }, []);

    const login = async (email, password) => {
        setError(null);
        try {
            const data = await loginUser(email, password);
            setUser(data.user);
            return data;
        } catch (err) {
            setError(err.response?.data?.error || 'Login failed');
            throw err;
        }
    };

    const register = async (username, email, password) => {
        setError(null);
        try {
            const data = await registerUser(username, email, password);
            setUser(data.user);
            return data;
        } catch (err) {
            setError(err.response?.data?.error || 'Registration failed');
            throw err;
        }
    };

    const finalizeOnboarding = async (onboardingData) => {
        try {
            const response = await completeOnboarding(onboardingData);
            setUser(response.user);
            return response;
        } catch (err) {
            console.error('Onboarding update failed:', err);
            throw err;
        }
    };

    const logout = () => {
        localStorage.removeItem('curalink_token');
        localStorage.removeItem('curalink_cid');
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, loading, error, login, register, logout, finalizeOnboarding }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
