// frontend/src/stores/studentStore.js - FIXED createStudent function

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
  pollingInterval: null,
  pagination: {
    current: 1,
    total: 1,
    results: 0,
    limit: 10,
  },
  // Additional state for admission numbers
  studentAdmissionNumbers: [],

  // Fetch all students with pagination and search
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

      if (error.response?.status !== 404) {
        toast.error(errorMessage);
      }
    }
  },

  // Fetch single student by ID
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

  // Fetch student with enrollments
  fetchStudentWithEnrollments: async (id) => {
    set({ loading: true, error: null });

    try {
      const response = await studentAPI.getStudentWithEnrollments(id);
      const student = response.data.data;

      set({
        currentStudent: student,
        studentAdmissionNumbers: student.admissionNumbers || [],
        loading: false,
      });

      return { success: true, data: student };
    } catch (error) {
      const errorMessage =
        error.response?.data?.message || "Failed to fetch student with enrollments";
      set({ error: errorMessage, loading: false });

      if (error.response?.status === 404) {
        toast.error("Student not found");
      } else {
        toast.error(errorMessage);
      }

      return { success: false, message: errorMessage };
    }
  },

  // Fetch student count for sidebar
  fetchStudentCount: async () => {
    try {
      const response = await studentAPI.getStudentCount();
      const data = response.data.data || {};
      const newCount = data.total || 0;
      
      if (get().studentCount !== newCount) {
        set({ studentCount: newCount });
      }
      
      return { total: data.total || 0, enrolled: data.enrolled || 0, notEnrolled: data.notEnrolled || 0 };
    } catch (error) {
      console.warn("Failed to fetch student count:", error);
      return { total: get().studentCount, enrolled: 0, notEnrolled: 0 };
    }
  },

  // Start polling for student count
  startPolling: () => {
    if (get().pollingInterval) {
      clearInterval(get().pollingInterval);
    }
    
    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        get().fetchStudentCount();
      }
    }, 60000);
    
    set({ pollingInterval: interval });
    get().fetchStudentCount();
  },
  
  // Stop polling
  stopPolling: () => {
    if (get().pollingInterval) {
      clearInterval(get().pollingInterval);
      set({ pollingInterval: null });
    }
  },

  // FIXED: Create new student - ensure proper return structure
  createStudent: async (studentData) => {
    set({ loading: true, error: null });

    try {
      // studentId will be null - backend handles this
      const response = await studentAPI.createStudent(studentData);
      console.log("Create student response:", response.data); // Debug log
      
      const newStudent = response.data.data;

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

      toast.success(response.data.message || "Student created successfully!");
      // Return the student data with _id for navigation
      return { success: true, data: newStudent };
    } catch (error) {
      let errorMessage = "Failed to create student";

      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.data?.errors) {
        const errors = error.response.data.errors;
        errorMessage = Object.values(errors).join(", ");
      }

      set({ error: errorMessage, loading: false });
      toast.error(errorMessage);
      return { success: false, message: errorMessage, data: null };
    }
  },

  // Update student
  updateStudent: async (id, studentData) => {
    set({ loading: true, error: null });

    try {
      const response = await studentAPI.updateStudent(id, studentData);
      const updatedStudent = response.data.data;

      const { students } = get();
      const updatedStudents = students.map((student) =>
        student._id === id ? updatedStudent : student
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
        const errors = error.response.data.errors;
        errorMessage = Object.values(errors).join(", ");
      }

      set({ error: errorMessage, loading: false });
      toast.error(errorMessage);
      return { success: false, message: errorMessage };
    }
  },

  // Delete student
  deleteStudent: async (id) => {
    set({ loading: true, error: null });

    try {
      await studentAPI.deleteStudent(id);

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

  // Helper method to get student display admission numbers
  getStudentDisplayAdmissionNumbers: (student) => {
    if (!student) return "Not enrolled";
    if (student.admissionNumbers && student.admissionNumbers.length > 0) {
      return student.admissionNumbers.map(a => a.admissionNumber).join(", ");
    }
    if (student.enrollments && student.enrollments.length > 0) {
      return student.enrollments.map(e => e.admissionNumber).filter(Boolean).join(", ");
    }
    return "Not enrolled";
  },

  // Helper method to check if student has any enrollments
  hasEnrollments: (student) => {
    if (!student) return false;
    return (student.admissionNumbers?.length > 0) || 
           (student.enrollments?.length > 0) ||
           student.hasEnrollments === true;
  },

  // Get student enrollment status text
  getEnrollmentStatusText: (student) => {
    if (!student) return "Not enrolled";
    const hasEnroll = get().hasEnrollments(student);
    return hasEnroll ? "Enrolled" : "Not enrolled";
  },

  // Get student fee summary
  fetchStudentFees: async (id) => {
    set({ loading: true, error: null });

    try {
      const response = await studentAPI.getStudentFees(id);
      
      set({
        studentFeeSummary: response.data.data,
        loading: false,
      });

      return { success: true, data: response.data.data };
    } catch (error) {
      const errorMessage =
        error.response?.data?.message || "Failed to fetch student fees";
      set({ error: errorMessage, loading: false });
      toast.error(errorMessage);
      return { success: false, message: errorMessage };
    }
  },

  // Get student payment history
  fetchStudentPayments: async (id, params = {}) => {
    set({ loading: true, error: null });

    try {
      const response = await studentAPI.getStudentPayments(id, params);
      
      set({
        studentPayments: response.data.data,
        paymentsPagination: response.data.pagination,
        loading: false,
      });

      return { success: true, data: response.data.data };
    } catch (error) {
      const errorMessage =
        error.response?.data?.message || "Failed to fetch student payments";
      set({ error: errorMessage, loading: false });
      return { success: false, message: errorMessage };
    }
  },

  // Get student attendance summary
  fetchStudentAttendance: async (id, params = {}) => {
    set({ loading: true, error: null });

    try {
      const response = await studentAPI.getStudentAttendance(id, params);
      
      set({
        studentAttendance: response.data.data,
        loading: false,
      });

      return { success: true, data: response.data.data };
    } catch (error) {
      const errorMessage =
        error.response?.data?.message || "Failed to fetch student attendance";
      set({ error: errorMessage, loading: false });
      return { success: false, message: errorMessage };
    }
  },

  // Get student grades
  fetchStudentGrades: async (id, params = {}) => {
    set({ loading: true, error: null });

    try {
      const response = await studentAPI.getStudentGrades(id, params);
      
      set({
        studentGrades: response.data.data,
        loading: false,
      });

      return { success: true, data: response.data.data };
    } catch (error) {
      const errorMessage =
        error.response?.data?.message || "Failed to fetch student grades";
      set({ error: errorMessage, loading: false });
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

  // Clear current student
  clearCurrentStudent: () => {
    set({ currentStudent: null, studentAdmissionNumbers: [] });
  },

  // Clear all student data
  clearAllStudents: () => {
    set({
      students: [],
      currentStudent: null,
      studentFeeSummary: null,
      studentPayments: [],
      studentAttendance: null,
      studentGrades: [],
      studentAdmissionNumbers: [],
      loading: false,
      error: null,
    });
  },

  // Reset store
  resetStudentStore: () => {
    set({
      students: [],
      currentStudent: null,
      loading: false,
      error: null,
      searchTerm: "",
      studentCount: 0,
      studentAdmissionNumbers: [],
      pagination: {
        current: 1,
        total: 1,
        results: 0,
        limit: 10,
      },
    });
  }
}));