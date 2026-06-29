// src/services/paymentAPI.js - WITH DEBUG LOGGING

import api from './api';

export const paymentAPI = {
  recordPayment: (paymentData) => {
    return api.post('/payments', paymentData);
  },
  
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
  
  getPayment: (id) => {
    return api.get(`/payments/${id}`);
  },
  
  updatePayment: (id, data) => {
    return api.put(`/payments/${id}`, data);
  },
  
  deletePayment: (id) => {
    return api.delete(`/payments/${id}`);
  },
  
  getStudentFeeSummary: (studentId) => {
    return api.get(`/payments/student/${studentId}/summary`);
  },
  
  // FIXED: Get payment statistics with debug logging
  getPaymentStats: async (params = {}) => {
    const { startDate, endDate } = params;
    console.log('📊 Fetching payment stats with params:', { startDate, endDate });
    
    try {
      const response = await api.get('/payments/stats', { params: { startDate, endDate } });
      console.log('✅ Payment stats response:', response.data);
      return response;
    } catch (error) {
      console.error('❌ Payment stats error:', error.response?.data || error.message);
      throw error;
    }
  },
  
  exportPayments: (params = {}) => {
    const { startDate, endDate, paymentMethod, courseId, format = 'csv' } = params;
    return api.get('/payments/export', { 
      params: { startDate, endDate, paymentMethod, courseId, format },
      responseType: 'blob' 
    });
  },

  getAllStudentsFeeStatus: (params = {}) => {
    const { status, courseId, search } = params;
    return api.get('/students/fees/overview', {
      params: { status, courseId, search }
    });
  },

  // FIXED: Get outstanding report with debug logging
  getOutstandingReport: async (params = {}) => {
    const { minBalance = 0, courseId } = params;
    console.log('📊 Fetching outstanding report with params:', { minBalance, courseId });
    
    try {
      const response = await api.get('/reports/outstanding', {
        params: { minBalance, courseId }
      });
      console.log('✅ Outstanding report response:', response.data);
      return response;
    } catch (error) {
      console.error('❌ Outstanding report error:', error.response?.data || error.message);
      throw error;
    }
  },

  getCollectionReport: (params = {}) => {
    const { startDate, endDate, groupBy = 'day' } = params;
    return api.get('/reports/collections', {
      params: { startDate, endDate, groupBy }
    });
  },

  getCoursePaymentSummary: (courseId) => {
    return api.get(`/courses/${courseId}/payments/summary`);
  },

  getCourseStudentsPaymentStatus: (courseId, params = {}) => {
    const { status, search } = params;
    return api.get(`/courses/${courseId}/payments/students`, {
      params: { status, search }
    });
  },

  exportCoursePaymentReport: (courseId, params = {}) => {
    const { status, search, format = 'csv' } = params;
    return api.get(`/courses/${courseId}/payments/export`, {
      params: { status, search, format },
      responseType: 'blob'
    });
  }
};

export default paymentAPI;