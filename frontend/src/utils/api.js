import axios from 'axios';
import { supabase } from './supabase';

console.log("API URL from env:", import.meta.env.VITE_API_URL);

const apiClient = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000',
});

apiClient.interceptors.request.use(
    async (config) => {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
            config.headers.Authorization = `Bearer ${session.access_token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

export const get = (endpoint) => {
    return apiClient.get(endpoint);
};

export const post = (endpoint, data) => {
    return apiClient.post(endpoint, data);
};

export const put = (endpoint, data) => {
    return apiClient.put(endpoint, data);
};

export const del = (endpoint) => {
    return apiClient.delete(endpoint);
};

export default apiClient; 