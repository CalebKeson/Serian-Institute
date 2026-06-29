// frontend/src/stores/referralStore.js

import { create } from 'zustand';
import { referralAPI } from '../services/referralAPI';
import toast from 'react-hot-toast';

export const useReferralStore = create((set, get) => ({
  // State
  referrers: [],
  currentReferrer: null,
  leaderboard: [],
  referralStats: null,
  loading: false,
  error: null,

  // Pagination
  pagination: {
    current: 1,
    total: 1,
    results: 0,
    limit: 10
  },

  // Filters
  filters: {
    search: '',
    type: '',
    isActive: true
  },

  // Fetch all referrers
  fetchReferrers: async (page = 1, filters = {}) => {
    set({ loading: true, error: null });

    try {
      const mergedFilters = { ...get().filters, ...filters, page };
      const response = await referralAPI.getReferrers(mergedFilters);

      set({
        referrers: response.data.data || [],
        pagination: response.data.pagination || {
          current: page,
          total: 1,
          results: 0,
          limit: 10
        },
        filters: mergedFilters,
        loading: false
      });

      return { success: true, data: response.data.data };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to fetch referrers';
      set({ error: errorMessage, loading: false });
      toast.error(errorMessage);
      return { success: false, message: errorMessage };
    }
  },

  // Fetch single referrer
  fetchReferrer: async (id) => {
    set({ loading: true, error: null });

    try {
      const response = await referralAPI.getReferrer(id);

      set({
        currentReferrer: response.data.data,
        loading: false
      });

      return { success: true, data: response.data.data };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to fetch referrer';
      set({ error: errorMessage, loading: false });
      toast.error(errorMessage);
      return { success: false, message: errorMessage };
    }
  },

  // Fetch referrer by code (public)
  fetchReferrerByCode: async (code) => {
    set({ loading: true, error: null });

    try {
      const response = await referralAPI.getReferrerByCode(code);

      set({
        currentReferrer: response.data.data,
        loading: false
      });

      return { success: true, data: response.data.data };
    } catch (error) {
      set({ error: null, loading: false });
      return { success: false, message: 'Invalid referral code' };
    }
  },

  // Create referrer
  createReferrer: async (data) => {
    set({ loading: true, error: null });

    try {
      const response = await referralAPI.createReferrer(data);
      const newReferrer = response.data.data;

      set(state => ({
        referrers: [newReferrer, ...state.referrers],
        loading: false
      }));

      toast.success(response.data.message || 'Referrer created successfully');
      return { success: true, data: newReferrer };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to create referrer';
      set({ error: errorMessage, loading: false });
      toast.error(errorMessage);
      return { success: false, message: errorMessage };
    }
  },

  // Update referrer
  updateReferrer: async (id, data) => {
    set({ loading: true, error: null });

    try {
      const response = await referralAPI.updateReferrer(id, data);
      const updatedReferrer = response.data.data;

      set(state => ({
        referrers: state.referrers.map(r => r._id === id ? updatedReferrer : r),
        currentReferrer: updatedReferrer,
        loading: false
      }));

      toast.success(response.data.message || 'Referrer updated successfully');
      return { success: true, data: updatedReferrer };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to update referrer';
      set({ error: errorMessage, loading: false });
      toast.error(errorMessage);
      return { success: false, message: errorMessage };
    }
  },

  // Delete referrer
  deleteReferrer: async (id) => {
    set({ loading: true, error: null });

    try {
      await referralAPI.deleteReferrer(id);

      set(state => ({
        referrers: state.referrers.filter(r => r._id !== id),
        loading: false
      }));

      toast.success('Referrer deleted successfully');
      return { success: true };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to delete referrer';
      set({ error: errorMessage, loading: false });
      toast.error(errorMessage);
      return { success: false, message: errorMessage };
    }
  },

  // Fetch leaderboard
  fetchLeaderboard: async (params = {}) => {
    set({ loading: true, error: null });

    try {
      const response = await referralAPI.getLeaderboard(params);

      set({
        leaderboard: response.data.data?.leaderboard || [],
        loading: false
      });

      return { success: true, data: response.data.data };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to fetch leaderboard';
      set({ error: errorMessage, loading: false });
      return { success: false, message: errorMessage };
    }
  },

  // Record bonus payment
  recordBonusPayment: async (id, data) => {
    set({ loading: true, error: null });

    try {
      const response = await referralAPI.recordBonusPayment(id, data);

      set(state => ({
        referrers: state.referrers.map(r => r._id === id ? response.data.data : r),
        currentReferrer: response.data.data,
        loading: false
      }));

      toast.success(response.data.message || 'Bonus payment recorded');
      return { success: true, data: response.data.data };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to record bonus payment';
      set({ error: errorMessage, loading: false });
      toast.error(errorMessage);
      return { success: false, message: errorMessage };
    }
  },

  // Fetch referral statistics
  fetchReferralStats: async () => {
    set({ loading: true, error: null });

    try {
      const response = await referralAPI.getReferralStats();

      set({
        referralStats: response.data.data,
        loading: false
      });

      return { success: true, data: response.data.data };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to fetch referral stats';
      set({ error: errorMessage, loading: false });
      return { success: false, message: errorMessage };
    }
  },

  // Generate referral code
  generateReferralCode: async (id) => {
    set({ loading: true, error: null });

    try {
      const response = await referralAPI.generateReferralCode(id);

      set(state => ({
        referrers: state.referrers.map(r => r._id === id ? response.data.data : r),
        currentReferrer: response.data.data,
        loading: false
      }));

      toast.success(response.data.message || 'Referral code generated');
      return { success: true, data: response.data.data };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to generate referral code';
      set({ error: errorMessage, loading: false });
      toast.error(errorMessage);
      return { success: false, message: errorMessage };
    }
  },

  // Set filters
  setFilters: (filters) => {
    set({ filters: { ...get().filters, ...filters } });
  },

  // Reset filters
  resetFilters: () => {
    set({
      filters: {
        search: '',
        type: '',
        isActive: true
      }
    });
  },

  // Clear error
  clearError: () => {
    set({ error: null });
  },

  // Reset store
  resetReferralStore: () => {
    set({
      referrers: [],
      currentReferrer: null,
      leaderboard: [],
      referralStats: null,
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
        type: '',
        isActive: true
      }
    });
  }
}));