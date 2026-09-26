// frontend/src/services/api.js - COMPLETE FIXED VERSION

import axios from 'axios';

const API_URL = import.meta.env.VITE_REACT_APP_BACKEND_BASE_URL + '/api';

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ============ REQUEST INTERCEPTOR ============
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// ============ RESPONSE INTERCEPTOR - FIXED ============
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const originalRequest = error.config;
    
    // Check if it's a 401 error
    if (error.response?.status === 401) {
      // Get current path
      const currentPath = window.location.pathname;
      
      // Don't redirect on auth pages
      const isAuthPage = currentPath === '/login' || 
                         currentPath === '/register' || 
                         currentPath === '/forgot-password' || 
                         currentPath.startsWith('/reset-password/');
      
      // Don't redirect if this is the change-password request itself
      const isChangePasswordRequest = originalRequest?.url?.includes('/auth/change-password');
      
      if (isChangePasswordRequest) {
        // If it's the change-password request failing, just reject
        return Promise.reject(error);
      }
      
      // Only redirect if not on auth page
      if (!isAuthPage) {
        localStorage.removeItem('token');
        localStorage.removeItem('userData');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// ============ AUTH API ============
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  googleAuth: (googleData) => api.post('/auth/google-auth', googleData),
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  validateResetToken: (token) => api.get(`/auth/reset-password/${token}`),
  resetPassword: (token, password) => api.post(`/auth/reset-password/${token}`, { password }),
  changePassword: (data) => api.post('/auth/change-password', data),
};

export default api;