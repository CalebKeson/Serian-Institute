// src/stores/dashboardStore.js
import { create } from 'zustand';
import { dashboardAPI } from '../services/dashboardAPI';
import toast from 'react-hot-toast';

export const useDashboardStore = create((set, get) => ({
  // State
  financialData: null,
  collectionSummary: {
    todayCollection: { amount: 0, count: 0, label: "Today's Collections" },
    monthCollection: { amount: 0, count: 0, label: "This Month" },
    yearCollection: { amount: 0, count: 0, label: "This Year" },
    outstandingBalance: { amount: 0, studentCount: 0, label: "Outstanding Balance" }
  },
  topDefaulters: [],
  paymentMethods: [],
  dailyTrend: [],
  topCourses: [],
  recentPayments: [],
  dashboardStats: {
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
  },
  alerts: [],
  collectionProgress: {
    collected: 0,
    target: 1000000,
    percentage: 0,
    remaining: 1000000
  },
  
  // UI State
  loading: false,
  error: null,
  lastUpdated: null,
  pollingInterval: null,

  // Fetch all dashboard data
  fetchDashboardData: async () => {
    set({ loading: true, error: null });

    try {
      const response = await dashboardAPI.getFinancialDashboard();
      const data = response.data.data;

      set({
        financialData: data,
        collectionSummary: {
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
        },
        topDefaulters: data.topDefaulters || [],
        paymentMethods: data.paymentMethods || [],
        dailyTrend: data.dailyTrend || [],
        topCourses: data.topCourses || [],
        lastUpdated: new Date(),
        loading: false
      });

      // Also fetch other dashboard data in parallel
      await Promise.all([
        get().fetchDashboardStats(),
        get().fetchCollectionProgress(),
        get().fetchDashboardAlerts()
      ]);

      return { success: true, data };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to fetch dashboard data';
      set({ error: errorMessage, loading: false });
      toast.error(errorMessage);
      return { success: false, message: errorMessage };
    }
  },

  // Fetch dashboard stats
  fetchDashboardStats: async () => {
    try {
      const response = await dashboardAPI.getDashboardStats();
      
      set({
        dashboardStats: response.data.data
      });

      return { success: true, data: response.data.data };
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      return { success: false };
    }
  },

  // Fetch collection progress
  fetchCollectionProgress: async (target = null) => {
    try {
      const response = await dashboardAPI.getCollectionProgress(target);
      
      set({
        collectionProgress: response.data.data
      });

      return { success: true, data: response.data.data };
    } catch (error) {
      console.error('Error fetching collection progress:', error);
      return { success: false };
    }
  },

  // Fetch dashboard alerts
  fetchDashboardAlerts: async () => {
    try {
      const response = await dashboardAPI.getDashboardAlerts();
      
      set({
        alerts: response.data.data
      });

      return { success: true, data: response.data.data };
    } catch (error) {
      console.error('Error fetching dashboard alerts:', error);
      return { success: false };
    }
  },

  // Fetch recent payments
  fetchRecentPayments: async (limit = 5) => {
    try {
      const response = await dashboardAPI.getRecentPaymentActivity(limit);
      
      set({
        recentPayments: response.data.data
      });

      return { success: true, data: response.data.data };
    } catch (error) {
      console.error('Error fetching recent payments:', error);
      return { success: false };
    }
  },

  // Start polling for real-time updates
  startPolling: (interval = 60000) => { // Default: 60 seconds
    if (get().pollingInterval) {
      clearInterval(get().pollingInterval);
    }

    const poll = async () => {
      if (document.visibilityState === 'visible') {
        await get().fetchDashboardData();
        await get().fetchRecentPayments();
      }
    };

    // Initial fetch
    poll();

    // Set up polling interval
    const intervalId = setInterval(poll, interval);
    set({ pollingInterval: intervalId });
  },

  // Stop polling
  stopPolling: () => {
    if (get().pollingInterval) {
      clearInterval(get().pollingInterval);
      set({ pollingInterval: null });
    }
  },

  // Get formatted collection summary for cards
  getFormattedCollectionSummary: () => {
    const { collectionSummary } = get();
    
    return {
      today: {
        ...collectionSummary.todayCollection,
        formattedAmount: `KSh ${collectionSummary.todayCollection.amount.toLocaleString()}`
      },
      month: {
        ...collectionSummary.monthCollection,
        formattedAmount: `KSh ${collectionSummary.monthCollection.amount.toLocaleString()}`
      },
      year: {
        ...collectionSummary.yearCollection,
        formattedAmount: `KSh ${collectionSummary.yearCollection.amount.toLocaleString()}`
      },
      outstanding: {
        ...collectionSummary.outstandingBalance,
        formattedAmount: `KSh ${collectionSummary.outstandingBalance.amount.toLocaleString()}`
      }
    };
  },

  // Get payment method chart data
  getPaymentMethodChartData: () => {
    const { paymentMethods } = get();
    
    return paymentMethods.map(method => ({
      name: method.methodDisplay || method.method,
      value: method.total,
      count: method.count,
      color: getPaymentMethodColor(method.method)
    }));
  },

  // Get daily trend chart data
  getDailyTrendChartData: () => {
    const { dailyTrend } = get();
    
    return dailyTrend.map(day => ({
      date: day._id || day.date,
      total: day.total,
      count: day.count,
      formattedDate: new Date(day._id || day.date).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
      })
    }));
  },

  // Get top courses chart data
  getTopCoursesChartData: () => {
    const { topCourses } = get();
    
    return topCourses.map(course => ({
      name: `${course.courseCode} - ${course.courseName}`,
      total: course.total,
      expected: course.expectedRevenue,
      enrolledCount: course.enrolledCount,
      collectionRate: course.expectedRevenue > 0 
        ? Math.round((course.total / course.expectedRevenue) * 100) 
        : 0
    }));
  },

  // Get top defaulters list with formatting
  getFormattedTopDefaulters: () => {
    const { topDefaulters } = get();
    
    return topDefaulters.map(defaulter => ({
      ...defaulter,
      formattedBalance: `KSh ${defaulter.balance?.toLocaleString() || 0}`,
      status: defaulter.percentage < 25 ? 'Critical' : 
              defaulter.percentage < 50 ? 'Warning' : 'Attention',
      statusColor: defaulter.percentage < 25 ? 'red' : 
                    defaulter.percentage < 50 ? 'orange' : 'yellow'
    }));
  },

  // Get recent payments with formatting
  getFormattedRecentPayments: () => {
    const { recentPayments } = get();
    
    return recentPayments.map(payment => ({
      ...payment,
      formattedAmount: `KSh ${payment.amount?.toLocaleString() || 0}`,
      formattedDate: payment.paymentDate 
        ? new Date(payment.paymentDate).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })
        : 'N/A'
    }));
  },

  // Get dashboard KPIs
  getDashboardKPIs: () => {
    const { dashboardStats, collectionProgress } = get();
    
    return {
      totalStudents: dashboardStats.students?.total || 0,
      totalCourses: dashboardStats.courses?.total || 0,
      totalCollected: dashboardStats.financial?.yearCollection || 0,
      outstandingBalance: dashboardStats.financial?.outstandingBalance || 0,
      collectionRate: dashboardStats.collectionRate || 0,
      studentsWithFees: dashboardStats.financial?.totalStudentsWithFees || 0,
      progressPercentage: collectionProgress.percentage || 0,
      remainingToTarget: collectionProgress.remaining || 0
    };
  },

  // Get alerts with severity
  getAlertsBySeverity: () => {
    const { alerts } = get();
    
    return {
      high: alerts.filter(a => a.severity === 'high'),
      medium: alerts.filter(a => a.severity === 'medium'),
      low: alerts.filter(a => a.severity === 'low'),
      all: alerts
    };
  },

  // Refresh dashboard data
  refreshDashboard: async () => {
    set({ loading: true });
    await get().fetchDashboardData();
    await get().fetchRecentPayments();
    set({ loading: false });
    toast.success('Dashboard refreshed!');
  },

  // Set collection target
  setCollectionTarget: (target) => {
    get().fetchCollectionProgress(target);
  },

  // Clear all data
  clearDashboardData: () => {
    set({
      financialData: null,
      collectionSummary: {
        todayCollection: { amount: 0, count: 0, label: "Today's Collections" },
        monthCollection: { amount: 0, count: 0, label: "This Month" },
        yearCollection: { amount: 0, count: 0, label: "This Year" },
        outstandingBalance: { amount: 0, studentCount: 0, label: "Outstanding Balance" }
      },
      topDefaulters: [],
      paymentMethods: [],
      dailyTrend: [],
      topCourses: [],
      recentPayments: [],
      dashboardStats: {
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
      },
      alerts: [],
      collectionProgress: {
        collected: 0,
        target: 1000000,
        percentage: 0,
        remaining: 1000000
      }
    });
  },

  // Reset store (including polling)
  resetDashboardStore: () => {
    get().stopPolling();
    get().clearDashboardData();
    set({
      loading: false,
      error: null,
      lastUpdated: null,
      pollingInterval: null
    });
  },

  // Error handling
  clearError: () => {
    set({ error: null });
  }
}));

// Helper function for payment method colors
const getPaymentMethodColor = (method) => {
  const colors = {
    mpesa: '#10b981', // green
    cooperative_bank: '#3b82f6', // blue
    family_bank: '#8b5cf6', // purple
    cash: '#f59e0b', // orange
    other: '#6b7280' // gray
  };
  return colors[method] || '#6b7280';
};