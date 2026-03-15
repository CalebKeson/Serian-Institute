// src/services/feeAPI.js
import api from './api';

export const feeAPI = {
  // Get student fee summary (alias for paymentAPI.getStudentFeeSummary)
  getStudentFeeSummary: (studentId) => {
    return api.get(`/payments/student/${studentId}/summary`);
  },

  // Get all students fee status (admin view)
  getAllStudentsFeeStatus: (params = {}) => {
    const { status, courseId, search } = params;
    return api.get('/students/fees/overview', {
      params: { status, courseId, search }
    });
  },

  // Get outstanding fees report
  getOutstandingFees: (params = {}) => {
    const { minBalance = 0, courseId } = params;
    return api.get('/reports/outstanding', {
      params: { minBalance, courseId }
    });
  },

  // Get fee collection report
  getCollectionReport: (params = {}) => {
    const { startDate, endDate, groupBy = 'day', format = 'json' } = params;
    return api.get('/reports/collections', {
      params: { startDate, endDate, groupBy, format }
    });
  },

  // Get student's payment history for all courses
  getStudentPaymentHistory: (studentId, params = {}) => {
    const { page = 1, limit = 10, startDate, endDate } = params;
    return api.get(`/payments`, {
      params: { 
        studentId, 
        page, 
        limit, 
        startDate, 
        endDate,
        status: 'completed'
      }
    });
  },

  // Get payment summary for a specific course and student
  getCourseStudentFeeDetails: (courseId, studentId) => {
    return api.get(`/courses/${courseId}/students/${studentId}/payments`);
  },

  // Get fee payment statistics
  getFeeStatistics: (params = {}) => {
    const { startDate, endDate } = params;
    return api.get('/payments/stats', { params: { startDate, endDate } });
  },

  // Export fee report
  exportFeeReport: (params = {}) => {
    const { type = 'outstanding', startDate, endDate, format = 'csv' } = params;
    
    if (type === 'outstanding') {
      return api.get('/reports/outstanding', {
        params: { format },
        responseType: 'blob'
      });
    } else {
      return api.get('/reports/collections', {
        params: { startDate, endDate, format },
        responseType: 'blob'
      });
    }
  },

  // Get payment methods breakdown
  getPaymentMethodsBreakdown: (params = {}) => {
    const { startDate, endDate } = params;
    return api.get('/payments/stats', { 
      params: { startDate, endDate }
    }).then(response => {
      // Extract just the byMethod data
      return {
        data: {
          data: response.data.data?.byMethod || []
        }
      };
    });
  },

  // Get daily collection trends
  getDailyCollectionTrend: (params = {}) => {
    const { startDate, endDate } = params;
    return api.get('/payments/stats', { 
      params: { startDate, endDate }
    }).then(response => {
      // Extract just the byDay data
      return {
        data: {
          data: response.data.data?.byDay || []
        }
      };
    });
  },

  // Get monthly collection trends
  getMonthlyCollectionTrend: (params = {}) => {
    const { startDate, endDate } = params;
    return api.get('/payments/stats', { 
      params: { startDate, endDate }
    }).then(response => {
      // Extract just the byMonth data
      return {
        data: {
          data: response.data.data?.byMonth || []
        }
      };
    });
  },

  // Check if student has outstanding balance
  checkStudentOutstanding: async (studentId) => {
    try {
      const response = await api.get(`/payments/student/${studentId}/summary`);
      const data = response.data.data;
      return {
        hasOutstanding: data.summary?.totalBalance > 0,
        balance: data.summary?.totalBalance || 0,
        percentage: data.summary?.overallPercentage || 0
      };
    } catch (error) {
      console.error('Error checking student outstanding:', error);
      return {
        hasOutstanding: false,
        balance: 0,
        percentage: 0,
        error: error.message
      };
    }
  },

  // Get students with low payment percentage (defaulters)
  getDefaultersList: async (threshold = 50) => {
    try {
      const response = await api.get('/reports/outstanding');
      const students = response.data.data?.students || [];
      
      // Filter students with payment percentage below threshold
      return students.filter(s => s.paymentPercentage < threshold);
    } catch (error) {
      console.error('Error fetching defaulters list:', error);
      return [];
    }
  },

  // Get fee collection summary for dashboard
  getFeeCollectionSummary: async (params = {}) => {
    const { startDate, endDate } = params;
    
    try {
      const [statsResponse, outstandingResponse] = await Promise.all([
        api.get('/payments/stats', { params: { startDate, endDate } }),
        api.get('/reports/outstanding')
      ]);
      
      const stats = statsResponse.data.data || {};
      const outstanding = outstandingResponse.data.data || {};
      
      return {
        data: {
          totalCollected: stats.totalStats?.[0]?.totalAmount || 0,
          totalPayments: stats.totalStats?.[0]?.totalPayments || 0,
          averageAmount: stats.totalStats?.[0]?.averageAmount || 0,
          outstandingBalance: outstanding.summary?.totalOutstanding || 0,
          paymentMethods: stats.byMethod || [],
          recentPayments: stats.recentPayments || []
        }
      };
    } catch (error) {
      console.error('Error fetching fee collection summary:', error);
      return {
        data: {
          totalCollected: 0,
          totalPayments: 0,
          averageAmount: 0,
          outstandingBalance: 0,
          paymentMethods: [],
          recentPayments: []
        }
      };
    }
  }
};

export default feeAPI;