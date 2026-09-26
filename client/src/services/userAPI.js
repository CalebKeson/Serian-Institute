// frontend/src/services/userAPI.js - COMPLETE

import api from './api';

export const userAPI = {
  // ==================== ADMIN METHODS ====================
  
  // Get all users with pagination and filters
  getUsers: (params = {}) => {
    const { 
      page = 1, 
      limit = 10, 
      search = '', 
      role = '', 
      isActive = '',
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = params;
    
    return api.get('/users', {
      params: { page, limit, search, role, isActive, sortBy, sortOrder }
    });
  },
  
  // Get single user by ID
  getUser: (id) => {
    return api.get(`/users/${id}`);
  },
  
  // Create new user
  createUser: (data) => {
    return api.post('/users', data);
  },
  
  // Update user
  updateUser: (id, data) => {
    return api.put(`/users/${id}`, data);
  },
  
  // Delete user
  deleteUser: (id) => {
    return api.delete(`/users/${id}`);
  },
  
  // Get user statistics
  getUserStats: () => {
    return api.get('/users/stats');
  },
  
  // ==================== PROFILE METHODS (For current user) ====================
  
  // Get current user profile with role-specific data
  getProfile: () => {
    return api.get('/users/profile');
  },
  
  // Update current user profile
  updateProfile: (data) => {
    return api.put('/users/profile', data);
  },
  
  // Update avatar (stores in localStorage for now)
  updateAvatar: (avatarData) => {
    return api.post('/users/profile/avatar', { avatarData });
  }
};

export default userAPI;