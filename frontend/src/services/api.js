import axios from 'axios';
import { fetchAuthSession } from 'aws-amplify/auth';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// Validate API URL is set
if (!API_BASE_URL) {
    console.error('⚠️ VITE_API_BASE_URL is not set in environment variables!');
    console.error('Please add VITE_API_BASE_URL to your .env file');
}

// Create axios instance
const apiClient = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
    timeout: 30000, // 30 second timeout
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(
    async (config) => {
        try {
            const session = await fetchAuthSession();
            const token = session.tokens?.idToken?.toString();

            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
            }
        } catch (error) {
            console.error('Error fetching auth session:', error);
        }
        return config;
    },
    (error) => {
        console.error('Request interceptor error:', error);
        return Promise.reject(error);
    }
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
    (response) => {
        return response;
    },
    (error) => {
        console.error('API Error:', error);
        console.error('API Error Details:', {
            message: error.message,
            response: error.response?.data,
            status: error.response?.status,
            config: {
                url: error.config?.url,
                method: error.config?.method,
                baseURL: error.config?.baseURL,
            }
        });
        if (error.response) {
            // Server responded with error status
            const message = error.response.data?.error || error.response.data?.message || error.response.statusText;
            return Promise.reject(new Error(message));
        } else if (error.request) {
            // Request made but no response received
            if (!API_BASE_URL) {
                return Promise.reject(new Error('API URL not configured. Please set VITE_API_BASE_URL in .env file'));
            }
            return Promise.reject(new Error('Network error - no response received'));
        } else {
            // Error setting up request
            return Promise.reject(error);
        }
    }
);

export const api = {
    // Notes API methods
    async getNotes() {
        const response = await apiClient.get('/notes');
        return response.data;
    },

    async getNote(noteId) {
        const response = await apiClient.get(`/notes/${noteId}`);
        return response.data;
    },

    async createNote(noteData) {
        const response = await apiClient.post('/notes', noteData);
        return response.data;
    },

    async updateNote(noteId, noteData) {
        const response = await apiClient.put(`/notes/${noteId}`, noteData);
        return response.data;
    },

    async deleteNote(noteId) {
        const response = await apiClient.delete(`/notes/${noteId}`);
        return response.data;
    },
};

export { apiClient };

