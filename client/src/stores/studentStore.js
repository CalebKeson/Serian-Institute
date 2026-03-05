import { create } from "zustand";
import { studentAPI } from "../services/studentAPI";
import toast from "react-hot-toast";

export const useStudentStore = create((set, get) => ({
  // State
  students: [],
  currentStudent: null,
  loading: false,
  error: null,
  searchTerm: "",
  studentCount: 0,
  pollingInterval: null, // ADDED: For polling management
  pagination: {
    current: 1,
    total: 1,
    results: 0,
    limit: 10,
  },

  // Actions
  fetchStudents: async (page = 1, limit = 10, search = "") => {
    set({ loading: true, error: null });

    try {
      const response = await studentAPI.getStudents({ page, limit, search });
      const { data: students, pagination } = response.data;

      set({
        students,
        pagination: {
          current: parseInt(pagination.current),
          total: pagination.total,
          results: pagination.results,
          limit: limit,
        },
        searchTerm: search,
        loading: false,
        studentCount: pagination.results,
      });
    } catch (error) {
      const errorMessage =
        error.response?.data?.message || "Failed to fetch students";
      set({ error: errorMessage, loading: false });

      // Only show toast for unexpected errors, not for empty results
      if (error.response?.status !== 404) {
        toast.error(errorMessage);
      }
    }
  },

  // UPDATED: Fixed to only update if count changed
  fetchStudentCount: async () => {
    try {
      const response = await studentAPI.getStudentCount();
      const newCount = response.data.data?.count || 0;
      
      // Only update state if the count actually changed
      if (get().studentCount !== newCount) {
        set({ studentCount: newCount });
      }
      
      return newCount;
    } catch (error) {
      // Silent fail for polling
      console.warn("Failed to fetch student count:", error);
      return get().studentCount; // Return current count on error
    }
  },

  // ADDED: Start polling for student count
  startPolling: () => {
    // Clear any existing interval
    if (get().pollingInterval) {
      clearInterval(get().pollingInterval);
    }
    
    // Poll every 60 seconds (less frequent than notifications)
    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        get().fetchStudentCount();
      }
    }, 60000); // 60 seconds
    
    set({ pollingInterval: interval });
    
    // Initial fetch
    get().fetchStudentCount();
  },
  
  // ADDED: Stop polling
  stopPolling: () => {
    if (get().pollingInterval) {
      clearInterval(get().pollingInterval);
      set({ pollingInterval: null });
    }
  },

  fetchStudent: async (id) => {
    set({ loading: true, error: null });

    try {
      const response = await studentAPI.getStudent(id);
      const student = response.data.data;

      set({
        currentStudent: student,
        loading: false,
      });

      return { success: true, data: student };
    } catch (error) {
      const errorMessage =
        error.response?.data?.message || "Failed to fetch student";
      set({ error: errorMessage, loading: false });

      if (error.response?.status === 404) {
        toast.error("Student not found");
      } else {
        toast.error(errorMessage);
      }

      return { success: false, message: errorMessage };
    }
  },

  createStudent: async (studentData) => {
    set({ loading: true, error: null });

    try {
      // Ensure role is set to 'student'
      const dataToSend = {
        ...studentData,
        role: "student",
      };

      const response = await studentAPI.createStudent(dataToSend);
      const newStudent = response.data.data;

      // Update the local state optimistically
      const { students, pagination, studentCount } = get();
      const updatedStudents = [newStudent, ...students];

      set({
        students: updatedStudents,
        currentStudent: newStudent,
        pagination: {
          ...pagination,
          results: pagination.results + 1,
        },
        studentCount: studentCount + 1,
        loading: false,
      });

      toast.success("Student created successfully!");
      return { success: true, data: newStudent };
    } catch (error) {
      let errorMessage = "Failed to create student";

      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.data?.errors) {
        // Handle validation errors from backend
        const errors = error.response.data.errors;
        errorMessage = Object.values(errors).join(", ");
      }

      set({ error: errorMessage, loading: false });
      toast.error(errorMessage);
      return { success: false, message: errorMessage };
    }
  },

  updateStudent: async (id, studentData) => {
    set({ loading: true, error: null });

    try {
      const response = await studentAPI.updateStudent(id, studentData);
      const updatedStudent = response.data.data;

      // Update in the local state
      const { students } = get();
      const updatedStudents = students.map((student) =>
        student._id === id ? updatedStudent : student,
      );

      set({
        students: updatedStudents,
        currentStudent: updatedStudent,
        loading: false,
      });

      toast.success("Student updated successfully!");
      return { success: true, data: updatedStudent };
    } catch (error) {
      let errorMessage = "Failed to update student";

      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.data?.errors) {
        // Handle validation errors from backend
        const errors = error.response.data.errors;
        errorMessage = Object.values(errors).join(", ");
      }

      set({ error: errorMessage, loading: false });
      toast.error(errorMessage);
      return { success: false, message: errorMessage };
    }
  },

  deleteStudent: async (id) => {
    set({ loading: true, error: null });

    try {
      await studentAPI.deleteStudent(id);

      // Remove from local state
      const { students, pagination, studentCount } = get();
      const filteredStudents = students.filter((student) => student._id !== id);

      set({
        students: filteredStudents,
        pagination: {
          ...pagination,
          results: Math.max(0, pagination.results - 1),
        },
        studentCount: Math.max(0, studentCount - 1),
        loading: false,
      });

      toast.success("Student deleted successfully!");
      return { success: true };
    } catch (error) {
      const errorMessage =
        error.response?.data?.message || "Failed to delete student";
      set({ error: errorMessage, loading: false });
      toast.error(errorMessage);
      return { success: false, message: errorMessage };
    }
  },

  setSearchTerm: (searchTerm) => {
    set({ searchTerm });
  },

  clearError: () => {
    set({ error: null });
  },

  clearCurrentStudent: () => {
    set({ currentStudent: null });
  },
}));