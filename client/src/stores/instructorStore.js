// src/stores/instructorStore.js - NEW FILE
import { create } from 'zustand';
import { courseAPI } from '../services/courseAPI';
import toast from 'react-hot-toast';

export const useInstructorStore = create((set, get) => ({
  // State
  instructors: [],
  loading: false,
  error: null,

  // Actions
  fetchInstructors: async () => {
    set({ loading: true, error: null });
    
    try {
      const response = await courseAPI.getAvailableInstructors();
      
      set({ 
        instructors: response.data.data || [],
        loading: false 
      });
      
      return response.data.data;
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to fetch instructors';
      set({ error: errorMessage, loading: false });
      toast.error(errorMessage);
      return [];
    }
  },

  clearError: () => {
    set({ error: null });
  },

  getInstructorById: (id) => {
    const { instructors } = get();
    return instructors.find(instructor => instructor._id === id);
  },

  getInstructorOptions: () => {
    const { instructors } = get();
    return instructors.map(instructor => ({
      value: instructor._id,
      label: `${instructor.name} (${instructor.email})`,
      ...instructor
    }));
  }
}));