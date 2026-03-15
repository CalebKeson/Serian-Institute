// src/services/dashboardAPI.js
import api from './api';

export const dashboardAPI = {
  // Get financial dashboard data
  getFinancialDashboard: () => {
    return api.get('/dashboard/financial');
  },

  // Get today's collections
  getTodayCollections: async () => {
    try {
      const response = await api.get('/dashboard/financial');
      return {
        data: {
          data: {
            total: response.data.data?.collections?.today || 0,
            count: response.data.data?.collections?.todayCount || 0
          }
        }
      };
    } catch (error) {
      console.error('Error fetching today collections:', error);
      return { data: { data: { total: 0, count: 0 } } };
    }
  },

  // Get this month's collections
  getMonthCollections: async () => {
    try {
      const response = await api.get('/dashboard/financial');
      return {
        data: {
          data: {
            total: response.data.data?.collections?.thisMonth || 0,
            count: response.data.data?.collections?.monthCount || 0
          }
        }
      };
    } catch (error) {
      console.error('Error fetching month collections:', error);
      return { data: { data: { total: 0, count: 0 } } };
    }
  },

  // Get this year's collections
  getYearCollections: async () => {
    try {
      const response = await api.get('/dashboard/financial');
      return {
        data: {
          data: {
            total: response.data.data?.collections?.thisYear || 0,
            count: response.data.data?.collections?.yearCount || 0
          }
        }
      };
    } catch (error) {
      console.error('Error fetching year collections:', error);
      return { data: { data: { total: 0, count: 0 } } };
    }
  },

  // Get outstanding balance summary
  getOutstandingSummary: async () => {
    try {
      const response = await api.get('/dashboard/financial');
      return {
        data: {
          data: {
            totalOutstanding: response.data.data?.outstanding?.totalOutstanding || 0,
            totalFees: response.data.data?.outstanding?.totalFees || 0,
            totalPaid: response.data.data?.outstanding?.totalPaid || 0,
            studentCount: response.data.data?.outstanding?.studentCount || 0
          }
        }
      };
    } catch (error) {
      console.error('Error fetching outstanding summary:', error);
      return {
        data: {
          data: {
            totalOutstanding: 0,
            totalFees: 0,
            totalPaid: 0,
            studentCount: 0
          }
        }
      };
    }
  },

  // Get top defaulters
  getTopDefaulters: async (limit = 5) => {
    try {
      const response = await api.get('/dashboard/financial');
      return {
        data: {
          data: (response.data.data?.topDefaulters || []).slice(0, limit)
        }
      };
    } catch (error) {
      console.error('Error fetching top defaulters:', error);
      return { data: { data: [] } };
    }
  },

  // Get payment method breakdown for dashboard
  getPaymentMethodBreakdown: async () => {
    try {
      const response = await api.get('/dashboard/financial');
      return {
        data: {
          data: response.data.data?.paymentMethods || []
        }
      };
    } catch (error) {
      console.error('Error fetching payment method breakdown:', error);
      return { data: { data: [] } };
    }
  },

  // Get daily collection trend for dashboard
  getDailyCollectionTrend: async () => {
    try {
      const response = await api.get('/dashboard/financial');
      return {
        data: {
          data: response.data.data?.dailyTrend || []
        }
      };
    } catch (error) {
      console.error('Error fetching daily collection trend:', error);
      return { data: { data: [] } };
    }
  },

  // Get top performing courses by collection
  getTopCoursesByCollection: async (limit = 5) => {
    try {
      const response = await api.get('/dashboard/financial');
      return {
        data: {
          data: (response.data.data?.topCourses || []).slice(0, limit)
        }
      };
    } catch (error) {
      console.error('Error fetching top courses:', error);
      return { data: { data: [] } };
    }
  },

  // Get collection summary card data
  getCollectionSummaryCards: async () => {
    try {
      const response = await api.get('/dashboard/financial');
      const data = response.data.data;
      
      return {
        data: {
          data: {
            todayCollection: {
              amount: data.collections?.today || 0,
              count: data.collections?.todayCount || 0,
              label: "Today's Collections"
            },
            monthCollection: {
              amount: data.collections?.thisMonth || 0,
              count: data.collections?.monthCount || 0,
              label: "This Month"
            },
            yearCollection: {
              amount: data.collections?.thisYear || 0,
              count: data.collections?.yearCount || 0,
              label: "This Year"
            },
            outstandingBalance: {
              amount: data.outstanding?.totalOutstanding || 0,
              studentCount: data.outstanding?.studentCount || 0,
              label: "Outstanding Balance"
            }
          }
        }
      };
    } catch (error) {
      console.error('Error fetching collection summary cards:', error);
      return {
        data: {
          data: {
            todayCollection: { amount: 0, count: 0, label: "Today's Collections" },
            monthCollection: { amount: 0, count: 0, label: "This Month" },
            yearCollection: { amount: 0, count: 0, label: "This Year" },
            outstandingBalance: { amount: 0, studentCount: 0, label: "Outstanding Balance" }
          }
        }
      };
    }
  },

  // Get collection progress (percentage of target)
  getCollectionProgress: async (targetAmount = null) => {
    try {
      const response = await api.get('/dashboard/financial');
      const yearCollection = response.data.data?.collections?.thisYear || 0;
      
      // If no target provided, use previous year's total or a default
      let target = targetAmount;
      if (!target) {
        // You could set a default target or calculate based on historical data
        target = 1000000; // Example: KSh 1,000,000 default target
      }
      
      const percentage = target > 0 ? Math.min(100, Math.round((yearCollection / target) * 100)) : 0;
      
      return {
        data: {
          data: {
            collected: yearCollection,
            target: target,
            percentage: percentage,
            remaining: Math.max(0, target - yearCollection)
          }
        }
      };
    } catch (error) {
      console.error('Error fetching collection progress:', error);
      return {
        data: {
          data: {
            collected: 0,
            target: targetAmount || 1000000,
            percentage: 0,
            remaining: targetAmount || 1000000
          }
        }
      };
    }
  },

  // Get recent payment activity for dashboard
  getRecentPaymentActivity: async (limit = 5) => {
    try {
      const response = await api.get('/dashboard/financial');
      return {
        data: {
          data: (response.data.data?.recentPayments || []).slice(0, limit)
        }
      };
    } catch (error) {
      console.error('Error fetching recent payment activity:', error);
      return { data: { data: [] } };
    }
  },

  // Get dashboard stats for quick overview
  getDashboardStats: async () => {
    try {
      const [financialRes, coursesRes, studentsRes] = await Promise.all([
        api.get('/dashboard/financial'),
        api.get('/courses/count'),
        api.get('/students/count')
      ]);

      const financial = financialRes.data.data;
      
      return {
        data: {
          data: {
            financial: {
              todayCollection: financial.collections?.today || 0,
              monthCollection: financial.collections?.thisMonth || 0,
              yearCollection: financial.collections?.thisYear || 0,
              outstandingBalance: financial.outstanding?.totalOutstanding || 0,
              totalStudentsWithFees: financial.outstanding?.studentCount || 0
            },
            courses: {
              total: coursesRes.data.data?.count || 0
            },
            students: {
              total: studentsRes.data.data?.count || 0
            },
            collectionRate: financial.outstanding?.totalFees > 0 
              ? Math.round((financial.outstanding?.totalPaid / financial.outstanding?.totalFees) * 100)
              : 0
          }
        }
      };
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      return {
        data: {
          data: {
            financial: {
              todayCollection: 0,
              monthCollection: 0,
              yearCollection: 0,
              outstandingBalance: 0,
              totalStudentsWithFees: 0
            },
            courses: { total: 0 },
            students: { total: 0 },
            collectionRate: 0
          }
        }
      };
    }
  },

  // Get chart data for dashboard
  getDashboardChartData: async () => {
    try {
      const response = await api.get('/dashboard/financial');
      const data = response.data.data;
      
      return {
        data: {
          data: {
            dailyTrend: data.dailyTrend || [],
            paymentMethods: data.paymentMethods || [],
            topCourses: data.topCourses || [],
            weeklyComparison: data.weeklyComparison || [] // If backend provides this
          }
        }
      };
    } catch (error) {
      console.error('Error fetching dashboard chart data:', error);
      return {
        data: {
          data: {
            dailyTrend: [],
            paymentMethods: [],
            topCourses: [],
            weeklyComparison: []
          }
        }
      };
    }
  },

  // Get alert data (students with low payment, upcoming deadlines, etc.)
  getDashboardAlerts: async () => {
    try {
      const response = await api.get('/dashboard/financial');
      const defaulters = response.data.data?.topDefaulters || [];
      
      const alerts = [];
      
      // Add alerts for defaulters
      defaulters.forEach(defaulter => {
        if (defaulter.balance > 0 && defaulter.percentage < 50) {
          alerts.push({
            type: 'warning',
            title: 'Low Payment Alert',
            message: `${defaulter.name} has only paid ${defaulter.percentage}% of total fees. Balance: KSh ${defaulter.balance.toLocaleString()}`,
            studentId: defaulter.studentId,
            severity: defaulter.percentage < 25 ? 'high' : 'medium'
          });
        }
      });

      return {
        data: {
          data: alerts.slice(0, 5) // Return top 5 alerts
        }
      };
    } catch (error) {
      console.error('Error fetching dashboard alerts:', error);
      return { data: { data: [] } };
    }
  }
};

export default dashboardAPI;