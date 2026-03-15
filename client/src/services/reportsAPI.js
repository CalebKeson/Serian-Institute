// src/services/reportsAPI.js
import api from './api';

export const reportsAPI = {
  // ============= COLLECTION REPORTS =============

  // Get collection report with filters
  getCollectionReport: (params = {}) => {
    const { 
      startDate, 
      endDate, 
      groupBy = 'day', 
      format = 'json' 
    } = params;
    
    return api.get('/reports/collections', {
      params: { startDate, endDate, groupBy, format }
    });
  },

  // Export collection report as CSV
  exportCollectionReport: (params = {}) => {
    const { 
      startDate, 
      endDate, 
      groupBy = 'day' 
    } = params;
    
    return api.get('/reports/collections', {
      params: { startDate, endDate, groupBy, format: 'csv' },
      responseType: 'blob'
    });
  },

  // Get collection summary for date range
  getCollectionSummary: async (params = {}) => {
    try {
      const response = await api.get('/reports/collections', {
        params: { ...params, format: 'json' }
      });
      
      return {
        data: {
          data: response.data.data?.summary || {
            totalAmount: 0,
            totalPayments: 0,
            averageAmount: 0,
            methodTotals: {}
          }
        }
      };
    } catch (error) {
      console.error('Error fetching collection summary:', error);
      return {
        data: {
          data: {
            totalAmount: 0,
            totalPayments: 0,
            averageAmount: 0,
            methodTotals: {}
          }
        }
      };
    }
  },

  // Get collection details (grouped by day/week/month)
  getCollectionDetails: async (params = {}) => {
    try {
      const response = await api.get('/reports/collections', {
        params: { ...params, format: 'json' }
      });
      
      return {
        data: {
          data: response.data.data?.details || []
        }
      };
    } catch (error) {
      console.error('Error fetching collection details:', error);
      return { data: { data: [] } };
    }
  },

  // ============= OUTSTANDING FEES REPORTS =============

  // Get outstanding fees report
  getOutstandingReport: (params = {}) => {
    const { minBalance = 0, courseId, format = 'json' } = params;
    
    return api.get('/reports/outstanding', {
      params: { minBalance, courseId, format }
    });
  },

  // Export outstanding report as CSV
  exportOutstandingReport: (params = {}) => {
    const { minBalance = 0, courseId } = params;
    
    return api.get('/reports/outstanding', {
      params: { minBalance, courseId, format: 'csv' },
      responseType: 'blob'
    });
  },

  // Get outstanding summary
  getOutstandingSummary: async (params = {}) => {
    try {
      const response = await api.get('/reports/outstanding', {
        params: { ...params, format: 'json' }
      });
      
      return {
        data: {
          data: response.data.data?.summary || {
            totalStudents: 0,
            totalOutstanding: 0,
            averageOutstanding: 0,
            unpaidCount: 0,
            partialCount: 0
          }
        }
      };
    } catch (error) {
      console.error('Error fetching outstanding summary:', error);
      return {
        data: {
          data: {
            totalStudents: 0,
            totalOutstanding: 0,
            averageOutstanding: 0,
            unpaidCount: 0,
            partialCount: 0
          }
        }
      };
    }
  },

  // Get outstanding students list
  getOutstandingStudents: async (params = {}) => {
    try {
      const response = await api.get('/reports/outstanding', {
        params: { ...params, format: 'json' }
      });
      
      return {
        data: {
          data: response.data.data?.students || []
        }
      };
    } catch (error) {
      console.error('Error fetching outstanding students:', error);
      return { data: { data: [] } };
    }
  },

  // ============= STUDENT FEE REPORTS =============

  // Get student fee statement
  getStudentFeeStatement: (studentId, params = {}) => {
    const { startDate, endDate } = params;
    return api.get(`/payments/student/${studentId}/summary`, {
      params: { startDate, endDate }
    });
  },

  // Get all students fee status (for admin)
  getAllStudentsFeeStatus: (params = {}) => {
    const { status, courseId, search } = params;
    return api.get('/students/fees/overview', {
      params: { status, courseId, search }
    });
  },

  // Export all students fee status
  exportAllStudentsFeeStatus: (params = {}) => {
    const { status, courseId, search } = params;
    
    // This endpoint would need to be created on the backend
    // For now, we'll use the same endpoint with format=csv
    return api.get('/students/fees/overview', {
      params: { status, courseId, search, format: 'csv' },
      responseType: 'blob'
    });
  },

  // ============= COURSE FEE REPORTS =============

  // Get course payment report
  getCoursePaymentReport: (courseId, params = {}) => {
    const { status, search } = params;
    return api.get(`/courses/${courseId}/payments/students`, {
      params: { status, search }
    });
  },

  // Export course payment report
  exportCoursePaymentReport: (courseId, params = {}) => {
    const { status, search } = params;
    return api.get(`/courses/${courseId}/payments/export`, {
      params: { status, search },
      responseType: 'blob'
    });
  },

  // Get course collection summary
  getCourseCollectionSummary: (courseId) => {
    return api.get(`/courses/${courseId}/payments/summary`);
  },

  // ============= PAYMENT ANALYSIS REPORTS =============

  // Get payment method analysis
  getPaymentMethodAnalysis: async (params = {}) => {
    try {
      const response = await api.get('/payments/stats', {
        params: { ...params }
      });
      
      return {
        data: {
          data: response.data.data?.byMethod || []
        }
      };
    } catch (error) {
      console.error('Error fetching payment method analysis:', error);
      return { data: { data: [] } };
    }
  },

  // Get payment purpose analysis
  getPaymentPurposeAnalysis: async (params = {}) => {
    try {
      const response = await api.get('/payments/stats', {
        params: { ...params }
      });
      
      return {
        data: {
          data: response.data.data?.byPurpose || []
        }
      };
    } catch (error) {
      console.error('Error fetching payment purpose analysis:', error);
      return { data: { data: [] } };
    }
  },

  // Get daily collection trend
  getDailyCollectionTrend: async (params = {}) => {
    try {
      const response = await api.get('/payments/stats', {
        params: { ...params }
      });
      
      return {
        data: {
          data: response.data.data?.byDay || []
        }
      };
    } catch (error) {
      console.error('Error fetching daily collection trend:', error);
      return { data: { data: [] } };
    }
  },

  // Get monthly collection trend
  getMonthlyCollectionTrend: async (params = {}) => {
    try {
      const response = await api.get('/payments/stats', {
        params: { ...params }
      });
      
      return {
        data: {
          data: response.data.data?.byMonth || []
        }
      };
    } catch (error) {
      console.error('Error fetching monthly collection trend:', error);
      return { data: { data: [] } };
    }
  },

  // ============= COMPARISON REPORTS =============

  // Compare two periods
  comparePeriods: async (params = {}) => {
    const { 
      currentStart, currentEnd, 
      previousStart, previousEnd 
    } = params;

    try {
      const [currentPeriod, previousPeriod] = await Promise.all([
        api.get('/reports/collections', {
          params: { startDate: currentStart, endDate: currentEnd, groupBy: 'day' }
        }),
        api.get('/reports/collections', {
          params: { startDate: previousStart, endDate: previousEnd, groupBy: 'day' }
        })
      ]);

      const currentTotal = currentPeriod.data.data?.summary?.totalAmount || 0;
      const previousTotal = previousPeriod.data.data?.summary?.totalAmount || 0;
      
      const change = previousTotal > 0 
        ? ((currentTotal - previousTotal) / previousTotal) * 100 
        : 0;

      return {
        data: {
          data: {
            currentPeriod: {
              startDate: currentStart,
              endDate: currentEnd,
              total: currentTotal,
              payments: currentPeriod.data.data?.summary?.totalPayments || 0,
              average: currentPeriod.data.data?.summary?.averageAmount || 0
            },
            previousPeriod: {
              startDate: previousStart,
              endDate: previousEnd,
              total: previousTotal,
              payments: previousPeriod.data.data?.summary?.totalPayments || 0,
              average: previousPeriod.data.data?.summary?.averageAmount || 0
            },
            change: {
              amount: currentTotal - previousTotal,
              percentage: Math.round(change * 10) / 10,
              trend: change > 0 ? 'up' : change < 0 ? 'down' : 'stable'
            }
          }
        }
      };
    } catch (error) {
      console.error('Error comparing periods:', error);
      return {
        data: {
          data: {
            currentPeriod: { total: 0, payments: 0, average: 0 },
            previousPeriod: { total: 0, payments: 0, average: 0 },
            change: { amount: 0, percentage: 0, trend: 'stable' }
          }
        }
      };
    }
  },

  // ============= DEFAULTERS REPORTS =============

  // Get defaulters list with custom threshold
  getDefaultersByThreshold: async (threshold = 50, params = {}) => {
    try {
      const response = await api.get('/reports/outstanding', {
        params: { ...params, format: 'json' }
      });
      
      const students = response.data.data?.students || [];
      const defaulters = students.filter(s => s.paymentPercentage < threshold);
      
      return {
        data: {
          data: {
            threshold,
            count: defaulters.length,
            totalOutstanding: defaulters.reduce((sum, s) => sum + s.totalBalance, 0),
            students: defaulters
          }
        }
      };
    } catch (error) {
      console.error('Error fetching defaulters by threshold:', error);
      return {
        data: {
          data: {
            threshold,
            count: 0,
            totalOutstanding: 0,
            students: []
          }
        }
      };
    }
  },

  // Get critical defaulters (below 25% payment)
  getCriticalDefaulters: async (params = {}) => {
    return reportsAPI.getDefaultersByThreshold(25, params);
  },

  // ============= REPORT METADATA =============

  // Get available date ranges for reports
  getDateRangeOptions: () => {
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const startOfLastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const endOfLastMonth = new Date(today.getFullYear(), today.getMonth(), 0);
    const startOfYear = new Date(today.getFullYear(), 0, 1);
    
    return [
      {
        label: 'Today',
        startDate: today.toISOString().split('T')[0],
        endDate: today.toISOString().split('T')[0]
      },
      {
        label: 'This Week',
        startDate: new Date(today.setDate(today.getDate() - today.getDay())).toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0]
      },
      {
        label: 'This Month',
        startDate: startOfMonth.toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0]
      },
      {
        label: 'Last Month',
        startDate: startOfLastMonth.toISOString().split('T')[0],
        endDate: endOfLastMonth.toISOString().split('T')[0]
      },
      {
        label: 'This Year',
        startDate: startOfYear.toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0]
      },
      {
        label: 'Last 7 Days',
        startDate: new Date(new Date().setDate(new Date().getDate() - 7)).toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0]
      },
      {
        label: 'Last 30 Days',
        startDate: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0]
      },
      {
        label: 'Last 90 Days',
        startDate: new Date(new Date().setDate(new Date().getDate() - 90)).toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0]
      }
    ];
  },

  // Get report types
  getReportTypes: () => {
    return [
      { id: 'collection', label: 'Collection Report', icon: '💰' },
      { id: 'outstanding', label: 'Outstanding Fees', icon: '⚠️' },
      { id: 'student', label: 'Student Fee Statement', icon: '👨‍🎓' },
      { id: 'course', label: 'Course Payment Report', icon: '📚' },
      { id: 'method', label: 'Payment Method Analysis', icon: '💳' },
      { id: 'comparison', label: 'Period Comparison', icon: '📊' },
      { id: 'defaulters', label: 'Defaulters List', icon: '🚨' }
    ];
  }
};

export default reportsAPI;