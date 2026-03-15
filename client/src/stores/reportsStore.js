// src/stores/reportsStore.js
import { create } from 'zustand';
import { reportsAPI } from '../services/reportsAPI';
import toast from 'react-hot-toast';

export const useReportsStore = create((set, get) => ({
  // ============= STATE =============
  
  // Collection Report
  collectionReport: {
    summary: {
      totalAmount: 0,
      totalPayments: 0,
      averageAmount: 0,
      methodTotals: {}
    },
    details: []
  },
  
  // Outstanding Report
  outstandingReport: {
    summary: {
      totalStudents: 0,
      totalOutstanding: 0,
      averageOutstanding: 0,
      unpaidCount: 0,
      partialCount: 0
    },
    students: []
  },

  // Student Fee Status
  allStudentsFeeStatus: [],
  
  // Course Payment Reports
  coursePaymentReport: {
    summary: null,
    students: []
  },
  
  // Analysis Data
  paymentMethodAnalysis: [],
  paymentPurposeAnalysis: [],
  dailyTrend: [],
  monthlyTrend: [],
  
  // Comparison Data
  periodComparison: {
    currentPeriod: { total: 0, payments: 0, average: 0 },
    previousPeriod: { total: 0, payments: 0, average: 0 },
    change: { amount: 0, percentage: 0, trend: 'stable' }
  },
  
  // Defaulters
  defaultersReport: {
    threshold: 50,
    count: 0,
    totalOutstanding: 0,
    students: []
  },
  criticalDefaulters: {
    count: 0,
    students: []
  },

  // UI State
  loading: false,
  error: null,
  selectedReportType: 'collection',
  dateRange: {
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  },
  filters: {
    groupBy: 'day',
    status: '',
    courseId: '',
    search: '',
    minBalance: 0
  },
  pagination: {
    current: 1,
    total: 1,
    results: 0,
    limit: 20
  },

  // Available options
  dateRangeOptions: reportsAPI.getDateRangeOptions(),
  reportTypes: reportsAPI.getReportTypes(),

  // ============= COLLECTION REPORT ACTIONS =============

  fetchCollectionReport: async (params = {}) => {
    set({ loading: true, error: null });

    try {
      const { startDate, endDate, groupBy } = { 
        ...get().dateRange, 
        ...get().filters,
        ...params 
      };

      const response = await reportsAPI.getCollectionReport({
        startDate,
        endDate,
        groupBy
      });

      set({
        collectionReport: {
          summary: response.data.data?.summary || {
            totalAmount: 0,
            totalPayments: 0,
            averageAmount: 0,
            methodTotals: {}
          },
          details: response.data.data?.details || []
        },
        loading: false
      });

      return { success: true, data: response.data.data };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to fetch collection report';
      set({ error: errorMessage, loading: false });
      toast.error(errorMessage);
      return { success: false, message: errorMessage };
    }
  },

  exportCollectionReport: async (params = {}) => {
    set({ loading: true, error: null });

    try {
      const { startDate, endDate, groupBy } = { 
        ...get().dateRange, 
        ...get().filters,
        ...params 
      };

      const response = await reportsAPI.exportCollectionReport({
        startDate,
        endDate,
        groupBy
      });

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `collection_report_${startDate}_to_${endDate}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();

      set({ loading: false });
      toast.success('Collection report exported successfully!');
      return { success: true };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to export collection report';
      set({ error: errorMessage, loading: false });
      toast.error(errorMessage);
      return { success: false, message: errorMessage };
    }
  },

  // ============= OUTSTANDING REPORT ACTIONS =============

  fetchOutstandingReport: async (params = {}) => {
    set({ loading: true, error: null });

    try {
      const { minBalance, courseId } = { ...get().filters, ...params };

      const response = await reportsAPI.getOutstandingReport({
        minBalance,
        courseId
      });

      set({
        outstandingReport: {
          summary: response.data.data?.summary || {
            totalStudents: 0,
            totalOutstanding: 0,
            averageOutstanding: 0,
            unpaidCount: 0,
            partialCount: 0
          },
          students: response.data.data?.students || []
        },
        loading: false
      });

      return { success: true, data: response.data.data };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to fetch outstanding report';
      set({ error: errorMessage, loading: false });
      toast.error(errorMessage);
      return { success: false, message: errorMessage };
    }
  },

  exportOutstandingReport: async (params = {}) => {
    set({ loading: true, error: null });

    try {
      const { minBalance, courseId } = { ...get().filters, ...params };

      const response = await reportsAPI.exportOutstandingReport({
        minBalance,
        courseId
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `outstanding_report_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();

      set({ loading: false });
      toast.success('Outstanding report exported successfully!');
      return { success: true };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to export outstanding report';
      set({ error: errorMessage, loading: false });
      toast.error(errorMessage);
      return { success: false, message: errorMessage };
    }
  },

  // ============= STUDENT FEE STATUS ACTIONS =============

  fetchAllStudentsFeeStatus: async (params = {}) => {
    set({ loading: true, error: null });

    try {
      const { status, courseId, search } = { ...get().filters, ...params };

      const response = await reportsAPI.getAllStudentsFeeStatus({
        status,
        courseId,
        search
      });

      set({
        allStudentsFeeStatus: response.data.data?.students || [],
        pagination: {
          current: 1,
          total: 1,
          results: response.data.data?.students?.length || 0,
          limit: 20
        },
        loading: false
      });

      return { success: true, data: response.data.data };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to fetch students fee status';
      set({ error: errorMessage, loading: false });
      toast.error(errorMessage);
      return { success: false, message: errorMessage };
    }
  },

  // ============= COURSE PAYMENT REPORT ACTIONS =============

  fetchCoursePaymentReport: async (courseId, params = {}) => {
    set({ loading: true, error: null });

    try {
      const { status, search } = { ...get().filters, ...params };

      const response = await reportsAPI.getCoursePaymentReport(courseId, {
        status,
        search
      });

      set({
        coursePaymentReport: {
          summary: response.data.data?.summary || null,
          students: response.data.data?.students || []
        },
        loading: false
      });

      return { success: true, data: response.data.data };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to fetch course payment report';
      set({ error: errorMessage, loading: false });
      toast.error(errorMessage);
      return { success: false, message: errorMessage };
    }
  },

  exportCoursePaymentReport: async (courseId, params = {}) => {
    set({ loading: true, error: null });

    try {
      const { status, search } = { ...get().filters, ...params };

      const response = await reportsAPI.exportCoursePaymentReport(courseId, {
        status,
        search
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `course_${courseId}_payment_report_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();

      set({ loading: false });
      toast.success('Course payment report exported successfully!');
      return { success: true };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to export course payment report';
      set({ error: errorMessage, loading: false });
      toast.error(errorMessage);
      return { success: false, message: errorMessage };
    }
  },

  // ============= ANALYSIS ACTIONS =============

  fetchPaymentAnalysis: async (params = {}) => {
    set({ loading: true, error: null });

    try {
      const { startDate, endDate } = { ...get().dateRange, ...params };

      const [methodRes, purposeRes, dailyRes, monthlyRes] = await Promise.all([
        reportsAPI.getPaymentMethodAnalysis({ startDate, endDate }),
        reportsAPI.getPaymentPurposeAnalysis({ startDate, endDate }),
        reportsAPI.getDailyCollectionTrend({ startDate, endDate }),
        reportsAPI.getMonthlyCollectionTrend({ startDate, endDate })
      ]);

      set({
        paymentMethodAnalysis: methodRes.data.data || [],
        paymentPurposeAnalysis: purposeRes.data.data || [],
        dailyTrend: dailyRes.data.data || [],
        monthlyTrend: monthlyRes.data.data || [],
        loading: false
      });

      return { success: true };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to fetch payment analysis';
      set({ error: errorMessage, loading: false });
      toast.error(errorMessage);
      return { success: false, message: errorMessage };
    }
  },

  // ============= COMPARISON ACTIONS =============

  comparePeriods: async (currentStart, currentEnd, previousStart, previousEnd) => {
    set({ loading: true, error: null });

    try {
      const response = await reportsAPI.comparePeriods({
        currentStart,
        currentEnd,
        previousStart,
        previousEnd
      });

      set({
        periodComparison: response.data.data,
        loading: false
      });

      return { success: true, data: response.data.data };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to compare periods';
      set({ error: errorMessage, loading: false });
      toast.error(errorMessage);
      return { success: false, message: errorMessage };
    }
  },

  // ============= DEFAULTERS ACTIONS =============

  fetchDefaultersByThreshold: async (threshold = 50, params = {}) => {
    set({ loading: true, error: null });

    try {
      const response = await reportsAPI.getDefaultersByThreshold(threshold, params);

      set({
        defaultersReport: response.data.data,
        loading: false
      });

      return { success: true, data: response.data.data };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to fetch defaulters';
      set({ error: errorMessage, loading: false });
      toast.error(errorMessage);
      return { success: false, message: errorMessage };
    }
  },

  fetchCriticalDefaulters: async (params = {}) => {
    set({ loading: true, error: null });

    try {
      const response = await reportsAPI.getCriticalDefaulters(params);

      set({
        criticalDefaulters: {
          count: response.data.data?.count || 0,
          students: response.data.data?.students || []
        },
        loading: false
      });

      return { success: true, data: response.data.data };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to fetch critical defaulters';
      set({ error: errorMessage, loading: false });
      toast.error(errorMessage);
      return { success: false, message: errorMessage };
    }
  },

  // ============= FORMATTED DATA GETTERS =============

  getFormattedCollectionSummary: () => {
    const { collectionReport } = get();
    const summary = collectionReport.summary;

    return {
      totalAmount: summary.totalAmount,
      formattedTotal: `KSh ${summary.totalAmount.toLocaleString()}`,
      totalPayments: summary.totalPayments,
      averageAmount: summary.averageAmount,
      formattedAverage: `KSh ${summary.averageAmount.toLocaleString()}`,
      methodBreakdown: Object.entries(summary.methodTotals || {}).map(([method, total]) => ({
        method,
        total,
        formattedTotal: `KSh ${total.toLocaleString()}`,
        percentage: summary.totalAmount > 0 ? Math.round((total / summary.totalAmount) * 100) : 0
      }))
    };
  },

  getFormattedOutstandingSummary: () => {
    const { outstandingReport } = get();
    const summary = outstandingReport.summary;

    return {
      totalStudents: summary.totalStudents,
      totalOutstanding: summary.totalOutstanding,
      formattedTotal: `KSh ${summary.totalOutstanding.toLocaleString()}`,
      averageOutstanding: summary.averageOutstanding,
      formattedAverage: `KSh ${summary.averageOutstanding.toLocaleString()}`,
      unpaidCount: summary.unpaidCount,
      partialCount: summary.partialCount,
      paidCount: summary.totalStudents - summary.unpaidCount - summary.partialCount
    };
  },

  getOutstandingStudentsByStatus: () => {
    const { outstandingReport } = get();
    const students = outstandingReport.students || [];

    return {
      unpaid: students.filter(s => s.totalPaid === 0),
      partial: students.filter(s => s.totalPaid > 0 && s.totalBalance > 0),
      all: students
    };
  },

  getChartDataForPaymentMethods: () => {
    const { paymentMethodAnalysis } = get();

    return paymentMethodAnalysis.map(item => ({
      name: item.methodDisplay || item.method,
      value: item.total,
      count: item.count,
      color: getPaymentMethodColor(item.method)
    }));
  },

  getChartDataForDailyTrend: () => {
    const { dailyTrend } = get();

    return dailyTrend.map(item => ({
      date: item._id,
      total: item.total,
      count: item.count,
      formattedDate: new Date(item._id).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
      })
    }));
  },

  getChartDataForMonthlyTrend: () => {
    const { monthlyTrend } = get();

    return monthlyTrend.map(item => ({
      month: item._id,
      total: item.total,
      count: item.count,
      formattedMonth: new Date(item._id + '-01').toLocaleDateString('en-US', {
        month: 'short',
        year: 'numeric'
      })
    }));
  },

  getFormattedComparison: () => {
    const { periodComparison } = get();
    const { currentPeriod, previousPeriod, change } = periodComparison;

    return {
      current: {
        ...currentPeriod,
        formattedTotal: `KSh ${currentPeriod.total.toLocaleString()}`,
        formattedAverage: `KSh ${currentPeriod.average.toLocaleString()}`
      },
      previous: {
        ...previousPeriod,
        formattedTotal: `KSh ${previousPeriod.total.toLocaleString()}`,
        formattedAverage: `KSh ${previousPeriod.average.toLocaleString()}`
      },
      change: {
        ...change,
        formattedAmount: `KSh ${Math.abs(change.amount).toLocaleString()}`,
        arrow: change.trend === 'up' ? '↑' : change.trend === 'down' ? '↓' : '→',
        color: change.trend === 'up' ? 'text-green-600' : 
               change.trend === 'down' ? 'text-red-600' : 'text-gray-600'
      }
    };
  },

  // ============= FILTER ACTIONS =============

  setReportType: (type) => {
    set({ selectedReportType: type });
  },

  setDateRange: (startDate, endDate) => {
    set({ dateRange: { startDate, endDate } });
  },

  setDateRangePreset: (preset) => {
    set({ dateRange: { startDate: preset.startDate, endDate: preset.endDate } });
  },

  setFilters: (filters) => {
    set({ filters: { ...get().filters, ...filters } });
  },

  resetFilters: () => {
    set({
      filters: {
        groupBy: 'day',
        status: '',
        courseId: '',
        search: '',
        minBalance: 0
      }
    });
  },

  resetDateRange: () => {
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    
    set({
      dateRange: {
        startDate: startOfMonth.toISOString().split('T')[0],
        endDate: today.toISOString().split('T')[0]
      }
    });
  },

  // ============= CLEAR ACTIONS =============

  clearCollectionReport: () => {
    set({
      collectionReport: {
        summary: {
          totalAmount: 0,
          totalPayments: 0,
          averageAmount: 0,
          methodTotals: {}
        },
        details: []
      }
    });
  },

  clearOutstandingReport: () => {
    set({
      outstandingReport: {
        summary: {
          totalStudents: 0,
          totalOutstanding: 0,
          averageOutstanding: 0,
          unpaidCount: 0,
          partialCount: 0
        },
        students: []
      }
    });
  },

  clearAllReports: () => {
    set({
      collectionReport: {
        summary: { totalAmount: 0, totalPayments: 0, averageAmount: 0, methodTotals: {} },
        details: []
      },
      outstandingReport: {
        summary: { totalStudents: 0, totalOutstanding: 0, averageOutstanding: 0, unpaidCount: 0, partialCount: 0 },
        students: []
      },
      allStudentsFeeStatus: [],
      coursePaymentReport: { summary: null, students: [] },
      paymentMethodAnalysis: [],
      paymentPurposeAnalysis: [],
      dailyTrend: [],
      monthlyTrend: [],
      periodComparison: {
        currentPeriod: { total: 0, payments: 0, average: 0 },
        previousPeriod: { total: 0, payments: 0, average: 0 },
        change: { amount: 0, percentage: 0, trend: 'stable' }
      },
      defaultersReport: { threshold: 50, count: 0, totalOutstanding: 0, students: [] },
      criticalDefaulters: { count: 0, students: [] }
    });
  },

  clearError: () => {
    set({ error: null });
  },

  // Reset entire store
  resetReportsStore: () => {
    set({
      collectionReport: {
        summary: { totalAmount: 0, totalPayments: 0, averageAmount: 0, methodTotals: {} },
        details: []
      },
      outstandingReport: {
        summary: { totalStudents: 0, totalOutstanding: 0, averageOutstanding: 0, unpaidCount: 0, partialCount: 0 },
        students: []
      },
      allStudentsFeeStatus: [],
      coursePaymentReport: { summary: null, students: [] },
      paymentMethodAnalysis: [],
      paymentPurposeAnalysis: [],
      dailyTrend: [],
      monthlyTrend: [],
      periodComparison: {
        currentPeriod: { total: 0, payments: 0, average: 0 },
        previousPeriod: { total: 0, payments: 0, average: 0 },
        change: { amount: 0, percentage: 0, trend: 'stable' }
      },
      defaultersReport: { threshold: 50, count: 0, totalOutstanding: 0, students: [] },
      criticalDefaulters: { count: 0, students: [] },
      loading: false,
      error: null,
      selectedReportType: 'collection',
      dateRange: {
        startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0]
      },
      filters: {
        groupBy: 'day',
        status: '',
        courseId: '',
        search: '',
        minBalance: 0
      },
      pagination: {
        current: 1,
        total: 1,
        results: 0,
        limit: 20
      }
    });
  }
}));

// Helper function for payment method colors
const getPaymentMethodColor = (method) => {
  const colors = {
    mpesa: '#10b981',
    cooperative_bank: '#3b82f6',
    family_bank: '#8b5cf6',
    cash: '#f59e0b',
    other: '#6b7280'
  };
  return colors[method] || '#6b7280';
};