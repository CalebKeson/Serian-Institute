// src/services/paymentAPI.js
import api from './api';

export const paymentAPI = {
  // Record a new payment
  recordPayment: (paymentData) => {
    return api.post('/payments', paymentData);
  },
  
  // Get all payments with filters
  getPayments: (params = {}) => {
    const { 
      page = 1, 
      limit = 10, 
      studentId, 
      courseId, 
      paymentMethod, 
      paymentFor, 
      startDate, 
      endDate, 
      status = 'completed', 
      search 
    } = params;
    
    return api.get('/payments', {
      params: { 
        page, 
        limit, 
        studentId, 
        courseId, 
        paymentMethod, 
        paymentFor, 
        startDate, 
        endDate, 
        status, 
        search 
      }
    });
  },
  
  // Get single payment
  getPayment: (id) => {
    return api.get(`/payments/${id}`);
  },
  
  // Update payment
  updatePayment: (id, data) => {
    return api.put(`/payments/${id}`, data);
  },
  
  // Delete payment
  deletePayment: (id) => {
    return api.delete(`/payments/${id}`);
  },
  
  // Get student fee summary
  getStudentFeeSummary: (studentId) => {
    return api.get(`/payments/student/${studentId}/summary`);
  },
  
  // Get payment statistics
  getPaymentStats: (params = {}) => {
    const { startDate, endDate } = params;
    return api.get('/payments/stats', { params: { startDate, endDate } });
  },
  
  // Export payments
  exportPayments: (params = {}) => {
    const { startDate, endDate, paymentMethod, courseId, format = 'csv' } = params;
    return api.get('/payments/export', { 
      params: { startDate, endDate, paymentMethod, courseId, format },
      responseType: 'blob' 
    });
  },

  // Get all students fee status (admin view)
  getAllStudentsFeeStatus: (params = {}) => {
    const { status, courseId, search } = params;
    return api.get('/students/fees/overview', {
      params: { status, courseId, search }
    });
  },

  // Get outstanding fees report - FIXED: Using correct path
  getOutstandingReport: (params = {}) => {
    const { minBalance = 0, courseId } = params;
    return api.get('/reports/outstanding', {  // This path is correct: /api/reports/outstanding
      params: { minBalance, courseId }
    });
  },

  // Get collection report
  getCollectionReport: (params = {}) => {
    const { startDate, endDate, groupBy = 'day' } = params;
    return api.get('/reports/collections', {
      params: { startDate, endDate, groupBy }
    });
  },

  // Get course payment summary
  getCoursePaymentSummary: (courseId) => {
    return api.get(`/courses/${courseId}/payments/summary`);
  },

  // Get course students payment status
  getCourseStudentsPaymentStatus: (courseId, params = {}) => {
    const { status, search } = params;
    return api.get(`/courses/${courseId}/payments/students`, {
      params: { status, search }
    });
  },

  // Export course payment report
  exportCoursePaymentReport: (courseId, params = {}) => {
    const { status, search, format = 'csv' } = params;
    return api.get(`/courses/${courseId}/payments/export`, {
      params: { status, search, format },
      responseType: 'blob'
    });
  }
};

export default paymentAPI;