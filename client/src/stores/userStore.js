// frontend/src/stores/userStore.js - COMPLETE

import { create } from 'zustand';
import { userAPI } from '../services/userAPI';
import toast from 'react-hot-toast';

export const useUserStore = create((set, get) => ({
  // ==================== STATE ====================
  users: [],
  currentUser: null,
  userStats: null,
  profile: null,
  loading: false,
  error: null,
  
  pagination: {
    current: 1,
    total: 1,
    results: 0,
    limit: 10
  },
  
  filters: {
    search: '',
    role: '',
    isActive: '',
    sortBy: 'createdAt',
    sortOrder: 'desc'
  },
  
  // ==================== PROFILE METHODS ====================
  
  // Get current user profile
  getProfile: async () => {
    set({ loading: true, error: null });
    try {
      const response = await userAPI.getProfile();
      const data = response.data.data;
      
      set({
        profile: data,
        currentUser: data.user,
        loading: false
      });
      
      return { success: true, data };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to fetch profile';
      set({ error: errorMessage, loading: false });
      toast.error(errorMessage);
      return { success: false, message: errorMessage };
    }
  },
  
  // Update current user profile
  updateProfile: async (profileData) => {
    set({ loading: true, error: null });
    try {
      const response = await userAPI.updateProfile(profileData);
      const data = response.data.data;
      
      set({
        profile: { ...get().profile, user: data },
        currentUser: data,
        loading: false
      });
      
      toast.success('Profile updated successfully!');
      return { success: true, data };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to update profile';
      set({ error: errorMessage, loading: false });
      toast.error(errorMessage);
      return { success: false, message: errorMessage };
    }
  },
  
  // Update avatar (stores in localStorage for now)
  updateAvatar: async (avatarData) => {
    set({ loading: true, error: null });
    try {
      const response = await userAPI.updateAvatar(avatarData);
      
      // Update local storage
      const user = get().currentUser;
      if (user) {
        localStorage.setItem(`avatar_${user._id}`, avatarData);
        // Update profile state
        const updatedProfile = get().profile;
        if (updatedProfile) {
          set({
            profile: { ...updatedProfile, user: { ...updatedProfile.user, avatarUrl: avatarData } },
            loading: false
          });
        }
      }
      
      toast.success('Profile picture updated!');
      return { success: true, data: response.data.data };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to update avatar';
      set({ error: errorMessage, loading: false });
      toast.error(errorMessage);
      return { success: false, message: errorMessage };
    }
  },
  
  // ==================== ADMIN METHODS ====================
  
  // Fetch all users with proper pagination and filters
  fetchUsers: async (page = 1, filters = {}) => {
    set({ loading: true, error: null });
    
    try {
      const mergedFilters = { ...get().filters, ...filters };
      const params = {
        page: page || 1,
        limit: mergedFilters.limit || 10,
        search: mergedFilters.search || '',
        role: mergedFilters.role || '',
        isActive: mergedFilters.isActive || '',
        sortBy: mergedFilters.sortBy || 'createdAt',
        sortOrder: mergedFilters.sortOrder || 'desc'
      };
      
      const response = await userAPI.getUsers(params);
      
      set({
        users: response.data.data || [],
        pagination: response.data.pagination || {
          current: page || 1,
          total: 1,
          results: 0,
          limit: 10
        },
        filters: mergedFilters,
        loading: false
      });
      
      return { success: true, data: response.data.data };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to fetch users';
      set({ error: errorMessage, loading: false });
      toast.error(errorMessage);
      return { success: false, message: errorMessage };
    }
  },
  
  // Fetch single user
  fetchUser: async (id) => {
    set({ loading: true, error: null });
    
    try {
      const response = await userAPI.getUser(id);
      set({
        currentUser: response.data.data,
        loading: false
      });
      return { success: true, data: response.data.data };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to fetch user';
      set({ error: errorMessage, loading: false });
      toast.error(errorMessage);
      return { success: false, message: errorMessage };
    }
  },
  
  // Create user
  createUser: async (userData) => {
    set({ loading: true, error: null });
    
    try {
      const response = await userAPI.createUser(userData);
      const newUser = response.data.data;
      
      set(state => ({
        users: [newUser, ...state.users],
        loading: false
      }));
      
      toast.success(response.data.message || 'User created successfully');
      return { success: true, data: newUser };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to create user';
      set({ error: errorMessage, loading: false });
      toast.error(errorMessage);
      return { success: false, message: errorMessage };
    }
  },
  
  // Update user
  updateUser: async (id, userData) => {
    set({ loading: true, error: null });
    
    try {
      const response = await userAPI.updateUser(id, userData);
      const updatedUser = response.data.data;
      
      set(state => ({
        users: state.users.map(u => u._id === id ? updatedUser : u),
        currentUser: updatedUser,
        loading: false
      }));
      
      toast.success(response.data.message || 'User updated successfully');
      return { success: true, data: updatedUser };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to update user';
      set({ error: errorMessage, loading: false });
      toast.error(errorMessage);
      return { success: false, message: errorMessage };
    }
  },
  
  // Delete user
  deleteUser: async (id) => {
    set({ loading: true, error: null });
    
    try {
      await userAPI.deleteUser(id);
      
      set(state => ({
        users: state.users.filter(u => u._id !== id),
        loading: false
      }));
      
      toast.success('User deleted successfully');
      return { success: true };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to delete user';
      set({ error: errorMessage, loading: false });
      toast.error(errorMessage);
      return { success: false, message: errorMessage };
    }
  },
  
  // Fetch user statistics
  fetchUserStats: async () => {
    set({ loading: true, error: null });
    
    try {
      const response = await userAPI.getUserStats();
      set({
        userStats: response.data.data,
        loading: false
      });
      return { success: true, data: response.data.data };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to fetch user statistics';
      set({ error: errorMessage, loading: false });
      return { success: false, message: errorMessage };
    }
  },
  
  // ==================== UTILITY METHODS ====================
  
  setFilters: (filters) => {
    const currentFilters = get().filters;
    const newFilters = { ...currentFilters, ...filters };
    set({ filters: newFilters });
    return get().fetchUsers(1, newFilters);
  },
  
  resetFilters: () => {
    const resetFilters = {
      search: '',
      role: '',
      isActive: '',
      sortBy: 'createdAt',
      sortOrder: 'desc'
    };
    set({ filters: resetFilters });
    return get().fetchUsers(1, resetFilters);
  },
  
  setPage: (page) => {
    const currentFilters = get().filters;
    return get().fetchUsers(page, currentFilters);
  },
  
  clearCurrentUser: () => {
    set({ currentUser: null });
  },
  
  clearError: () => {
    set({ error: null });
  },
  
  resetStore: () => {
    set({
      users: [],
      currentUser: null,
      userStats: null,
      profile: null,
      loading: false,
      error: null,
      pagination: {
        current: 1,
        total: 1,
        results: 0,
        limit: 10
      },
      filters: {
        search: '',
        role: '',
        isActive: '',
        sortBy: 'createdAt',
        sortOrder: 'desc'
      }
    });
  }
}));