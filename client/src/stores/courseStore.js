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
  courseCount: 0,  // ADD THIS
  pollingInterval: null,  // ADD THIS
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

  // ADD THIS: Fetch course count for sidebar
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

  // ADD THIS: Start polling for course count
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
  
  // ADD THIS: Stop polling
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
        courseCount: get().courseCount + 1,  // UPDATE COUNT
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
        courseCount: Math.max(0, get().courseCount - 1),  // UPDATE COUNT
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

  setSearchTerm: (searchTerm) => {
    set({ searchTerm });
  },

  setFilters: (filters) => {
    set({ filters });
  },

  clearError: () => {
    set({ error: null });
  },

  clearCurrentCourse: () => {
    set({ currentCourse: null });
  }
}));