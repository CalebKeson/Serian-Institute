// src/stores/directorStore.js
import { create } from 'zustand';
import { directorAPI } from '../services/directorAPI';
import toast from 'react-hot-toast';

export const useDirectorStore = create((set, get) => ({
  // ==================== STATE ====================
  directors: [],
  currentDirector: null,
  directorSummary: null,
  loading: false,
  error: null,
  
  // Filters
  filters: {
    isActive: true,
    search: ''
  },

  // ==================== DIRECTOR ACTIONS ====================
  fetchDirectors: async (params = {}) => {
    set({ loading: true, error: null });
    
    try {
      const mergedFilters = { ...get().filters, ...params };
      const response = await directorAPI.getDirectors(mergedFilters);
      
      set({
        directors: response.data.data || [],
        filters: mergedFilters,
        loading: false
      });
      
      return { success: true, data: response.data.data };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to fetch directors';
      set({ error: errorMessage, loading: false });
      toast.error(errorMessage);
      return { success: false, message: errorMessage };
    }
  },

  fetchDirector: async (id) => {
    set({ loading: true, error: null });
    
    try {
      const response = await directorAPI.getDirector(id);
      
      set({
        currentDirector: response.data.data,
        loading: false
      });
      
      return { success: true, data: response.data.data };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to fetch director';
      set({ error: errorMessage, loading: false });
      toast.error(errorMessage);
      return { success: false, message: errorMessage };
    }
  },

  createDirector: async (data) => {
    set({ loading: true, error: null });
    
    try {
      const response = await directorAPI.createDirector(data);
      const newDirector = response.data.data;
      
      set(state => ({
        directors: [newDirector, ...state.directors],
        loading: false
      }));
      
      toast.success(response.data.message || 'Director created successfully');
      return { success: true, data: newDirector };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to create director';
      set({ error: errorMessage, loading: false });
      toast.error(errorMessage);
      return { success: false, message: errorMessage };
    }
  },

  updateDirector: async (id, data) => {
    set({ loading: true, error: null });
    
    try {
      const response = await directorAPI.updateDirector(id, data);
      const updatedDirector = response.data.data;
      
      set(state => ({
        directors: state.directors.map(d => d._id === id ? updatedDirector : d),
        currentDirector: updatedDirector,
        loading: false
      }));
      
      toast.success(response.data.message || 'Director updated successfully');
      return { success: true, data: updatedDirector };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to update director';
      set({ error: errorMessage, loading: false });
      toast.error(errorMessage);
      return { success: false, message: errorMessage };
    }
  },

  deleteDirector: async (id) => {
    set({ loading: true, error: null });
    
    try {
      await directorAPI.deleteDirector(id);
      
      set(state => ({
        directors: state.directors.filter(d => d._id !== id),
        loading: false
      }));
      
      toast.success('Director deleted successfully');
      return { success: true };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to delete director';
      set({ error: errorMessage, loading: false });
      toast.error(errorMessage);
      return { success: false, message: errorMessage };
    }
  },

  // ==================== INVESTMENT ACTIONS ====================
  recordInvestment: async (id, data) => {
    set({ loading: true, error: null });
    
    try {
      const response = await directorAPI.recordInvestment(id, data);
      
      // Update the director in the list with new investment data
      const updatedDirector = response.data.data.director;
      
      set(state => ({
        directors: state.directors.map(d => d._id === id ? updatedDirector : d),
        currentDirector: updatedDirector,
        loading: false
      }));
      
      toast.success(response.data.message || 'Investment recorded successfully');
      return { success: true, data: response.data.data };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to record investment';
      set({ error: errorMessage, loading: false });
      toast.error(errorMessage);
      return { success: false, message: errorMessage };
    }
  },

  recordRepayment: async (id, data) => {
    set({ loading: true, error: null });
    
    try {
      const response = await directorAPI.recordRepayment(id, data);
      
      // Update the director in the list with updated repayment data
      const updatedDirector = response.data.data.director;
      
      set(state => ({
        directors: state.directors.map(d => d._id === id ? updatedDirector : d),
        currentDirector: updatedDirector,
        loading: false
      }));
      
      toast.success(response.data.message || 'Repayment recorded successfully');
      return { success: true, data: response.data.data };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to record repayment';
      set({ error: errorMessage, loading: false });
      toast.error(errorMessage);
      return { success: false, message: errorMessage };
    }
  },

  // ==================== SUMMARY ACTIONS ====================
  fetchDirectorSummary: async () => {
    set({ loading: true, error: null });
    
    try {
      const response = await directorAPI.getDirectorSummary();
      
      set({
        directorSummary: response.data.data,
        loading: false
      });
      
      return { success: true, data: response.data.data };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to fetch director summary';
      set({ error: errorMessage, loading: false });
      return { success: false, message: errorMessage };
    }
  },

  // ==================== UTILITY ACTIONS ====================
  setFilters: (filters) => {
    set({ filters: { ...get().filters, ...filters } });
  },

  resetFilters: () => {
    set({
      filters: {
        isActive: true,
        search: ''
      }
    });
  },

  clearCurrentDirector: () => {
    set({ currentDirector: null });
  },

  clearError: () => {
    set({ error: null });
  },

  // ==================== HELPER METHODS ====================
  getDirectorsByRole: (role) => {
    const { directors } = get();
    return directors.filter(d => d.role === role);
  },

  getActiveDirectors: () => {
    const { directors } = get();
    return directors.filter(d => d.isActive);
  },

  getTotalInvestment: () => {
    const { directors } = get();
    return directors.reduce((sum, d) => sum + (d.totalInvested || 0), 0);
  },

  getTotalOutstanding: () => {
    const { directors } = get();
    return directors.reduce((sum, d) => sum + (d.outstandingBalance || 0), 0);
  },

  // ==================== RESET STORE ====================
  resetDirectorStore: () => {
    set({
      directors: [],
      currentDirector: null,
      directorSummary: null,
      loading: false,
      error: null,
      filters: {
        isActive: true,
        search: ''
      }
    });
  }
}));