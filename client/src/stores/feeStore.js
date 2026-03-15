// src/stores/feeStore.js
import { create } from 'zustand';
import { feeAPI } from '../services/feeAPI';
import { paymentAPI } from '../services/paymentAPI';
import toast from 'react-hot-toast';

export const useFeeStore = create((set, get) => ({
  // State
  studentFeeSummary: null,
  allStudentsFeeStatus: [],
  outstandingReport: null,
  collectionReport: null,
  feeStatistics: null,
  defaultersList: [],
  loading: false,
  error: null,

  // Filters
  filters: {
    status: '',
    courseId: '',
    search: '',
    minBalance: 0,
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    groupBy: 'day'
  },

  // Pagination for all students fee status
  pagination: {
    current: 1,
    total: 1,
    results: 0,
    limit: 20
  },

  // Fetch student fee summary
  fetchStudentFeeSummary: async (studentId) => {
    set({ loading: true, error: null });

    try {
      const response = await paymentAPI.getStudentFeeSummary(studentId);

      set({
        studentFeeSummary: response.data.data,
        loading: false
      });

      return { success: true, data: response.data.data };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to fetch student fee summary';
      set({ error: errorMessage, loading: false });
      toast.error(errorMessage);
      return { success: false, message: errorMessage };
    }
  },

  // Fetch all students fee status (admin view)
  fetchAllStudentsFeeStatus: async (params = {}) => {
    set({ loading: true, error: null });

    try {
      const response = await feeAPI.getAllStudentsFeeStatus(params);
      
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

  // Fetch outstanding fees report
  fetchOutstandingReport: async (params = {}) => {
    set({ loading: true, error: null });

    try {
      const response = await feeAPI.getOutstandingFees(params);

      set({
        outstandingReport: response.data.data,
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

  // Fetch collection report
  fetchCollectionReport: async (params = {}) => {
    set({ loading: true, error: null });

    try {
      const { startDate, endDate, groupBy } = { ...get().filters, ...params };
      
      const response = await feeAPI.getCollectionReport({
        startDate,
        endDate,
        groupBy
      });

      set({
        collectionReport: response.data.data,
        filters: { ...get().filters, startDate, endDate, groupBy },
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

  // Fetch fee statistics
  fetchFeeStatistics: async (params = {}) => {
    set({ loading: true, error: null });

    try {
      const response = await feeAPI.getFeeStatistics(params);

      set({
        feeStatistics: response.data.data,
        loading: false
      });

      return { success: true, data: response.data.data };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to fetch fee statistics';
      set({ error: errorMessage, loading: false });
      toast.error(errorMessage);
      return { success: false, message: errorMessage };
    }
  },

  // Fetch defaulters list
  fetchDefaultersList: async (threshold = 50) => {
    set({ loading: true, error: null });

    try {
      const defaulters = await feeAPI.getDefaultersList(threshold);

      set({
        defaultersList: defaulters,
        loading: false
      });

      return { success: true, data: defaulters };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to fetch defaulters list';
      set({ error: errorMessage, loading: false });
      toast.error(errorMessage);
      return { success: false, message: errorMessage };
    }
  },

  // Export fee report
  exportFeeReport: async (params = {}) => {
    set({ loading: true, error: null });

    try {
      const response = await feeAPI.exportFeeReport(params);

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      
      const dateStr = new Date().toISOString().split('T')[0];
      const filename = params.type === 'outstanding' 
        ? `outstanding_report_${dateStr}.csv`
        : `collection_report_${dateStr}.csv`;
      
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();

      set({ loading: false });
      toast.success('Report exported successfully!');
      return { success: true };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to export report';
      set({ error: errorMessage, loading: false });
      toast.error(errorMessage);
      return { success: false, message: errorMessage };
    }
  },

  // Get student's overall payment status
  getStudentOverallStatus: (studentId) => {
    const { studentFeeSummary } = get();

    if (!studentFeeSummary || !studentFeeSummary.summary) {
      return {
        totalFees: 0,
        totalPaid: 0,
        balance: 0,
        percentage: 0,
        status: 'No Records'
      };
    }

    return {
      totalFees: studentFeeSummary.summary.totalFees,
      totalPaid: studentFeeSummary.summary.totalPaid,
      balance: studentFeeSummary.summary.totalBalance,
      percentage: studentFeeSummary.summary.overallPercentage,
      status: studentFeeSummary.summary.paymentStatus
    };
  },

  // Get student's course breakdown
  getStudentCourseBreakdown: () => {
    const { studentFeeSummary } = get();

    if (!studentFeeSummary?.courseBreakdown) {
      return [];
    }

    return studentFeeSummary.courseBreakdown;
  },

  // Get outstanding summary statistics
  getOutstandingSummary: () => {
    const { outstandingReport } = get();

    if (!outstandingReport?.summary) {
      return {
        totalStudents: 0,
        totalOutstanding: 0,
        averageOutstanding: 0,
        unpaidCount: 0,
        partialCount: 0
      };
    }

    return outstandingReport.summary;
  },

  // Get outstanding students list
  getOutstandingStudents: () => {
    const { outstandingReport } = get();

    if (!outstandingReport?.students) {
      return [];
    }

    return outstandingReport.students;
  },

  // Get collection report summary
  getCollectionSummary: () => {
    const { collectionReport } = get();

    if (!collectionReport?.summary) {
      return {
        totalAmount: 0,
        totalPayments: 0,
        averageAmount: 0,
        methodTotals: {}
      };
    }

    return collectionReport.summary;
  },

  // Get collection report details
  getCollectionDetails: () => {
    const { collectionReport } = get();

    if (!collectionReport?.details) {
      return [];
    }

    return collectionReport.details;
  },

  // Get payment method breakdown from statistics
  getPaymentMethodBreakdown: () => {
    const { feeStatistics } = get();

    if (!feeStatistics?.byMethod) {
      return [];
    }

    return feeStatistics.byMethod;
  },

  // Get daily collection trend
  getDailyCollectionTrend: () => {
    const { feeStatistics } = get();

    if (!feeStatistics?.byDay) {
      return [];
    }

    return feeStatistics.byDay;
  },

  // Get monthly collection trend
  getMonthlyCollectionTrend: () => {
    const { feeStatistics } = get();

    if (!feeStatistics?.byMonth) {
      return [];
    }

    return feeStatistics.byMonth;
  },

  // Get recent payments
  getRecentPayments: (limit = 10) => {
    const { feeStatistics } = get();

    if (!feeStatistics?.recentPayments) {
      return [];
    }

    return feeStatistics.recentPayments.slice(0, limit);
  },

  // Calculate collection rate
  getCollectionRate: () => {
    const { outstandingReport, collectionReport } = get();

    if (!outstandingReport?.summary || !collectionReport?.summary) {
      return 0;
    }

    const totalCollected = collectionReport.summary.totalAmount || 0;
    const totalOutstanding = outstandingReport.summary.totalOutstanding || 0;
    const totalExpected = totalCollected + totalOutstanding;

    return totalExpected > 0 ? Math.round((totalCollected / totalExpected) * 100) : 0;
  },

  // Filter students by payment status
  getStudentsByStatus: (status) => {
    const { allStudentsFeeStatus } = get();

    if (!allStudentsFeeStatus || allStudentsFeeStatus.length === 0) {
      return [];
    }

    if (status === 'fully_paid') {
      return allStudentsFeeStatus.filter(s => s.totalBalance === 0);
    } else if (status === 'partial') {
      return allStudentsFeeStatus.filter(s => s.totalPaid > 0 && s.totalBalance > 0);
    } else if (status === 'unpaid') {
      return allStudentsFeeStatus.filter(s => s.totalPaid === 0);
    }

    return allStudentsFeeStatus;
  },

  // Calculate total fees for all students
  getTotalFeesCollected: () => {
    const { allStudentsFeeStatus } = get();

    if (!allStudentsFeeStatus || allStudentsFeeStatus.length === 0) {
      return 0;
    }

    return allStudentsFeeStatus.reduce((sum, s) => sum + s.totalPaid, 0);
  },

  // Calculate total outstanding for all students
  getTotalOutstandingAll: () => {
    const { allStudentsFeeStatus } = get();

    if (!allStudentsFeeStatus || allStudentsFeeStatus.length === 0) {
      return 0;
    }

    return allStudentsFeeStatus.reduce((sum, s) => sum + s.totalBalance, 0);
  },

  // Filter methods
  setFilters: (filters) => {
    set({ filters: { ...get().filters, ...filters } });
  },

  resetFilters: () => {
    set({
      filters: {
        status: '',
        courseId: '',
        search: '',
        minBalance: 0,
        startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0],
        groupBy: 'day'
      }
    });
  },

  // Clear data
  clearStudentFeeSummary: () => {
    set({ studentFeeSummary: null });
  },

  clearAllStudentsFeeStatus: () => {
    set({ allStudentsFeeStatus: [] });
  },

  clearOutstandingReport: () => {
    set({ outstandingReport: null });
  },

  clearCollectionReport: () => {
    set({ collectionReport: null });
  },

  clearFeeStatistics: () => {
    set({ feeStatistics: null });
  },

  clearDefaultersList: () => {
    set({ defaultersList: [] });
  },

  clearError: () => {
    set({ error: null });
  },

  // Reset entire store
  resetFeeStore: () => {
    set({
      studentFeeSummary: null,
      allStudentsFeeStatus: [],
      outstandingReport: null,
      collectionReport: null,
      feeStatistics: null,
      defaultersList: [],
      loading: false,
      error: null,
      filters: {
        status: '',
        courseId: '',
        search: '',
        minBalance: 0,
        startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0],
        groupBy: 'day'
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