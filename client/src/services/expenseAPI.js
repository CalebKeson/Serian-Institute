// src/services/expenseAPI.js
import api from './api';

export const expenseAPI = {
  // ==================== EXPENSE CATEGORIES ====================
  getExpenseCategories: (params = {}) => {
    const { isActive = true, parentCategory, search = '' } = params;
    return api.get('/expense-categories', { params: { isActive, parentCategory, search } });
  },

  getExpenseCategory: (id) => {
    return api.get(`/expense-categories/${id}`);
  },

  createExpenseCategory: (data) => {
    return api.post('/expense-categories', data);
  },

  updateExpenseCategory: (id, data) => {
    return api.put(`/expense-categories/${id}`, data);
  },

  deleteExpenseCategory: (id) => {
    return api.delete(`/expense-categories/${id}`);
  },

  getBudgetSummary: (params = {}) => {
    const { period = 'monthly' } = params;
    return api.get('/expense-categories/budget/summary', { params: { period } });
  },

  getCategoriesByBudgetStatus: (status) => {
    return api.get(`/expense-categories/budget/status/${status}`);
  },

  // ==================== ONE-TIME BUDGET ENDPOINTS (NEW) ====================
  addOneTimeBudget: (categoryId, data) => {
    return api.post(`/expense-categories/${categoryId}/one-time-budget`, data);
  },

  updateOneTimeBudget: (categoryId, budgetId, data) => {
    return api.put(`/expense-categories/${categoryId}/one-time-budget/${budgetId}`, data);
  },

  deleteOneTimeBudget: (categoryId, budgetId) => {
    return api.delete(`/expense-categories/${categoryId}/one-time-budget/${budgetId}`);
  },

  // ==================== EXPENSES ====================
  getExpenses: (params = {}) => {
    const {
      page = 1,
      limit = 20,
      status,
      category,
      vendor,
      startDate,
      endDate,
      search,
      sortBy = 'expenseDate',
      sortOrder = 'desc'
    } = params;
    
    return api.get('/expenses', {
      params: {
        page,
        limit,
        status,
        category,
        vendor,
        startDate,
        endDate,
        search,
        sortBy,
        sortOrder
      }
    });
  },

  getExpense: (id) => {
    return api.get(`/expenses/${id}`);
  },

  createExpense: (data) => {
    return api.post('/expenses', data);
  },

  updateExpense: (id, data) => {
    return api.put(`/expenses/${id}`, data);
  },

  deleteExpense: (id) => {
    return api.delete(`/expenses/${id}`);
  },

  approveExpense: (id, comments) => {
    return api.post(`/expenses/${id}/approve`, { comments });
  },

  payExpense: (id, data) => {
    return api.post(`/expenses/${id}/pay`, data);
  },

  submitForApproval: (id) => {
    return api.post(`/expenses/${id}/submit`);
  },

  getExpenseStats: (params = {}) => {
    const { startDate, endDate } = params;
    return api.get('/expenses/stats', { params: { startDate, endDate } });
  },

  getExpensesByCategory: (categoryId, params = {}) => {
    const { startDate, endDate, limit = 50 } = params;
    return api.get(`/expenses/by-category/${categoryId}`, {
      params: { startDate, endDate, limit }
    });
  }
};

export default expenseAPI;