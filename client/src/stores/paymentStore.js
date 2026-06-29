// src/stores/paymentStore.js - COMPLETE FIXED VERSION

import { create } from 'zustand';
import { paymentAPI } from '../services/paymentAPI';
import toast from 'react-hot-toast';

export const usePaymentStore = create((set, get) => ({
  // State
  payments: [],
  currentPayment: null,
  studentFeeSummary: null,
  allStudentsFeeStatus: [],
  paymentStats: null,
  outstandingReport: null,
  collectionReport: null,
  coursePaymentSummary: null,
  courseStudentsPaymentStatus: [],
  loading: false,
  error: null,
  
  // Data cache
  dataCache: {
    payments: [],
    paymentStats: null,
    outstandingReport: null,
    collectionReport: null,
    coursePaymentSummary: null,
    courseStudentsPaymentStatus: []
  },
  
  // Filter state
  filters: {
    page: 1,
    limit: 10,
    studentId: '',
    courseId: '',
    paymentMethod: '',
    paymentFor: '',
    startDate: '',
    endDate: '',
    status: 'completed',
    search: ''
  },
  pagination: {
    current: 1,
    total: 1,
    results: 0,
    limit: 10
  },
  summary: {
    totalAmount: 0
  },

  // ============================================================
  // RECORD PAYMENT
  // ============================================================
  recordPayment: async (paymentData) => {
    set({ loading: true, error: null });
    
    try {
      const response = await paymentAPI.recordPayment(paymentData);
      const newPayment = response.data.data;
      
      const currentCache = get().dataCache;
      set({
        payments: [newPayment, ...(currentCache.payments || [])],
        dataCache: {
          ...currentCache,
          payments: [newPayment, ...(currentCache.payments || [])]
        },
        loading: false
      });
      
      toast.success(response.data.message || 'Payment recorded successfully!');
      return { success: true, data: newPayment };
      
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to record payment';
      set({ error: errorMessage, loading: false });
      toast.error(errorMessage);
      return { success: false, message: errorMessage };
    }
  },

  // ============================================================
  // FETCH PAYMENTS
  // ============================================================
  fetchPayments: async (filters = {}) => {
    // Don't fetch if already loading
    if (get().loading) {
      return { success: true, data: get().dataCache.payments };
    }
    
    set({ loading: true, error: null });
    
    try {
      const currentFilters = get().filters;
      const updatedFilters = { ...currentFilters, ...filters };
      
      const response = await paymentAPI.getPayments(updatedFilters);
      const paymentsData = response.data.data || [];
      const paginationData = response.data.pagination || {
        current: updatedFilters.page || 1,
        total: 1,
        results: 0,
        limit: updatedFilters.limit || 10
      };
      const summaryData = response.data.summary || { totalAmount: 0 };
      
      set({
        payments: paymentsData,
        pagination: paginationData,
        summary: summaryData,
        filters: updatedFilters,
        dataCache: {
          ...get().dataCache,
          payments: paymentsData
        },
        loading: false
      });
      
      return { success: true, data: paymentsData };
    } catch (error) {
      set({ error: error.response?.data?.message || 'Failed to fetch payments', loading: false });
      return { success: false, message: error.message };
    }
  },

  // ============================================================
  // FETCH SINGLE PAYMENT
  // ============================================================
  fetchPayment: async (id) => {
    set({ loading: true, error: null });
    
    try {
      const response = await paymentAPI.getPayment(id);
      
      set({
        currentPayment: response.data.data,
        loading: false
      });
      
      return { success: true, data: response.data.data };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to fetch payment';
      set({ error: errorMessage, loading: false });
      toast.error(errorMessage);
      return { success: false, message: errorMessage };
    }
  },

  // ============================================================
  // UPDATE PAYMENT
  // ============================================================
  updatePayment: async (id, data) => {
    set({ loading: true, error: null });
    
    try {
      const response = await paymentAPI.updatePayment(id, data);
      const updatedPayment = response.data.data;
      
      const { payments, dataCache } = get();
      const updatedPayments = payments.map(p => 
        p._id === id ? updatedPayment : p
      );
      
      set({
        payments: updatedPayments,
        currentPayment: updatedPayment,
        dataCache: {
          ...dataCache,
          payments: updatedPayments
        },
        loading: false
      });
      
      toast.success(response.data.message || 'Payment updated successfully!');
      return { success: true, data: updatedPayment };
      
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to update payment';
      set({ error: errorMessage, loading: false });
      toast.error(errorMessage);
      return { success: false, message: errorMessage };
    }
  },

  // ============================================================
  // DELETE PAYMENT
  // ============================================================
  deletePayment: async (id) => {
    set({ loading: true, error: null });
    
    try {
      await paymentAPI.deletePayment(id);
      
      const { payments, dataCache } = get();
      const filteredPayments = payments.filter(p => p._id !== id);
      
      set({
        payments: filteredPayments,
        dataCache: {
          ...dataCache,
          payments: filteredPayments
        },
        loading: false
      });
      
      toast.success('Payment deleted successfully!');
      return { success: true };
      
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to delete payment';
      set({ error: errorMessage, loading: false });
      toast.error(errorMessage);
      return { success: false, message: errorMessage };
    }
  },

  // ============================================================
  // FETCH STUDENT FEE SUMMARY
  // ============================================================
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

  // ============================================================
  // FETCH PAYMENT STATISTICS - ALWAYS FRESH
  // ============================================================
  fetchPaymentStats: async (params = {}) => {
    set({ loading: true, error: null });
    
    try {
      const response = await paymentAPI.getPaymentStats(params);
      const statsData = response.data.data || {};
      
      // Ensure the stats have the expected structure
      const formattedStats = {
        totalStats: statsData.totalStats || [{ totalAmount: 0, totalPayments: 0, averageAmount: 0 }],
        byMethod: statsData.byMethod || [],
        byPurpose: statsData.byPurpose || [],
        byDay: statsData.byDay || [],
        byMonth: statsData.byMonth || [],
        recentPayments: statsData.recentPayments || []
      };
      
      set({
        paymentStats: formattedStats,
        dataCache: {
          ...get().dataCache,
          paymentStats: formattedStats
        },
        loading: false
      });
      
      return { success: true, data: formattedStats };
    } catch (error) {
      console.error('Error fetching payment stats:', error);
      set({ error: error.response?.data?.message || 'Failed to fetch payment statistics', loading: false });
      return { success: false, message: error.message };
    }
  },

  // ============================================================
  // FETCH OUTSTANDING REPORT - ALWAYS FRESH (FIXED)
  // ============================================================
  fetchOutstandingReport: async (params = {}) => {
    // Always fetch fresh data - don't use cache
    set({ loading: true, error: null });
    
    try {
      const response = await paymentAPI.getOutstandingReport(params);
      const reportData = response.data.data || {};
      
      // Ensure the report has the expected structure with ALL students
      const formattedReport = {
        summary: {
          totalStudents: reportData.summary?.totalStudents || 0,
          totalOutstanding: reportData.summary?.totalOutstanding || 0,
          averageOutstanding: reportData.summary?.averageOutstanding || 0,
          unpaidCount: reportData.summary?.unpaidCount || 0,
          partialCount: reportData.summary?.partialCount || 0,
          paidCount: reportData.summary?.paidCount || 0,
          totalFees: reportData.summary?.totalFees || 0,
          totalPaid: reportData.summary?.totalPaid || 0,
          enrolledCount: reportData.summary?.enrolledCount || 0,
          completedCount: reportData.summary?.completedCount || 0
        },
        students: reportData.students || []
      };
      
      console.log('📊 [Store] Outstanding report fetched:', {
        totalStudents: formattedReport.summary.totalStudents,
        totalFees: formattedReport.summary.totalFees,
        totalPaid: formattedReport.summary.totalPaid,
        studentsCount: formattedReport.students.length
      });
      
      set({
        outstandingReport: formattedReport,
        dataCache: {
          ...get().dataCache,
          outstandingReport: formattedReport
        },
        loading: false
      });
      
      return { success: true, data: formattedReport };
    } catch (error) {
      console.error('Error fetching outstanding report:', error);
      set({ error: error.response?.data?.message || 'Failed to fetch outstanding report', loading: false });
      return { success: false, message: error.message };
    }
  },

  // ============================================================
  // FETCH COLLECTION REPORT - ALWAYS FRESH
  // ============================================================
  fetchCollectionReport: async (params = {}) => {
    set({ loading: true, error: null });
    
    try {
      const response = await paymentAPI.getCollectionReport(params);
      const reportData = response.data.data || {};
      
      set({
        collectionReport: reportData,
        dataCache: {
          ...get().dataCache,
          collectionReport: reportData
        },
        loading: false
      });
      
      return { success: true, data: reportData };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to fetch collection report';
      set({ error: errorMessage, loading: false });
      toast.error(errorMessage);
      return { success: false, message: errorMessage };
    }
  },

  // ============================================================
  // FETCH COURSE PAYMENT SUMMARY
  // ============================================================
  fetchCoursePaymentSummary: async (courseId) => {
    set({ loading: true, error: null });
    
    try {
      const response = await paymentAPI.getCoursePaymentSummary(courseId);
      const summaryData = response.data.data;
      
      set({
        coursePaymentSummary: summaryData,
        dataCache: {
          ...get().dataCache,
          coursePaymentSummary: summaryData
        },
        loading: false
      });
      
      return { success: true, data: summaryData };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to fetch course payment summary';
      set({ error: errorMessage, loading: false });
      toast.error(errorMessage);
      return { success: false, message: errorMessage };
    }
  },

  // ============================================================
  // FETCH COURSE STUDENTS PAYMENT STATUS
  // ============================================================
  fetchCourseStudentsPaymentStatus: async (courseId, params = {}) => {
    set({ loading: true, error: null });
    
    try {
      const response = await paymentAPI.getCourseStudentsPaymentStatus(courseId, params);
      
      const studentsData = response.data.data?.students || [];
      const summaryData = response.data.data?.summary;
      
      set({
        courseStudentsPaymentStatus: studentsData,
        coursePaymentSummary: summaryData || get().coursePaymentSummary,
        dataCache: {
          ...get().dataCache,
          courseStudentsPaymentStatus: studentsData,
          coursePaymentSummary: summaryData || get().coursePaymentSummary
        },
        loading: false
      });
      
      return { success: true, data: response.data.data };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to fetch students payment status';
      set({ error: errorMessage, loading: false });
      toast.error(errorMessage);
      return { success: false, message: errorMessage };
    }
  },

  // ============================================================
  // EXPORT COURSE PAYMENT REPORT
  // ============================================================
  exportCoursePaymentReport: async (courseId, params = {}) => {
    set({ loading: true, error: null });
    
    try {
      const response = await paymentAPI.exportCoursePaymentReport(courseId, params);
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `course_${courseId}_payment_report_${new Date().toISOString().split('T')[0]}.csv`);
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

  // ============================================================
  // EXPORT PAYMENTS
  // ============================================================
  exportPayments: async (params = {}) => {
    set({ loading: true, error: null });
    
    try {
      const response = await paymentAPI.exportPayments(params);
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `payments_export_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      set({ loading: false });
      toast.success('Payments exported successfully!');
      return { success: true };
      
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to export payments';
      set({ error: errorMessage, loading: false });
      toast.error(errorMessage);
      return { success: false, message: errorMessage };
    }
  },

  // ============================================================
  // CLEAR CACHE - FORCE REFRESH
  // ============================================================
  clearCache: () => {
    set({
      dataCache: {
        payments: [],
        paymentStats: null,
        outstandingReport: null,
        collectionReport: null,
        coursePaymentSummary: null,
        courseStudentsPaymentStatus: []
      }
    });
    console.log('🗑️ [Store] Cache cleared');
  },

  // ============================================================
  // CLEAR OUTSTANDING REPORT CACHE
  // ============================================================
  clearOutstandingReportCache: () => {
    set({
      outstandingReport: null,
      dataCache: {
        ...get().dataCache,
        outstandingReport: null
      }
    });
    console.log('🗑️ [Store] Outstanding report cache cleared');
  },

  // ============================================================
  // FORCE REFRESH OUTSTANDING REPORT
  // ============================================================
  refreshOutstandingReport: async (params = {}) => {
    // Clear cache first
    get().clearOutstandingReportCache();
    // Then fetch fresh
    return get().fetchOutstandingReport(params);
  },

  // ============================================================
  // RESTORE FROM CACHE
  // ============================================================
  restoreFromCache: () => {
    const cache = get().dataCache;
    set({
      payments: cache.payments || [],
      paymentStats: cache.paymentStats,
      outstandingReport: cache.outstandingReport,
      collectionReport: cache.collectionReport,
      coursePaymentSummary: cache.coursePaymentSummary,
      courseStudentsPaymentStatus: cache.courseStudentsPaymentStatus
    });
    toast.success('Data restored from cache');
  },

  // ============================================================
  // CLEAR SPECIFIC DATA
  // ============================================================
  clearCurrentPayment: () => {
    set({ currentPayment: null });
  },

  clearStudentFeeSummary: () => {
    set({ studentFeeSummary: null });
  },

  clearPaymentStats: () => {
    set({ paymentStats: null });
  },

  clearOutstandingReport: () => {
    set({ outstandingReport: null });
  },

  clearCollectionReport: () => {
    set({ collectionReport: null });
  },

  clearCoursePaymentData: () => {
    set({
      coursePaymentSummary: null,
      courseStudentsPaymentStatus: []
    });
  },

  // ============================================================
  // FILTER METHODS
  // ============================================================
  setFilters: (filters) => {
    set({ filters: { ...get().filters, ...filters } });
  },

  setPage: (page) => {
    set({ filters: { ...get().filters, page } });
  },

  setLimit: (limit) => {
    set({ filters: { ...get().filters, limit, page: 1 } });
  },

  clearError: () => {
    set({ error: null });
  },

  resetFilters: () => {
    set({
      filters: {
        page: 1,
        limit: 10,
        studentId: '',
        courseId: '',
        paymentMethod: '',
        paymentFor: '',
        startDate: '',
        endDate: '',
        status: 'completed',
        search: ''
      }
    });
  },

  // ============================================================
  // RESET STORE
  // ============================================================
  resetPaymentStore: () => {
    set({
      payments: [],
      currentPayment: null,
      studentFeeSummary: null,
      allStudentsFeeStatus: [],
      paymentStats: null,
      outstandingReport: null,
      collectionReport: null,
      coursePaymentSummary: null,
      courseStudentsPaymentStatus: [],
      loading: false,
      error: null,
      filters: {
        page: 1,
        limit: 10,
        studentId: '',
        courseId: '',
        paymentMethod: '',
        paymentFor: '',
        startDate: '',
        endDate: '',
        status: 'completed',
        search: ''
      },
      pagination: {
        current: 1,
        total: 1,
        results: 0,
        limit: 10
      },
      summary: {
        totalAmount: 0
      },
      // Keep cache but mark as stale
      dataCache: {
        payments: [],
        paymentStats: null,
        outstandingReport: null,
        collectionReport: null,
        coursePaymentSummary: null,
        courseStudentsPaymentStatus: []
      }
    });
  }
}));