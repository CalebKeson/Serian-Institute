// src/stores/financialStore.js
import { create } from 'zustand';
import { financialAPI } from '../services/financialAPI';
import toast from 'react-hot-toast';

export const useFinancialStore = create((set, get) => ({
  // ==================== STATE ====================
  profitLoss: null,
  cashFlow: null,
  budgetVsActual: null,
  financialSummary: null,
  
  // UI State
  loading: false,
  error: null,
  
  // Filters
  filters: {
    startDate: '',
    endDate: '',
    groupBy: 'monthly',
    period: 'month',
    year: new Date().getFullYear(),
    date: new Date().toISOString().split('T')[0]
  },

  // ==================== PROFIT & LOSS ACTIONS ====================
  fetchProfitLoss: async (params = {}) => {
    set({ loading: true, error: null });
    
    try {
      const mergedParams = { ...get().filters, ...params };
      const response = await financialAPI.getProfitLoss(mergedParams);
      
      set({
        profitLoss: response.data.data,
        filters: { ...get().filters, ...mergedParams },
        loading: false
      });
      
      return { success: true, data: response.data.data };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to fetch profit & loss statement';
      set({ error: errorMessage, loading: false });
      toast.error(errorMessage);
      return { success: false, message: errorMessage };
    }
  },

  // ==================== CASH FLOW ACTIONS ====================
  fetchCashFlow: async (params = {}) => {
    set({ loading: true, error: null });
    
    try {
      const mergedParams = { ...get().filters, ...params };
      const response = await financialAPI.getCashFlow(mergedParams);
      
      set({
        cashFlow: response.data.data,
        filters: { ...get().filters, ...mergedParams },
        loading: false
      });
      
      return { success: true, data: response.data.data };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to fetch cash flow statement';
      set({ error: errorMessage, loading: false });
      toast.error(errorMessage);
      return { success: false, message: errorMessage };
    }
  },

  // ==================== BUDGET VS ACTUAL ACTIONS ====================
  fetchBudgetVsActual: async (params = {}) => {
    set({ loading: true, error: null });
    
    try {
      const mergedParams = { ...get().filters, ...params };
      const response = await financialAPI.getBudgetVsActual(mergedParams);
      
      set({
        budgetVsActual: response.data.data,
        filters: { ...get().filters, ...mergedParams },
        loading: false
      });
      
      return { success: true, data: response.data.data };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to fetch budget vs actual report';
      set({ error: errorMessage, loading: false });
      toast.error(errorMessage);
      return { success: false, message: errorMessage };
    }
  },

  // ==================== FINANCIAL SUMMARY ACTIONS ====================
  fetchFinancialSummary: async (params = {}) => {
    set({ loading: true, error: null });
    
    try {
      const mergedParams = { ...get().filters, ...params };
      const response = await financialAPI.getFinancialSummary(mergedParams);
      
      set({
        financialSummary: response.data.data,
        filters: { ...get().filters, ...mergedParams },
        loading: false
      });
      
      return { success: true, data: response.data.data };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to fetch financial summary';
      set({ error: errorMessage, loading: false });
      toast.error(errorMessage);
      return { success: false, message: errorMessage };
    }
  },

  // ==================== PERIOD SELECTOR ACTIONS ====================
  setPeriod: (period, date = new Date().toISOString().split('T')[0]) => {
    set({
      filters: {
        ...get().filters,
        period,
        date
      }
    });
    // Auto-refresh financial summary when period changes
    get().fetchFinancialSummary();
  },

  setDateRange: (startDate, endDate) => {
    set({
      filters: {
        ...get().filters,
        startDate,
        endDate
      }
    });
  },

  setGroupBy: (groupBy) => {
    set({
      filters: {
        ...get().filters,
        groupBy
      }
    });
  },

  setYear: (year) => {
    set({
      filters: {
        ...get().filters,
        year
      }
    });
  },

  // ==================== HELPER METHODS ====================
  getTotalIncome: () => {
    const { financialSummary } = get();
    return financialSummary?.income?.total || 0;
  },

  getTotalExpenses: () => {
    const { financialSummary } = get();
    return financialSummary?.expenses?.total || 0;
  },

  getNetProfit: () => {
    const { financialSummary } = get();
    return financialSummary?.profit?.net || 0;
  },

  getProfitMargin: () => {
    const { financialSummary } = get();
    return financialSummary?.profit?.margin || 0;
  },

  getIncomeBySource: () => {
    const { financialSummary } = get();
    return financialSummary?.income?.bySource || {};
  },

  getExpensesByCategory: () => {
    const { financialSummary } = get();
    return financialSummary?.expenses?.byCategory || {};
  },

  getDirectorLiabilities: () => {
    const { financialSummary } = get();
    return financialSummary?.liabilities?.director || 0;
  },

  getOperatingRatio: () => {
    const { financialSummary } = get();
    return financialSummary?.summary?.operatingRatio || 0;
  },

  // ==================== CHART DATA PREPARATION ====================
  getProfitLossChartData: () => {
    const { profitLoss } = get();
    
    if (!profitLoss?.breakdown) return [];
    
    return profitLoss.breakdown.map(period => ({
      period: period.period,
      income: period.income,
      expenses: period.expenses,
      profit: period.profit
    }));
  },

  getCashFlowChartData: () => {
    const { cashFlow } = get();
    
    if (!cashFlow?.cashFlow) return [];
    
    return cashFlow.cashFlow.map(period => ({
      period: period.period,
      inflows: period.inflows,
      outflows: period.outflows,
      net: period.netCashFlow
    }));
  },

  getBudgetVsActualChartData: () => {
    const { budgetVsActual } = get();
    
    if (!budgetVsActual?.monthlyTotals) return [];
    
    return budgetVsActual.monthlyTotals.map(month => ({
      month: month.month,
      budget: month.totalBudget,
      actual: month.totalActual,
      variance: month.variance
    }));
  },

  getTopIncomeSources: (limit = 5) => {
    const incomeBySource = get().getIncomeBySource();
    
    return Object.entries(incomeBySource)
      .map(([source, amount]) => ({ source, amount }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, limit);
  },

  getTopExpenseCategories: (limit = 5) => {
    const expensesByCategory = get().getExpensesByCategory();
    
    return Object.entries(expensesByCategory)
      .map(([category, amount]) => ({ category, amount }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, limit);
  },

  // ==================== UTILITY ACTIONS ====================
  clearFilters: () => {
    set({
      filters: {
        startDate: '',
        endDate: '',
        groupBy: 'monthly',
        period: 'month',
        year: new Date().getFullYear(),
        date: new Date().toISOString().split('T')[0]
      }
    });
  },

  clearError: () => {
    set({ error: null });
  },

  clearAll: () => {
    set({
      profitLoss: null,
      cashFlow: null,
      budgetVsActual: null,
      financialSummary: null,
      loading: false,
      error: null,
      filters: {
        startDate: '',
        endDate: '',
        groupBy: 'monthly',
        period: 'month',
        year: new Date().getFullYear(),
        date: new Date().toISOString().split('T')[0]
      }
    });
  },

  // ==================== REFRESH ALL REPORTS ====================
  refreshAllReports: async () => {
    set({ loading: true });
    
    try {
      const { filters } = get();
      
      await Promise.all([
        get().fetchProfitLoss(),
        get().fetchCashFlow(),
        get().fetchBudgetVsActual(),
        get().fetchFinancialSummary()
      ]);
      
      set({ loading: false });
      toast.success('All reports refreshed');
      return { success: true };
    } catch (error) {
      set({ loading: false });
      toast.error('Failed to refresh some reports');
      return { success: false };
    }
  },

  // ==================== EXPORT FUNCTIONS ====================
  getProfitLossForExport: () => {
    const { profitLoss } = get();
    
    if (!profitLoss?.breakdown) return [];
    
    return profitLoss.breakdown.map(period => ({
      Period: period.period,
      Income: period.income,
      Expenses: period.expenses,
      Profit: period.profit,
      'Profit Margin (%)': period.profitMargin.toFixed(2)
    }));
  },

  getCashFlowForExport: () => {
    const { cashFlow } = get();
    
    if (!cashFlow?.cashFlow) return [];
    
    return cashFlow.cashFlow.map(period => ({
      Period: period.period,
      'Cash Inflows': period.inflows,
      'Cash Outflows': period.outflows,
      'Net Cash Flow': period.netCashFlow,
      'Closing Balance': period.closingBalance
    }));
  },

  getBudgetVsActualForExport: () => {
    const { budgetVsActual } = get();
    
    if (!budgetVsActual?.categorySummary) return [];
    
    return budgetVsActual.categorySummary.map(category => ({
      Category: category.categoryName,
      Budget: category.budgetAmount,
      Actual: category.actualAmount,
      Variance: category.variance,
      'Variance (%)': category.variancePercentage.toFixed(2)
    }));
  },

  // ==================== RESET STORE ====================
  resetFinancialStore: () => {
    set({
      profitLoss: null,
      cashFlow: null,
      budgetVsActual: null,
      financialSummary: null,
      loading: false,
      error: null,
      filters: {
        startDate: '',
        endDate: '',
        groupBy: 'monthly',
        period: 'month',
        year: new Date().getFullYear(),
        date: new Date().toISOString().split('T')[0]
      }
    });
  }
}));