import axios from 'axios';

// const API_URL = 'http://localhost:5000/api';
const API_URL = import.meta.env.VITE_REACT_APP_BACKEND_BASE_URL + '/api';

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
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

// Response interceptor to handle errors - FIXED
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Only logout if we're not already on login page
      const currentPath = window.location.pathname;
      if (currentPath !== '/login' && currentPath !== '/register' && 
          currentPath !== '/forgot-password' && !currentPath.startsWith('/reset-password/')) {
        localStorage.removeItem('token');
        localStorage.removeItem('userData');
        window.location.href = '/login';
      }
      // If already on auth pages, just reject the promise without redirecting
    }
    return Promise.reject(error);
  }
);

// Auth API endpoints
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  
  // Google Authentication - ADD THIS
  googleAuth: (googleData) => api.post('/auth/google-auth', googleData),
  
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  validateResetToken: (token) => api.get(`/auth/reset-password/${token}`),
  resetPassword: (token, password) => api.post(`/auth/reset-password/${token}`, { password }),
};

// Export the main api instance for other endpoints
export default api;