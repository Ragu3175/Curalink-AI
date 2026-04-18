import axios from 'axios';

const API_BASE = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000') + '/api';

// Create instance for better configuration
const api = axios.create({
    baseURL: API_BASE
});

// Add interceptor to include token in all requests
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('curalink_token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Add interceptor to handle 401 globally
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem('curalink_token');
            // We don't necessarily want to reload here as it might loop, 
            // but we ensure the token is gone.
        }
        return Promise.reject(error);
    }
);

export const loginUser = async (email, password) => {
    const response = await api.post('/auth/login', { email, password });
    if (response.data.token) localStorage.setItem('curalink_token', response.data.token);
    return response.data;
};

export const registerUser = async (username, email, password) => {
    const response = await api.post('/auth/register', { username, email, password });
    if (response.data.token) localStorage.setItem('curalink_token', response.data.token);
    return response.data;
};

export const completeOnboarding = async (onboardingData) => {
    const response = await api.post('/auth/onboarding', onboardingData);
    return response.data;
};

export const fetchMe = async () => {
    const response = await api.get('/auth/me');
    return response.data;
};

export const sendMessage = async (message, conversationId, context) => {
    const response = await api.post('/chat', {
        message,
        conversationId,
        context
    });
    return response.data;
};

export const getHistory = async () => {
    const response = await api.get('/history');
    return response.data;
};

export const getConversation = async (id) => {
    const response = await api.get(`/conversation/${id}`);
    return response.data;
};

export default api;
