// src/services/incomeAPI.js
import api from './api';

export const incomeAPI = {
  // ==================== INCOME SOURCES ====================
  // Get all income sources
  getIncomeSources: (params = {}) => {
    const { type, isActive = true } = params;
    return api.get('/income-sources', { params: { type, isActive } });
  },

  // Get single income source
  getIncomeSource: (id) => {
    return api.get(`/income-sources/${id}`);
  },

  // Create income source
  createIncomeSource: (data) => {
    return api.post('/income-sources', data);
  },

  // Update income source
  updateIncomeSource: (id, data) => {
    return api.put(`/income-sources/${id}`, data);
  },

  // Delete income source
  deleteIncomeSource: (id) => {
    return api.delete(`/income-sources/${id}`);
  },

  // Get income source types (enum)
  getIncomeSourceTypes: () => {
    return api.get('/income-sources/types');
  },

  // ==================== INCOME TRANSACTIONS ====================
  // Get all income transactions
  getIncomeTransactions: (params = {}) => {
    const {
      page = 1,
      limit = 20,
      sourceType,
      status,
      startDate,
      endDate,
      search,
      sortBy = 'incomeDate',
      sortOrder = 'desc'
    } = params;
    
    return api.get('/income', {
      params: {
        page,
        limit,
        sourceType,
        status,
        startDate,
        endDate,
        search,
        sortBy,
        sortOrder
      }
    });
  },

  // Get single income transaction
  getIncomeTransaction: (id) => {
    return api.get(`/income/${id}`);
  },

  // Create income transaction
  createIncomeTransaction: (data) => {
    return api.post('/income', data);
  },

  // Update income transaction
  updateIncomeTransaction: (id, data) => {
    return api.put(`/income/${id}`, data);
  },

  // Delete income transaction
  deleteIncomeTransaction: (id) => {
    return api.delete(`/income/${id}`);
  },

  // Allocate income to expenses
  allocateIncome: (id, amount) => {
    return api.post(`/income/${id}/allocate`, { amount });
  },

  // Get income statistics
  getIncomeStats: (params = {}) => {
    const { startDate, endDate } = params;
    return api.get('/income/stats', { params: { startDate, endDate } });
  },

  // Get income by source type
  getIncomeBySource: (sourceType, params = {}) => {
    const { startDate, endDate, limit = 50 } = params;
    return api.get(`/income/by-source/${sourceType}`, {
      params: { startDate, endDate, limit }
    });
  }
};

export default incomeAPI;