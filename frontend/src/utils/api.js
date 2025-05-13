// API utility functions

const API_URL = 'http://localhost:3000';

/**
 * Get the authentication token from localStorage
 * @returns {string|null} The JWT token or null if not found
 */
export const getToken = () => {
    return localStorage.getItem('token');
};

/**
 * Get the current user from localStorage
 * @returns {Object|null} The user object or null if not found
 */
export const getUser = () => {
    const userString = localStorage.getItem('user');
    return userString ? JSON.parse(userString) : null;
};

/**
 * Check if user is authenticated
 * @returns {boolean} True if user has a token, false otherwise
 */
export const isAuthenticated = () => {
    return !!getToken();
};

/**
 * Logout the user
 */
export const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    // Redirect to login if needed
    window.location.href = '/login';
};

/**
 * Make an authenticated API request
 * @param {string} endpoint - The API endpoint
 * @param {Object} options - Fetch options
 * @returns {Promise<Object>} Response data
 */
export const apiRequest = async (endpoint, options = {}) => {
    const token = getToken();
    
    // Set up headers with authentication token
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers
    };
    
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    
    const requestOptions = {
        ...options,
        headers
    };
    
    try {
        const response = await fetch(`${API_URL}${endpoint}`, requestOptions);
        const data = await response.json();
        
        if (!response.ok) {
            // If unauthorized, logout the user
            if (response.status === 401 || response.status === 403) {
                logout();
            }
            throw new Error(data.message || 'API request failed');
        }
        
        return data;
    } catch (error) {
        console.error('API request error:', error);
        throw error;
    }
};

/**
 * Make a GET request
 * @param {string} endpoint - The API endpoint
 * @returns {Promise<Object>} Response data
 */
export const get = (endpoint) => {
    return apiRequest(endpoint);
};

/**
 * Make a POST request
 * @param {string} endpoint - The API endpoint
 * @param {Object} data - Request body data
 * @returns {Promise<Object>} Response data
 */
export const post = (endpoint, data) => {
    return apiRequest(endpoint, {
        method: 'POST',
        body: JSON.stringify(data)
    });
};

/**
 * Make a PUT request
 * @param {string} endpoint - The API endpoint
 * @param {Object} data - Request body data
 * @returns {Promise<Object>} Response data
 */
export const put = (endpoint, data) => {
    return apiRequest(endpoint, {
        method: 'PUT',
        body: JSON.stringify(data)
    });
};

/**
 * Make a DELETE request
 * @param {string} endpoint - The API endpoint
 * @param {Object} data - Request body data (optional)
 * @returns {Promise<Object>} Response data
 */
export const del = (endpoint, data) => {
    const options = {
        method: 'DELETE'
    };
    
    if (data) {
        options.body = JSON.stringify(data);
    }
    
    return apiRequest(endpoint, options);
}; 