// frontend/src/stores/instructorStore.js
import { create } from "zustand";
import { instructorAPI } from "../services/instructorAPI";
import toast from "react-hot-toast";

export const useInstructorStore = create((set, get) => ({
  // State
  instructors: [],
  currentInstructor: null,
  loading: false,
  error: null,
  searchTerm: "",
  instructorCount: 0,
  pollingInterval: null,
  instructorStats: null,
  instructorCourses: [],
  salaryPayments: [],
  pagination: {
    current: 1,
    total: 1,
    results: 0,
    limit: 10,
  },

  // Fetch all instructors with pagination and search
  fetchInstructors: async (page = 1, limit = 10, search = "", department = "", status = "") => {
    set({ loading: true, error: null });

    try {
      const response = await instructorAPI.getInstructors({ page, limit, search, department, status });
      const { data: instructors, pagination } = response.data;

      set({
        instructors,
        pagination: {
          current: parseInt(pagination.current),
          total: pagination.total,
          results: pagination.results,
          limit: limit,
        },
        searchTerm: search,
        loading: false,
        instructorCount: pagination.results,
      });
    } catch (error) {
      const errorMessage = error.response?.data?.message || "Failed to fetch instructors";
      set({ error: errorMessage, loading: false });
      toast.error(errorMessage);
    }
  },

  // Fetch single instructor by ID
  fetchInstructor: async (id) => {
    set({ loading: true, error: null });

    try {
      const response = await instructorAPI.getInstructor(id);
      const instructor = response.data.data;

      set({
        currentInstructor: instructor,
        loading: false,
      });

      return { success: true, data: instructor };
    } catch (error) {
      const errorMessage = error.response?.data?.message || "Failed to fetch instructor";
      set({ error: errorMessage, loading: false });
      toast.error(errorMessage);
      return { success: false, message: errorMessage };
    }
  },

  // Fetch instructor count for sidebar
  fetchInstructorCount: async () => {
    try {
      const response = await instructorAPI.getInstructorCount();
      const newCount = response.data.data?.count || 0;
      
      if (get().instructorCount !== newCount) {
        set({ instructorCount: newCount });
      }
      
      return newCount;
    } catch (error) {
      console.warn("Failed to fetch instructor count:", error);
      return get().instructorCount;
    }
  },

  // Fetch instructor statistics for dashboard
  fetchInstructorStats: async () => {
    try {
      const response = await instructorAPI.getInstructorStats();
      set({ instructorStats: response.data.data });
      return response.data.data;
    } catch (error) {
      console.warn("Failed to fetch instructor stats:", error);
      return null;
    }
  },

  // Fetch instructor's assigned courses
  fetchInstructorCourses: async (id) => {
    set({ loading: true, error: null });

    try {
      const response = await instructorAPI.getInstructorCourses(id);
      set({ 
        instructorCourses: response.data.data,
        loading: false 
      });
      return response.data;
    } catch (error) {
      const errorMessage = error.response?.data?.message || "Failed to fetch instructor courses";
      set({ error: errorMessage, loading: false });
      return { success: false, message: errorMessage };
    }
  },

  // Update instructor workload
  updateInstructorWorkload: async (id) => {
    try {
      const response = await instructorAPI.updateInstructorWorkload(id);
      // Refresh the instructor data to get updated workload
      await get().fetchInstructor(id);
      return response.data;
    } catch (error) {
      console.error("Failed to update workload:", error);
      toast.error("Failed to update workload");
      return { success: false };
    }
  },

  // Start polling for instructor count
  startPolling: () => {
    if (get().pollingInterval) {
      clearInterval(get().pollingInterval);
    }
    
    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        get().fetchInstructorCount();
      }
    }, 60000);
    
    set({ pollingInterval: interval });
    get().fetchInstructorCount();
  },
  
  // Stop polling
  stopPolling: () => {
    if (get().pollingInterval) {
      clearInterval(get().pollingInterval);
      set({ pollingInterval: null });
    }
  },

  // Create new instructor
  createInstructor: async (instructorData) => {
    set({ loading: true, error: null });

    try {
      const response = await instructorAPI.createInstructor(instructorData);
      const newInstructor = response.data.data;

      const { instructors, pagination, instructorCount } = get();
      const updatedInstructors = [newInstructor, ...instructors];

      set({
        instructors: updatedInstructors,
        currentInstructor: newInstructor,
        pagination: {
          ...pagination,
          results: pagination.results + 1,
        },
        instructorCount: instructorCount + 1,
        loading: false,
      });

      toast.success("Instructor created successfully!");
      return { success: true, data: newInstructor };
    } catch (error) {
      let errorMessage = "Failed to create instructor";

      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.data?.errors) {
        const errors = error.response.data.errors;
        errorMessage = Object.values(errors).join(", ");
      }

      set({ error: errorMessage, loading: false });
      toast.error(errorMessage);
      return { success: false, message: errorMessage };
    }
  },

  // Update instructor
  updateInstructor: async (id, instructorData) => {
    set({ loading: true, error: null });

    try {
      const response = await instructorAPI.updateInstructor(id, instructorData);
      const updatedInstructor = response.data.data;

      const { instructors } = get();
      const updatedInstructors = instructors.map((instructor) =>
        instructor._id === id ? updatedInstructor : instructor
      );

      set({
        instructors: updatedInstructors,
        currentInstructor: updatedInstructor,
        loading: false,
      });

      toast.success("Instructor updated successfully!");
      return { success: true, data: updatedInstructor };
    } catch (error) {
      let errorMessage = "Failed to update instructor";

      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }

      set({ error: errorMessage, loading: false });
      toast.error(errorMessage);
      return { success: false, message: errorMessage };
    }
  },

  // Record salary payment
  recordSalaryPayment: async (id, paymentData) => {
    set({ loading: true, error: null });

    try {
      const response = await instructorAPI.recordSalaryPayment(id, paymentData);
      
      // Refresh instructor data to get updated salary info
      await get().fetchInstructor(id);
      
      set({ loading: false });
      toast.success("Salary payment recorded successfully!");
      return { success: true, data: response.data.data };
    } catch (error) {
      const errorMessage = error.response?.data?.message || "Failed to record salary payment";
      set({ error: errorMessage, loading: false });
      toast.error(errorMessage);
      return { success: false, message: errorMessage };
    }
  },

  // Delete instructor
  deleteInstructor: async (id) => {
    set({ loading: true, error: null });

    try {
      await instructorAPI.deleteInstructor(id);

      const { instructors, pagination, instructorCount } = get();
      const filteredInstructors = instructors.filter((instructor) => instructor._id !== id);

      set({
        instructors: filteredInstructors,
        pagination: {
          ...pagination,
          results: Math.max(0, pagination.results - 1),
        },
        instructorCount: Math.max(0, instructorCount - 1),
        loading: false,
      });

      toast.success("Instructor deleted successfully!");
      return { success: true };
    } catch (error) {
      const errorMessage = error.response?.data?.message || "Failed to delete instructor";
      set({ error: errorMessage, loading: false });
      toast.error(errorMessage);
      return { success: false, message: errorMessage };
    }
  },

  // Set search term
  setSearchTerm: (searchTerm) => {
    set({ searchTerm });
  },

  // Clear error
  clearError: () => {
    set({ error: null });
  },

  // Clear current instructor
  clearCurrentInstructor: () => {
    set({ currentInstructor: null, instructorCourses: [] });
  },

  // Reset store
  resetInstructorStore: () => {
    set({
      instructors: [],
      currentInstructor: null,
      loading: false,
      error: null,
      searchTerm: "",
      instructorCount: 0,
      instructorStats: null,
      instructorCourses: [],
      pagination: {
        current: 1,
        total: 1,
        results: 0,
        limit: 10,
      },
    });
  }
}));