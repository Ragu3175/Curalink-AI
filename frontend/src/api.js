import axios from 'axios';

const API_BASE = 'http://localhost:5000/api';

export const sendMessage = async (message, conversationId, context) => {
    const response = await axios.post(`${API_BASE}/chat`, {
        message,
        conversationId,
        context
    });
    return response.data;
};

export const getHistory = async () => {
    const response = await axios.get(`${API_BASE}/history`);
    return response.data;
};

// ADDED: Fetch full state for a specific conversation
export const getConversation = async (id) => {
    const response = await axios.get(`${API_BASE}/conversation/${id}`);
    return response.data;
};
