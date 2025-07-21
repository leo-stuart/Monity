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

export const getLiabilities = () => apiClient.get('/net-worth/liabilities').then(res => res.data);
export const addLiability = (liability) => apiClient.post('/net-worth/liabilities', liability).then(res => res.data);
export const updateLiability = (id, liability) => apiClient.put(`/net-worth/liabilities/${id}`, liability).then(res => res.data);
export const deleteLiability = (id) => apiClient.delete(`/net-worth/liabilities/${id}`).then(res => res.data);


// Group and Expense Splitting
export const createGroup = (group) => apiClient.post('/groups', group).then(res => res.data);
export const getGroups = () => apiClient.get('/groups').then(res => res.data);
export const getGroupById = (id) => apiClient.get(`/groups/${id}`).then(res => res.data);
export const updateGroup = (id, group) => apiClient.put(`/groups/${id}`, group).then(res => res.data);
export const deleteGroup = (id) => apiClient.delete(`/groups/${id}`);
export const addGroupMember = (groupId, name) => apiClient.post(`/groups/${groupId}/members`, { name }).then(res => res.data);
export const removeGroupMember = (groupId, userId) => apiClient.delete(`/groups/${groupId}/members/${userId}`);
export const addGroupExpense = (groupId, expense) => apiClient.post(`/groups/${groupId}/expenses`, expense).then(res => res.data);
export const updateGroupExpense = (expenseId, expense) => apiClient.put(`/expenses/${expenseId}`, expense).then(res => res.data);
export const deleteGroupExpense = (expenseId) => apiClient.delete(`/expenses/${expenseId}`);
export const settleExpenseShare = (shareId) => apiClient.post(`/shares/${shareId}/settle`).then(res => res.data);

// User search and invitation functions
export const searchUsers = (query) => apiClient.get(`/users/search?q=${encodeURIComponent(query)}`).then(res => res.data);
export const sendGroupInvitation = (groupId, email) => apiClient.post(`/groups/${groupId}/invite`, { email }).then(res => res.data);
export const getPendingInvitations = () => apiClient.get('/invitations/pending').then(res => res.data);
export const respondToInvitation = (invitationId, response) => apiClient.post(`/invitations/${invitationId}/respond`, { response }).then(res => res.data);


export default apiClient; 