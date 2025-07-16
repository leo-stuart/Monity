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

export const remove = (endpoint) => {
    return apiClient.delete(endpoint);
};

export const del = (endpoint) => {
    return apiClient.delete(endpoint);
};

// Budget specific API calls
export const getBudgets = async () => {
    const { data } = await apiClient.get('/budgets');
    return data;
};

export const upsertBudget = async (budget) => {
    const { data } = await apiClient.post('/budgets', budget);
    return data;
};

export const deleteBudget = async (id) => {
    const { data } = await apiClient.delete(`/budgets/${id}`);
    return data;
};

// Category specific API calls
export const getCategories = async () => {
    const { data } = await apiClient.get('/categories');
    return data;
};

// Recurring Transactions specific API calls
export const getRecurringTransactions = async () => {
    const { data } = await apiClient.get('/recurring-transactions');
    return data;
};

export const addRecurringTransaction = async (transaction) => {
    const { data } = await apiClient.post('/recurring-transactions', transaction);
    return data;
};

export const updateRecurringTransaction = async (id, transaction) => {
    const { data } = await apiClient.put(`/recurring-transactions/${id}`, transaction);
    return data;
};

export const deleteRecurringTransaction = async (id) => {
    const { data } = await apiClient.delete(`/recurring-transactions/${id}`);
    return data;
};

export const processRecurringTransactions = async () => {
    const { data } = await apiClient.post('/recurring-transactions/process');
    return data;
};

// Transaction Types specific API calls
export const getTransactionTypes = async () => {
    const { data } = await apiClient.get('/transaction-types');
    return data;
};


export default apiClient; 