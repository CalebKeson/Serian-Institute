import { create } from 'zustand';
import { courseAPI } from '../services/courseAPI';
import toast from 'react-hot-toast';

export const useCourseStore = create((set, get) => ({
  // State
  courses: [],
  currentCourse: null,
  loading: false,
  error: null,
  searchTerm: '',
  courseCount: 0,
  pollingInterval: null,
  filters: {
    courseType: '',
    intakeMonth: '',
    status: '',
    instructor: ''
  },
  pagination: {
    current: 1,
    total: 1,
    results: 0,
    limit: 10
  },

  // ============= NEW PAYMENT-RELATED STATE =============
  coursePaymentSummary: null,
  courseStudentsPaymentStatus: [],
  studentCoursePayments: null,
  coursePaymentLoading: false,
  coursePaymentError: null,

  // Actions
  fetchCourses: async (page = 1, limit = 10, search = '', filters = {}) => {
    set({ loading: true, error: null });
    
    try {
      const response = await courseAPI.getCourses({
        page,
        limit,
        search,
        ...filters
      });
      
      set({
        courses: response.data.data || [],
        pagination: response.data.pagination || {
          current: page,
          total: 1,
          results: 0,
          limit: limit
        },
        searchTerm: search,
        filters: filters,
        loading: false
      });
      
      return response.data.data;
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to fetch courses';
      set({ error: errorMessage, loading: false });
      toast.error(errorMessage);
      return [];
    }
  },

  // Fetch course count for sidebar
  fetchCourseCount: async () => {
    try {
      const response = await courseAPI.getCourseCount();
      const newCount = response.data.data?.count || 0;
      
      if (get().courseCount !== newCount) {
        set({ courseCount: newCount });
      }
      
      return newCount;
    } catch (error) {
      console.warn('Failed to fetch course count:', error);
      return get().courseCount;
    }
  },

  // Start polling for course count
  startPolling: () => {
    if (get().pollingInterval) {
      clearInterval(get().pollingInterval);
    }
    
    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        get().fetchCourseCount();
      }
    }, 60000); // 60 seconds
    
    set({ pollingInterval: interval });
    get().fetchCourseCount();
  },
  
  // Stop polling
  stopPolling: () => {
    if (get().pollingInterval) {
      clearInterval(get().pollingInterval);
      set({ pollingInterval: null });
    }
  },

  fetchCourse: async (id) => {
    set({ loading: true, error: null });
    
    try {
      const response = await courseAPI.getCourse(id);
      
      set({ 
        currentCourse: response.data.data,
        loading: false 
      });
      
      return response.data.data;
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to fetch course';
      set({ error: errorMessage, loading: false });
      toast.error(errorMessage);
      return null;
    }
  },

  createCourse: async (courseData) => {
    set({ loading: true, error: null });
    
    try {
      const response = await courseAPI.createCourse(courseData);
      
      const { courses, pagination } = get();
      const updatedCourses = [response.data.data, ...courses];
      
      set({ 
        courses: updatedCourses,
        pagination: {
          ...pagination,
          results: pagination.results + 1
        },
        courseCount: get().courseCount + 1,
        loading: false 
      });
      
      toast.success(response.data.message || 'Course created successfully!');
      return { success: true, data: response.data.data };
      
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to create course';
      set({ error: errorMessage, loading: false });
      toast.error(errorMessage);
      return { success: false, message: errorMessage };
    }
  },

  updateCourse: async (id, courseData) => {
    set({ loading: true, error: null });
    
    try {
      const response = await courseAPI.updateCourse(id, courseData);
      
      const { courses } = get();
      const updatedCourses = courses.map(course => {
        if (course._id === id) {
          return response.data.data;
        }
        return course;
      });
      
      set({ 
        courses: updatedCourses,
        currentCourse: response.data.data,
        loading: false 
      });
      
      toast.success(response.data.message || 'Course updated successfully!');
      return { success: true, data: response.data.data };
      
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to update course';
      set({ error: errorMessage, loading: false });
      toast.error(errorMessage);
      return { success: false, message: errorMessage };
    }
  },

  deleteCourse: async (id) => {
    set({ loading: true, error: null });
    
    try {
      const response = await courseAPI.deleteCourse(id);
      
      const { courses, pagination } = get();
      const filteredCourses = courses.filter(course => course._id !== id);
      
      set({ 
        courses: filteredCourses,
        pagination: {
          ...pagination,
          results: Math.max(0, pagination.results - 1)
        },
        courseCount: Math.max(0, get().courseCount - 1),
        loading: false 
      });
      
      toast.success(response.data.message || 'Course deleted successfully!');
      return { success: true };
      
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to delete course';
      set({ error: errorMessage, loading: false });
      toast.error(errorMessage);
      return { success: false, message: errorMessage };
    }
  },

  // ============= NEW PAYMENT-RELATED METHODS =============

  // Fetch course payment summary
  fetchCoursePaymentSummary: async (courseId) => {
    set({ coursePaymentLoading: true, coursePaymentError: null });
    
    try {
      const response = await courseAPI.getCoursePaymentSummary(courseId);
      
      set({
        coursePaymentSummary: response.data.data,
        coursePaymentLoading: false
      });
      
      return { success: true, data: response.data.data };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to fetch payment summary';
      set({ coursePaymentError: errorMessage, coursePaymentLoading: false });
      toast.error(errorMessage);
      return { success: false, message: errorMessage };
    }
  },

  // Fetch students payment status for a course
  fetchCourseStudentsPaymentStatus: async (courseId, params = {}) => {
    set({ coursePaymentLoading: true, coursePaymentError: null });
    
    try {
      const response = await courseAPI.getCourseStudentsPaymentStatus(courseId, params);
      
      set({
        courseStudentsPaymentStatus: response.data.data.students || [],
        coursePaymentSummary: response.data.data.summary, // Update summary with latest
        coursePaymentLoading: false
      });
      
      return { success: true, data: response.data.data };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to fetch students payment status';
      set({ coursePaymentError: errorMessage, coursePaymentLoading: false });
      toast.error(errorMessage);
      return { success: false, message: errorMessage };
    }
  },

  // Fetch specific student's payments in a course
  fetchStudentCoursePayments: async (courseId, studentId) => {
    set({ coursePaymentLoading: true, coursePaymentError: null });
    
    try {
      const response = await courseAPI.getStudentCoursePayments(courseId, studentId);
      
      set({
        studentCoursePayments: response.data.data,
        coursePaymentLoading: false
      });
      
      return { success: true, data: response.data.data };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to fetch student payments';
      set({ coursePaymentError: errorMessage, coursePaymentLoading: false });
      toast.error(errorMessage);
      return { success: false, message: errorMessage };
    }
  },

  // Export course payment report
  exportCoursePaymentReport: async (courseId, params = {}) => {
    set({ coursePaymentLoading: true, coursePaymentError: null });
    
    try {
      const response = await courseAPI.exportCoursePaymentReport(courseId, params);
      
      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `course_${courseId}_payment_report_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      set({ coursePaymentLoading: false });
      toast.success('Payment report exported successfully!');
      return { success: true };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to export report';
      set({ coursePaymentError: errorMessage, coursePaymentLoading: false });
      toast.error(errorMessage);
      return { success: false, message: errorMessage };
    }
  },

  // Get payment statistics for current course
  getCoursePaymentStats: () => {
    const { courseStudentsPaymentStatus } = get();
    
    if (!courseStudentsPaymentStatus || courseStudentsPaymentStatus.length === 0) {
      return {
        totalStudents: 0,
        paidCount: 0,
        partialCount: 0,
        unpaidCount: 0,
        totalCollected: 0,
        totalExpected: 0,
        collectionRate: 0
      };
    }
    
    const stats = {
      totalStudents: courseStudentsPaymentStatus.length,
      paidCount: courseStudentsPaymentStatus.filter(s => s.financials?.status === 'paid').length,
      partialCount: courseStudentsPaymentStatus.filter(s => s.financials?.status === 'partial').length,
      unpaidCount: courseStudentsPaymentStatus.filter(s => s.financials?.status === 'unpaid').length,
      totalCollected: courseStudentsPaymentStatus.reduce((sum, s) => sum + (s.financials?.totalPaid || 0), 0),
      totalExpected: courseStudentsPaymentStatus.reduce((sum, s) => sum + (s.financials?.coursePrice || 0), 0)
    };
    
    stats.collectionRate = stats.totalExpected > 0 
      ? Math.round((stats.totalCollected / stats.totalExpected) * 100) 
      : 0;
    
    return stats;
  },

  // Get students by payment status
  getStudentsByPaymentStatus: (status) => {
    const { courseStudentsPaymentStatus } = get();
    
    if (!courseStudentsPaymentStatus || courseStudentsPaymentStatus.length === 0) {
      return [];
    }
    
    return courseStudentsPaymentStatus.filter(s => s.financials?.status === status);
  },

  // Get payment method breakdown for course
  getCoursePaymentMethodBreakdown: () => {
    const { coursePaymentSummary } = get();
    
    if (!coursePaymentSummary?.paymentMethods) {
      return [];
    }
    
    return coursePaymentSummary.paymentMethods;
  },

  // Get monthly collection trend
  getMonthlyCollectionTrend: () => {
    const { coursePaymentSummary } = get();
    
    if (!coursePaymentSummary?.monthlyTrend) {
      return [];
    }
    
    return coursePaymentSummary.monthlyTrend;
  },

  // Clear course payment data
  clearCoursePaymentData: () => {
    set({
      coursePaymentSummary: null,
      courseStudentsPaymentStatus: [],
      studentCoursePayments: null,
      coursePaymentError: null
    });
  },

  // Utility methods
  setSearchTerm: (searchTerm) => {
    set({ searchTerm });
  },

  setFilters: (filters) => {
    set({ filters });
  },

  clearError: () => {
    set({ error: null, coursePaymentError: null });
  },

  clearCurrentCourse: () => {
    set({ currentCourse: null });
  },

  // Reset all course-related data
  resetCourseStore: () => {
    set({
      courses: [],
      currentCourse: null,
      loading: false,
      error: null,
      searchTerm: '',
      courseCount: 0,
      filters: {
        courseType: '',
        intakeMonth: '',
        status: '',
        instructor: ''
      },
      pagination: {
        current: 1,
        total: 1,
        results: 0,
        limit: 10
      },
      coursePaymentSummary: null,
      courseStudentsPaymentStatus: [],
      studentCoursePayments: null,
      coursePaymentLoading: false,
      coursePaymentError: null
    });
  }
}));