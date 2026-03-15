// src/stores/paymentStore.js
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
  
  // Filters and pagination
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

  // Date range options for reports
  dateRangeOptions: [
    { label: 'Today', days: 0 },
    { label: 'This Week', days: 7 },
    { label: 'This Month', days: 30 },
    { label: 'Last 3 Months', days: 90 },
    { label: 'This Year', days: 365 },
    { label: 'Custom', days: null }
  ],

  // Payment methods
  paymentMethods: [
    { value: 'mpesa', label: 'M-Pesa', icon: '📱', color: 'green' },
    { value: 'cooperative_bank', label: 'Co-operative Bank', icon: '🏦', color: 'blue' },
    { value: 'family_bank', label: 'Family Bank', icon: '🏦', color: 'purple' },
    { value: 'cash', label: 'Cash', icon: '💵', color: 'yellow' },
    { value: 'other', label: 'Other', icon: '🔄', color: 'gray' }
  ],

  // Payment purposes
  paymentPurposes: [
    { value: 'tuition', label: 'Tuition Fee', icon: '📚' },
    { value: 'registration', label: 'Registration Fee', icon: '📝' },
    { value: 'exam_fee', label: 'Examination Fee', icon: '✍️' },
    { value: 'lab_fee', label: 'Skills Lab Fee', icon: '🔬' },
    { value: 'materials', label: 'Learning Materials', icon: '📖' },
    { value: 'other', label: 'Other', icon: '🔄' }
  ],

  // Record a new payment
  recordPayment: async (paymentData) => {
    set({ loading: true, error: null });
    
    try {
      const response = await paymentAPI.recordPayment(paymentData);
      const newPayment = response.data.data;
      
      const { payments } = get();
      set({
        payments: [newPayment, ...payments],
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

  // src/stores/paymentStore.js - Update the fetchPayments method
fetchPayments: async (filters = {}) => {
  set({ loading: true, error: null });
  
  try {
    const currentFilters = get().filters;
    const updatedFilters = { ...currentFilters, ...filters };
    
    const response = await paymentAPI.getPayments(updatedFilters);
    
    // Ensure we're setting the data correctly
    set({
      payments: response.data.data || [],
      pagination: response.data.pagination || {
        current: updatedFilters.page || 1,
        total: 1,
        results: 0,
        limit: updatedFilters.limit || 10
      },
      summary: response.data.summary || { totalAmount: 0 },
      filters: updatedFilters,
      loading: false
    });
    
    return { success: true, data: response.data.data };
  } catch (error) {
    const errorMessage = error.response?.data?.message || 'Failed to fetch payments';
    set({ error: errorMessage, loading: false });
    return { success: false, message: errorMessage };
  }
},

  // Fetch single payment
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

  // Update payment
  updatePayment: async (id, data) => {
    set({ loading: true, error: null });
    
    try {
      const response = await paymentAPI.updatePayment(id, data);
      const updatedPayment = response.data.data;
      
      const { payments } = get();
      const updatedPayments = payments.map(p => 
        p._id === id ? updatedPayment : p
      );
      
      set({
        payments: updatedPayments,
        currentPayment: updatedPayment,
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

  // Delete payment
  deletePayment: async (id) => {
    set({ loading: true, error: null });
    
    try {
      await paymentAPI.deletePayment(id);
      
      const { payments } = get();
      const filteredPayments = payments.filter(p => p._id !== id);
      
      set({
        payments: filteredPayments,
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

  // Fetch payment statistics
  fetchPaymentStats: async (params = {}) => {
    set({ loading: true, error: null });
    
    try {
      const response = await paymentAPI.getPaymentStats(params);
      
      set({
        paymentStats: response.data.data,
        loading: false
      });
      
      return { success: true, data: response.data.data };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to fetch payment statistics';
      set({ error: errorMessage, loading: false });
      return { success: false, message: errorMessage };
    }
  },

  // Fetch outstanding report
  fetchOutstandingReport: async (params = {}) => {
    set({ loading: true, error: null });
    
    try {
      const response = await paymentAPI.getOutstandingReport(params);
      
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
      const response = await paymentAPI.getCollectionReport(params);
      
      set({
        collectionReport: response.data.data,
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

  // Fetch course payment summary
  fetchCoursePaymentSummary: async (courseId) => {
    set({ loading: true, error: null });
    
    try {
      const response = await paymentAPI.getCoursePaymentSummary(courseId);
      
      set({
        coursePaymentSummary: response.data.data,
        loading: false
      });
      
      return { success: true, data: response.data.data };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to fetch course payment summary';
      set({ error: errorMessage, loading: false });
      toast.error(errorMessage);
      return { success: false, message: errorMessage };
    }
  },

  // Fetch course students payment status
  fetchCourseStudentsPaymentStatus: async (courseId, params = {}) => {
    set({ loading: true, error: null });
    
    try {
      const response = await paymentAPI.getCourseStudentsPaymentStatus(courseId, params);
      
      set({
        courseStudentsPaymentStatus: response.data.data?.students || [],
        coursePaymentSummary: response.data.data?.summary,
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

  // Export course payment report
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
      return { success: true };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to export report';
      set({ error: errorMessage, loading: false });
      toast.error(errorMessage);
      return { success: false, message: errorMessage };
    }
  },

  // Export payments
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

  // Filter methods
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

  // Clear specific data
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

  // Reset entire store
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
      }
    });
  }
}));