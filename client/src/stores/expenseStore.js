// src/stores/expenseStore.js
import { create } from 'zustand';
import { expenseAPI } from '../services/expenseAPI';
import toast from 'react-hot-toast';

export const useExpenseStore = create((set, get) => ({
  // ==================== STATE ====================
  // Expense Categories
  expenseCategories: [],
  currentExpenseCategory: null,
  budgetSummary: null,
  categoriesByBudgetStatus: null,
  
  // Expenses
  expenses: [],
  currentExpense: null,
  expenseStats: null,
  expensesByCategory: null,
  
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
    status: '',
    category: '',
    vendor: '',
    startDate: '',
    endDate: '',
    search: '',
    sortBy: 'expenseDate',
    sortOrder: 'desc'
  },
  summary: {
    totalAmount: 0,
    totalExpenses: 0,
    averageAmount: 0,
    byStatus: []
  },

  // ==================== EXPENSE CATEGORIES ACTIONS ====================
  fetchExpenseCategories: async (params = {}) => {
    set({ loading: true, error: null });
    
    try {
      const mergedParams = { ...params };
      const response = await expenseAPI.getExpenseCategories(mergedParams);
      
      set({
        expenseCategories: response.data.data || [],
        loading: false
      });
      
      return { success: true, data: response.data.data };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to fetch expense categories';
      set({ error: errorMessage, loading: false });
      toast.error(errorMessage);
      return { success: false, message: errorMessage };
    }
  },

  fetchExpenseCategory: async (id) => {
    set({ loading: true, error: null });
    
    try {
      const response = await expenseAPI.getExpenseCategory(id);
      
      set({
        currentExpenseCategory: response.data.data,
        loading: false
      });
      
      return { success: true, data: response.data.data };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to fetch expense category';
      set({ error: errorMessage, loading: false });
      toast.error(errorMessage);
      return { success: false, message: errorMessage };
    }
  },

  createExpenseCategory: async (data) => {
    set({ loading: true, error: null });
    
    try {
      const response = await expenseAPI.createExpenseCategory(data);
      const newCategory = response.data.data;
      
      set(state => ({
        expenseCategories: [...state.expenseCategories, newCategory],
        loading: false
      }));
      
      toast.success(response.data.message || 'Expense category created successfully');
      return { success: true, data: newCategory };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to create expense category';
      set({ error: errorMessage, loading: false });
      toast.error(errorMessage);
      return { success: false, message: errorMessage };
    }
  },

  updateExpenseCategory: async (id, data) => {
    set({ loading: true, error: null });
    
    try {
      const response = await expenseAPI.updateExpenseCategory(id, data);
      const updatedCategory = response.data.data;
      
      set(state => ({
        expenseCategories: state.expenseCategories.map(c => c._id === id ? updatedCategory : c),
        currentExpenseCategory: updatedCategory,
        loading: false
      }));
      
      toast.success(response.data.message || 'Expense category updated successfully');
      return { success: true, data: updatedCategory };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to update expense category';
      set({ error: errorMessage, loading: false });
      toast.error(errorMessage);
      return { success: false, message: errorMessage };
    }
  },

  deleteExpenseCategory: async (id) => {
    set({ loading: true, error: null });
    
    try {
      await expenseAPI.deleteExpenseCategory(id);
      
      set(state => ({
        expenseCategories: state.expenseCategories.filter(c => c._id !== id),
        loading: false
      }));
      
      toast.success('Expense category deleted successfully');
      return { success: true };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to delete expense category';
      set({ error: errorMessage, loading: false });
      toast.error(errorMessage);
      return { success: false, message: errorMessage };
    }
  },

  // ==================== ONE-TIME BUDGET ACTIONS (NEW) ====================
  addOneTimeBudget: async (categoryId, data) => {
    set({ loading: true, error: null });
    
    try {
      const response = await expenseAPI.addOneTimeBudget(categoryId, data);
      const updatedCategory = response.data.data;
      
      set(state => ({
        expenseCategories: state.expenseCategories.map(c => 
          c._id === categoryId ? updatedCategory : c
        ),
        currentExpenseCategory: updatedCategory,
        loading: false
      }));
      
      toast.success(response.data.message || 'One-time budget added successfully');
      return { success: true, data: updatedCategory };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to add one-time budget';
      set({ error: errorMessage, loading: false });
      toast.error(errorMessage);
      return { success: false, message: errorMessage };
    }
  },

  updateOneTimeBudget: async (categoryId, budgetId, data) => {
    set({ loading: true, error: null });
    
    try {
      const response = await expenseAPI.updateOneTimeBudget(categoryId, budgetId, data);
      const updatedCategory = response.data.data;
      
      set(state => ({
        expenseCategories: state.expenseCategories.map(c => 
          c._id === categoryId ? updatedCategory : c
        ),
        currentExpenseCategory: updatedCategory,
        loading: false
      }));
      
      toast.success(response.data.message || 'One-time budget updated successfully');
      return { success: true, data: updatedCategory };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to update one-time budget';
      set({ error: errorMessage, loading: false });
      toast.error(errorMessage);
      return { success: false, message: errorMessage };
    }
  },

  deleteOneTimeBudget: async (categoryId, budgetId) => {
    set({ loading: true, error: null });
    
    try {
      const response = await expenseAPI.deleteOneTimeBudget(categoryId, budgetId);
      const updatedCategory = response.data.data;
      
      set(state => ({
        expenseCategories: state.expenseCategories.map(c => 
          c._id === categoryId ? updatedCategory : c
        ),
        currentExpenseCategory: updatedCategory,
        loading: false
      }));
      
      toast.success(response.data.message || 'One-time budget deleted successfully');
      return { success: true, data: updatedCategory };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to delete one-time budget';
      set({ error: errorMessage, loading: false });
      toast.error(errorMessage);
      return { success: false, message: errorMessage };
    }
  },

  fetchBudgetSummary: async (params = {}) => {
    set({ loading: true, error: null });
    
    try {
      const response = await expenseAPI.getBudgetSummary(params);
      
      set({
        budgetSummary: response.data.data,
        loading: false
      });
      
      return { success: true, data: response.data.data };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to fetch budget summary';
      set({ error: errorMessage, loading: false });
      return { success: false, message: errorMessage };
    }
  },

  fetchCategoriesByBudgetStatus: async (status) => {
    set({ loading: true, error: null });
    
    try {
      const response = await expenseAPI.getCategoriesByBudgetStatus(status);
      
      set({
        categoriesByBudgetStatus: response.data.data,
        loading: false
      });
      
      return { success: true, data: response.data.data };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to fetch categories by status';
      set({ error: errorMessage, loading: false });
      return { success: false, message: errorMessage };
    }
  },

  // ==================== EXPENSE ACTIONS ====================
  fetchExpenses: async (filters = {}) => {
    set({ loading: true, error: null });
    
    try {
      const mergedFilters = { ...get().filters, ...filters };
      const response = await expenseAPI.getExpenses(mergedFilters);
      
      set({
        expenses: response.data.data || [],
        pagination: response.data.pagination || {
          current: mergedFilters.page || 1,
          total: 1,
          results: 0,
          limit: mergedFilters.limit || 20
        },
        summary: response.data.summary || {
          totalAmount: 0,
          totalExpenses: 0,
          averageAmount: 0,
          byStatus: []
        },
        filters: mergedFilters,
        loading: false
      });
      
      return { success: true, data: response.data.data };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to fetch expenses';
      set({ error: errorMessage, loading: false });
      toast.error(errorMessage);
      return { success: false, message: errorMessage };
    }
  },

  fetchExpense: async (id) => {
    set({ loading: true, error: null });
    
    try {
      const response = await expenseAPI.getExpense(id);
      
      set({
        currentExpense: response.data.data,
        loading: false
      });
      
      return { success: true, data: response.data.data };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to fetch expense';
      set({ error: errorMessage, loading: false });
      toast.error(errorMessage);
      return { success: false, message: errorMessage };
    }
  },

  createExpense: async (data) => {
    set({ loading: true, error: null });
    
    try {
      const response = await expenseAPI.createExpense(data);
      const newExpense = response.data.data;
      
      set(state => ({
        expenses: [newExpense, ...state.expenses],
        loading: false
      }));
      
      toast.success(response.data.message || 'Expense created successfully');
      return { success: true, data: newExpense };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to create expense';
      set({ error: errorMessage, loading: false });
      toast.error(errorMessage);
      return { success: false, message: errorMessage };
    }
  },

  updateExpense: async (id, data) => {
    set({ loading: true, error: null });
    
    try {
      const response = await expenseAPI.updateExpense(id, data);
      const updatedExpense = response.data.data;
      
      set(state => ({
        expenses: state.expenses.map(e => e._id === id ? updatedExpense : e),
        currentExpense: updatedExpense,
        loading: false
      }));
      
      toast.success(response.data.message || 'Expense updated successfully');
      return { success: true, data: updatedExpense };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to update expense';
      set({ error: errorMessage, loading: false });
      toast.error(errorMessage);
      return { success: false, message: errorMessage };
    }
  },

  deleteExpense: async (id) => {
    set({ loading: true, error: null });
    
    try {
      await expenseAPI.deleteExpense(id);
      
      set(state => ({
        expenses: state.expenses.filter(e => e._id !== id),
        loading: false
      }));
      
      toast.success('Expense deleted successfully');
      return { success: true };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to delete expense';
      set({ error: errorMessage, loading: false });
      toast.error(errorMessage);
      return { success: false, message: errorMessage };
    }
  },

  submitForApproval: async (id) => {
    set({ loading: true, error: null });
    
    try {
      const response = await expenseAPI.submitForApproval(id);
      const submittedExpense = response.data.data;
      
      set(state => ({
        expenses: state.expenses.map(e => e._id === id ? submittedExpense : e),
        currentExpense: submittedExpense,
        loading: false
      }));
      
      toast.success(response.data.message || 'Expense submitted for approval successfully');
      return { success: true, data: submittedExpense };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to submit expense for approval';
      set({ error: errorMessage, loading: false });
      toast.error(errorMessage);
      return { success: false, message: errorMessage };
    }
  },

  approveExpense: async (id, comments) => {
    set({ loading: true, error: null });
    
    try {
      const response = await expenseAPI.approveExpense(id, comments);
      const approvedExpense = response.data.data;
      
      set(state => ({
        expenses: state.expenses.map(e => e._id === id ? approvedExpense : e),
        currentExpense: approvedExpense,
        loading: false
      }));
      
      toast.success(response.data.message || 'Expense approved successfully');
      return { success: true, data: approvedExpense };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to approve expense';
      set({ error: errorMessage, loading: false });
      toast.error(errorMessage);
      return { success: false, message: errorMessage };
    }
  },

  payExpense: async (id, data) => {
    set({ loading: true, error: null });
    
    try {
      const response = await expenseAPI.payExpense(id, data);
      const paidExpense = response.data.data;
      
      set(state => ({
        expenses: state.expenses.map(e => e._id === id ? paidExpense : e),
        currentExpense: paidExpense,
        loading: false
      }));
      
      toast.success(response.data.message || 'Expense marked as paid successfully');
      return { success: true, data: paidExpense };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to mark expense as paid';
      set({ error: errorMessage, loading: false });
      toast.error(errorMessage);
      return { success: false, message: errorMessage };
    }
  },

  fetchExpenseStats: async (params = {}) => {
    set({ loading: true, error: null });
    
    try {
      const response = await expenseAPI.getExpenseStats(params);
      
      set({
        expenseStats: response.data.data,
        loading: false
      });
      
      return { success: true, data: response.data.data };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to fetch expense statistics';
      set({ error: errorMessage, loading: false });
      return { success: false, message: errorMessage };
    }
  },

  fetchExpensesByCategory: async (categoryId, params = {}) => {
    set({ loading: true, error: null });
    
    try {
      const response = await expenseAPI.getExpensesByCategory(categoryId, params);
      
      set({
        expensesByCategory: response.data.data,
        loading: false
      });
      
      return { success: true, data: response.data.data };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to fetch expenses by category';
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
        status: '',
        category: '',
        vendor: '',
        startDate: '',
        endDate: '',
        search: '',
        sortBy: 'expenseDate',
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

  clearCurrentExpense: () => {
    set({ currentExpense: null });
  },

  clearCurrentExpenseCategory: () => {
    set({ currentExpenseCategory: null });
  },

  clearExpenseStats: () => {
    set({ expenseStats: null });
  },

  clearError: () => {
    set({ error: null });
  },

  // ==================== HELPER METHODS ====================
  getExpensesByStatus: (status) => {
    const { expenses } = get();
    return expenses.filter(e => e.status === status);
  },

  getPendingExpenses: () => {
    const { expenses } = get();
    return expenses.filter(e => e.status === 'pending');
  },

  getApprovedExpenses: () => {
    const { expenses } = get();
    return expenses.filter(e => e.status === 'approved');
  },

  getPaidExpenses: () => {
    const { expenses } = get();
    return expenses.filter(e => e.status === 'paid');
  },

  getTotalExpenseAmount: () => {
    const { expenses } = get();
    return expenses.reduce((sum, e) => sum + (e.totalAmount || 0), 0);
  },

  // ==================== RESET STORE ====================
  resetExpenseStore: () => {
    set({
      expenseCategories: [],
      currentExpenseCategory: null,
      budgetSummary: null,
      categoriesByBudgetStatus: null,
      expenses: [],
      currentExpense: null,
      expenseStats: null,
      expensesByCategory: null,
      loading: false,
      error: null,
      pagination: {
        current: 1,
        total: 1,
        results: 0,
        limit: 20
      },
      filters: {
        status: '',
        category: '',
        vendor: '',
        startDate: '',
        endDate: '',
        search: '',
        sortBy: 'expenseDate',
        sortOrder: 'desc'
      },
      summary: {
        totalAmount: 0,
        totalExpenses: 0,
        averageAmount: 0,
        byStatus: []
      }
    });
  }
}));