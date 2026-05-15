// src/stores/incomeStore.js
import { create } from 'zustand';
import { incomeAPI } from '../services/incomeAPI';
import toast from 'react-hot-toast';

export const useIncomeStore = create((set, get) => ({
  // ==================== STATE ====================
  // Income Sources
  incomeSources: [],
  incomeSourceTypes: [],
  currentIncomeSource: null,
  
  // Income Transactions
  incomeTransactions: [],
  currentIncomeTransaction: null,
  incomeStats: null,
  incomeBySource: null,
  
  // UI State
  loading: false,
  error: null,
  
  // Pagination & Filters
  pagination: {
    current: 1,
    total: 1,
    results: 0,
    limit: 20
  },
  filters: {
    sourceType: '',
    status: '',
    startDate: '',
    endDate: '',
    search: '',
    sortBy: 'incomeDate',
    sortOrder: 'desc'
  },
  summary: {
    totalAmount: 0,
    totalTransactions: 0,
    averageAmount: 0,
    bySourceType: []
  },

  // ==================== INCOME SOURCES ACTIONS ====================
  fetchIncomeSources: async (params = {}) => {
    set({ loading: true, error: null });
    
    try {
      const response = await incomeAPI.getIncomeSources(params);
      set({
        incomeSources: response.data.data || [],
        loading: false
      });
      return { success: true, data: response.data.data };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to fetch income sources';
      set({ error: errorMessage, loading: false });
      toast.error(errorMessage);
      return { success: false, message: errorMessage };
    }
  },

  fetchIncomeSourceTypes: async () => {
    set({ loading: true, error: null });
    
    try {
      const response = await incomeAPI.getIncomeSourceTypes();
      set({
        incomeSourceTypes: response.data.data || [],
        loading: false
      });
      return { success: true, data: response.data.data };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to fetch income source types';
      set({ error: errorMessage, loading: false });
      return { success: false, message: errorMessage };
    }
  },

  createIncomeSource: async (data) => {
    set({ loading: true, error: null });
    
    try {
      const response = await incomeAPI.createIncomeSource(data);
      const newSource = response.data.data;
      
      set(state => ({
        incomeSources: [newSource, ...state.incomeSources],
        loading: false
      }));
      
      toast.success(response.data.message || 'Income source created successfully');
      return { success: true, data: newSource };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to create income source';
      set({ error: errorMessage, loading: false });
      toast.error(errorMessage);
      return { success: false, message: errorMessage };
    }
  },

  updateIncomeSource: async (id, data) => {
    set({ loading: true, error: null });
    
    try {
      const response = await incomeAPI.updateIncomeSource(id, data);
      const updatedSource = response.data.data;
      
      set(state => ({
        incomeSources: state.incomeSources.map(s => s._id === id ? updatedSource : s),
        currentIncomeSource: updatedSource,
        loading: false
      }));
      
      toast.success(response.data.message || 'Income source updated successfully');
      return { success: true, data: updatedSource };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to update income source';
      set({ error: errorMessage, loading: false });
      toast.error(errorMessage);
      return { success: false, message: errorMessage };
    }
  },

  deleteIncomeSource: async (id) => {
    set({ loading: true, error: null });
    
    try {
      await incomeAPI.deleteIncomeSource(id);
      
      set(state => ({
        incomeSources: state.incomeSources.filter(s => s._id !== id),
        loading: false
      }));
      
      toast.success('Income source deleted successfully');
      return { success: true };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to delete income source';
      set({ error: errorMessage, loading: false });
      toast.error(errorMessage);
      return { success: false, message: errorMessage };
    }
  },

  // ==================== INCOME TRANSACTIONS ACTIONS ====================
  fetchIncomeTransactions: async (filters = {}) => {
    set({ loading: true, error: null });
    
    try {
      const mergedFilters = { ...get().filters, ...filters };
      const response = await incomeAPI.getIncomeTransactions(mergedFilters);
      
      set({
        incomeTransactions: response.data.data || [],
        pagination: response.data.pagination || {
          current: mergedFilters.page || 1,
          total: 1,
          results: 0,
          limit: mergedFilters.limit || 20
        },
        summary: response.data.summary || {
          totalAmount: 0,
          totalTransactions: 0,
          averageAmount: 0,
          bySourceType: []
        },
        filters: mergedFilters,
        loading: false
      });
      
      return { success: true, data: response.data.data };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to fetch income transactions';
      set({ error: errorMessage, loading: false });
      toast.error(errorMessage);
      return { success: false, message: errorMessage };
    }
  },

  fetchIncomeTransaction: async (id) => {
    set({ loading: true, error: null });
    
    try {
      const response = await incomeAPI.getIncomeTransaction(id);
      
      set({
        currentIncomeTransaction: response.data.data,
        loading: false
      });
      
      return { success: true, data: response.data.data };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to fetch income transaction';
      set({ error: errorMessage, loading: false });
      toast.error(errorMessage);
      return { success: false, message: errorMessage };
    }
  },

  createIncomeTransaction: async (data) => {
    set({ loading: true, error: null });
    
    try {
      const response = await incomeAPI.createIncomeTransaction(data);
      const newTransaction = response.data.data;
      
      set(state => ({
        incomeTransactions: [newTransaction, ...state.incomeTransactions],
        loading: false
      }));
      
      toast.success(response.data.message || 'Income recorded successfully');
      return { success: true, data: newTransaction };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to record income';
      set({ error: errorMessage, loading: false });
      toast.error(errorMessage);
      return { success: false, message: errorMessage };
    }
  },

  updateIncomeTransaction: async (id, data) => {
    set({ loading: true, error: null });
    
    try {
      const response = await incomeAPI.updateIncomeTransaction(id, data);
      const updatedTransaction = response.data.data;
      
      set(state => ({
        incomeTransactions: state.incomeTransactions.map(t => t._id === id ? updatedTransaction : t),
        currentIncomeTransaction: updatedTransaction,
        loading: false
      }));
      
      toast.success(response.data.message || 'Income updated successfully');
      return { success: true, data: updatedTransaction };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to update income';
      set({ error: errorMessage, loading: false });
      toast.error(errorMessage);
      return { success: false, message: errorMessage };
    }
  },

  deleteIncomeTransaction: async (id) => {
    set({ loading: true, error: null });
    
    try {
      await incomeAPI.deleteIncomeTransaction(id);
      
      set(state => ({
        incomeTransactions: state.incomeTransactions.filter(t => t._id !== id),
        loading: false
      }));
      
      toast.success('Income deleted successfully');
      return { success: true };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to delete income';
      set({ error: errorMessage, loading: false });
      toast.error(errorMessage);
      return { success: false, message: errorMessage };
    }
  },

  allocateIncome: async (id, amount) => {
    set({ loading: true, error: null });
    
    try {
      const response = await incomeAPI.allocateIncome(id, amount);
      
      set(state => ({
        incomeTransactions: state.incomeTransactions.map(t => 
          t._id === id ? response.data.data : t
        ),
        currentIncomeTransaction: response.data.data,
        loading: false
      }));
      
      toast.success(response.data.message || 'Income allocated successfully');
      return { success: true, data: response.data.data };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to allocate income';
      set({ error: errorMessage, loading: false });
      toast.error(errorMessage);
      return { success: false, message: errorMessage };
    }
  },

  fetchIncomeStats: async (params = {}) => {
    set({ loading: true, error: null });
    
    try {
      const response = await incomeAPI.getIncomeStats(params);
      
      set({
        incomeStats: response.data.data,
        loading: false
      });
      
      return { success: true, data: response.data.data };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to fetch income statistics';
      set({ error: errorMessage, loading: false });
      return { success: false, message: errorMessage };
    }
  },

  fetchIncomeBySource: async (sourceType, params = {}) => {
    set({ loading: true, error: null });
    
    try {
      const response = await incomeAPI.getIncomeBySource(sourceType, params);
      
      set({
        incomeBySource: response.data.data,
        loading: false
      });
      
      return { success: true, data: response.data.data };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to fetch income by source';
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
        sourceType: '',
        status: '',
        startDate: '',
        endDate: '',
        search: '',
        sortBy: 'incomeDate',
        sortOrder: 'desc'
      },
      pagination: {
        current: 1,
        total: 1,
        results: 0,
        limit: 20
      }
    });
  },

  setPage: (page) => {
    set({ filters: { ...get().filters, page } });
  },

  clearCurrentIncomeTransaction: () => {
    set({ currentIncomeTransaction: null });
  },

  clearIncomeStats: () => {
    set({ incomeStats: null });
  },

  clearError: () => {
    set({ error: null });
  },

  resetIncomeStore: () => {
    set({
      incomeSources: [],
      incomeSourceTypes: [],
      currentIncomeSource: null,
      incomeTransactions: [],
      currentIncomeTransaction: null,
      incomeStats: null,
      incomeBySource: null,
      loading: false,
      error: null,
      pagination: {
        current: 1,
        total: 1,
        results: 0,
        limit: 20
      },
      filters: {
        sourceType: '',
        status: '',
        startDate: '',
        endDate: '',
        search: '',
        sortBy: 'incomeDate',
        sortOrder: 'desc'
      },
      summary: {
        totalAmount: 0,
        totalTransactions: 0,
        averageAmount: 0,
        bySourceType: []
      }
    });
  }
}));