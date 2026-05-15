// frontend/src/stores/userStore.js
import { create } from "zustand";
import api from "../services/api";
import toast from "react-hot-toast";

export const useUserStore = create((set, get) => ({
  // State
  users: [],
  loading: false,
  error: null,

  // Fetch users with filters
  fetchUsers: async (filters = {}) => {
    set({ loading: true, error: null });
    
    try {
      const params = new URLSearchParams();
      if (filters.role) {
        if (Array.isArray(filters.role)) {
          filters.role.forEach(role => params.append('role', role));
        } else {
          params.append('role', filters.role);
        }
      }
      if (filters.isActive !== undefined) params.append('isActive', filters.isActive);
      
      const response = await api.get(`/users?${params.toString()}`);
      set({ users: response.data.data, loading: false });
      return response.data;
    } catch (error) {
      const errorMessage = error.response?.data?.message || "Failed to fetch users";
      set({ error: errorMessage, loading: false });
      toast.error(errorMessage);
      return { success: false, message: errorMessage };
    }
  },

  // Clear users
  clearUsers: () => {
    set({ users: [], error: null });
  }
}));