// src/services/financialAPI.js
import api from './api';

export const financialAPI = {
  // Get profit & loss statement
  getProfitLoss: (params = {}) => {
    const { startDate, endDate, groupBy = 'monthly' } = params;
    return api.get('/financial/profit-loss', { params: { startDate, endDate, groupBy } });
  },

  // Get cash flow statement
  getCashFlow: (params = {}) => {
    const { startDate, endDate, groupBy = 'monthly' } = params;
    return api.get('/financial/cash-flow', { params: { startDate, endDate, groupBy } });
  },

  // Get budget vs actual report
  getBudgetVsActual: (params = {}) => {
    const { period = 'monthly', year = new Date().getFullYear() } = params;
    return api.get('/financial/budget-vs-actual', { params: { period, year } });
  },

  // Get financial summary for dashboard
  getFinancialSummary: (params = {}) => {
    const { period = 'month', date = new Date().toISOString().split('T')[0] } = params;
    return api.get('/financial/summary', { params: { period, date } });
  }
};

export default financialAPI;