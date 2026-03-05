// src/stores/gradeStore.js
import { create } from 'zustand';
import { gradeAPI } from '../services/gradeAPI';
import toast from 'react-hot-toast';

export const useGradeStore = create((set, get) => ({
  // ============= STATE =============
  
  // Grade data
  courseGrades: [],
  studentGrades: [],
  currentGrade: null,
  
  // Statistics
  gradeStatistics: {
    overview: {
      averageScore: 0,
      averagePercentage: 0,
      highestScore: 0,
      lowestScore: 0,
      totalAssessments: 0,
      totalStudents: 0
    },
    distribution: [],
    byAssessmentType: [],
    topStudents: []
  },
  
  // Grading scales
  gradingScales: [],
  currentScale: null,
  
  // UI State
  loading: false,
  error: null,
  
  // Filters and pagination
  filters: {
    term: '',
    academicYear: '',
    assessmentType: '',
    studentId: '',
    page: 1,
    limit: 50
  },
  
  pagination: {
    current: 1,
    total: 1,
    results: 0,
    limit: 50
  },
  
  // Selected items for bulk actions
  selectedGrades: [],
  
  // ============= GRADE CRUD ACTIONS =============

  /**
   * Fetch grades for a course
   * @param {string} courseId - Course ID
   * @param {Object} customFilters - Optional filters to override defaults
   */
  fetchCourseGrades: async (courseId, customFilters = {}) => {
    set({ loading: true, error: null });
    
    const currentFilters = { ...get().filters, ...customFilters };
    
    try {
      const result = await gradeAPI.getCourseGrades(courseId, currentFilters);
      
      if (result.success) {
        set({
          courseGrades: result.data || [],
          gradeStatistics: {
            overview: result.statistics || get().gradeStatistics.overview,
            distribution: result.distribution || [],
            byAssessmentType: result.statistics?.byAssessmentType || []
          },
          pagination: result.pagination || get().pagination,
          filters: currentFilters,
          loading: false
        });
      } else {
        set({ error: result.message, loading: false });
        toast.error(result.message);
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to fetch course grades';
      set({ error: errorMessage, loading: false });
      toast.error(errorMessage);
    }
  },

  /**
   * Fetch grades for a student
   * @param {string} studentId - Student ID
   * @param {Object} customFilters - Optional filters
   */
  fetchStudentGrades: async (studentId, customFilters = {}) => {
    set({ loading: true, error: null });
    
    const currentFilters = { ...get().filters, ...customFilters };
    
    try {
      const result = await gradeAPI.getStudentGrades(studentId, currentFilters);
      
      if (result.success) {
        set({
          studentGrades: result.data || [],
          pagination: result.pagination || get().pagination,
          filters: currentFilters,
          loading: false
        });
        
        return result.data;
      } else {
        set({ error: result.message, loading: false });
        toast.error(result.message);
        return [];
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to fetch student grades';
      set({ error: errorMessage, loading: false });
      toast.error(errorMessage);
      return [];
    }
  },

  /**
   * Fetch grades for a specific student in a specific course
   * @param {string} studentId - Student ID
   * @param {string} courseId - Course ID
   * @param {Object} params - Additional params (term, academicYear)
   */
  fetchStudentCourseGrades: async (studentId, courseId, params = {}) => {
    set({ loading: true, error: null });
    
    try {
      const result = await gradeAPI.getStudentCourseGrades(studentId, courseId, params);
      
      if (result.success) {
        set({
          courseGrades: result.data?.grades || [],
          currentGrade: result.data?.summary || null,
          loading: false
        });
        
        return result.data;
      } else {
        set({ error: result.message, loading: false });
        toast.error(result.message);
        return null;
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to fetch student course grades';
      set({ error: errorMessage, loading: false });
      toast.error(errorMessage);
      return null;
    }
  },

  /**
   * Create a new grade
   * @param {Object} gradeData - Grade data
   */
  createGrade: async (gradeData) => {
    set({ loading: true, error: null });
    
    try {
      const result = await gradeAPI.createGrade(gradeData);
      
      if (result.success) {
        // Refresh the current view if applicable
        const { filters, courseGrades } = get();
        if (gradeData.course) {
          await get().fetchCourseGrades(gradeData.course, filters);
        }
        
        set({ loading: false });
        return { success: true, data: result.data };
      } else {
        set({ error: result.message, loading: false });
        return { success: false, message: result.message };
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to create grade';
      set({ error: errorMessage, loading: false });
      return { success: false, message: errorMessage };
    }
  },

  /**
   * Bulk create grades
   * @param {Array} grades - Array of grade objects
   * @param {string} courseId - Course ID for refresh
   */
  bulkCreateGrades: async (grades, courseId) => {
    set({ loading: true, error: null });
    
    try {
      const result = await gradeAPI.bulkCreateGrades(grades);
      
      if (result.success) {
        if (courseId) {
          await get().fetchCourseGrades(courseId);
        }
        
        set({ loading: false });
        return { 
          success: true, 
          data: result.data,
          summary: {
            successful: result.data?.successful?.length || 0,
            failed: result.data?.errors?.length || 0
          }
        };
      } else {
        set({ error: result.message, loading: false });
        return { success: false, message: result.message };
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to bulk create grades';
      set({ error: errorMessage, loading: false });
      return { success: false, message: errorMessage };
    }
  },

  /**
   * Update a grade
   * @param {string} gradeId - Grade ID
   * @param {Object} updates - Fields to update
   * @param {string} courseId - Course ID for refresh
   */
  updateGrade: async (gradeId, updates, courseId) => {
    set({ loading: true, error: null });
    
    try {
      const result = await gradeAPI.updateGrade(gradeId, updates);
      
      if (result.success) {
        // Update local state
        const { courseGrades } = get();
        const updatedGrades = courseGrades.map(grade =>
          grade._id === gradeId ? { ...grade, ...result.data } : grade
        );
        
        set({ 
          courseGrades: updatedGrades,
          currentGrade: result.data,
          loading: false 
        });
        
        // Refresh if needed
        if (courseId) {
          await get().fetchCourseGrades(courseId);
        }
        
        return { success: true, data: result.data };
      } else {
        set({ error: result.message, loading: false });
        return { success: false, message: result.message };
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to update grade';
      set({ error: errorMessage, loading: false });
      return { success: false, message: errorMessage };
    }
  },

  /**
   * Delete a grade
   * @param {string} gradeId - Grade ID
   * @param {string} courseId - Course ID for refresh
   */
  deleteGrade: async (gradeId, courseId) => {
    set({ loading: true, error: null });
    
    try {
      const result = await gradeAPI.deleteGrade(gradeId);
      
      if (result.success) {
        // Remove from local state
        const { courseGrades, selectedGrades } = get();
        const filteredGrades = courseGrades.filter(grade => grade._id !== gradeId);
        const filteredSelected = selectedGrades.filter(id => id !== gradeId);
        
        set({ 
          courseGrades: filteredGrades,
          selectedGrades: filteredSelected,
          loading: false 
        });
        
        // Refresh if needed
        if (courseId) {
          await get().fetchCourseGrades(courseId);
        }
        
        return { success: true };
      } else {
        set({ error: result.message, loading: false });
        return { success: false, message: result.message };
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to delete grade';
      set({ error: errorMessage, loading: false });
      return { success: false, message: errorMessage };
    }
  },

  // ============= GRADE CALCULATION ACTIONS =============

  /**
   * Calculate final grade for a student
   * @param {string} studentId - Student ID
   * @param {string} courseId - Course ID
   * @param {Object} data - Additional data
   */
  calculateFinalGrade: async (studentId, courseId, data = {}) => {
    set({ loading: true, error: null });
    
    try {
      const result = await gradeAPI.calculateFinalGrade(studentId, courseId, data);
      
      if (result.success) {
        toast.success('Final grade calculated successfully');
        set({ loading: false });
        return { success: true, data: result.data };
      } else {
        set({ error: result.message, loading: false });
        return { success: false, message: result.message };
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to calculate final grade';
      set({ error: errorMessage, loading: false });
      return { success: false, message: errorMessage };
    }
  },

  /**
   * Publish grades for a course
   * @param {string} courseId - Course ID
   * @param {Array} studentIds - Optional student IDs to publish for
   * @param {Array} assessmentIds - Optional assessment IDs to publish
   */
  publishGrades: async (courseId, studentIds = [], assessmentIds = []) => {
    set({ loading: true, error: null });
    
    try {
      const result = await gradeAPI.publishGrades(courseId, { studentIds, assessmentIds });
      
      if (result.success) {
        // Refresh the view
        await get().fetchCourseGrades(courseId);
        
        set({ loading: false });
        return { success: true, data: result.data };
      } else {
        set({ error: result.message, loading: false });
        return { success: false, message: result.message };
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to publish grades';
      set({ error: errorMessage, loading: false });
      return { success: false, message: errorMessage };
    }
  },

  // ============= STATISTICS ACTIONS =============

  /**
   * Fetch grade statistics for a course
   * @param {string} courseId - Course ID
   * @param {Object} params - Query parameters
   */
  fetchGradeStatistics: async (courseId, params = {}) => {
    set({ loading: true, error: null });
    
    try {
      const result = await gradeAPI.getGradeStatistics(courseId, params);
      
      if (result.success) {
        set({
          gradeStatistics: result.data || get().gradeStatistics,
          loading: false
        });
        return { success: true, data: result.data };
      } else {
        set({ error: result.message, loading: false });
        return { success: false, message: result.message };
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to fetch grade statistics';
      set({ error: errorMessage, loading: false });
      return { success: false, message: errorMessage };
    }
  },

  // ============= EXPORT ACTIONS =============

  /**
   * Export grades
   * @param {string} courseId - Course ID
   * @param {Object} params - Export parameters
   */
  exportGrades: async (courseId, params = {}) => {
    set({ loading: true, error: null });
    
    try {
      const result = await gradeAPI.exportGrades(courseId, params);
      
      if (result.success) {
        set({ loading: false });
        return { success: true };
      } else {
        set({ error: result.message, loading: false });
        return { success: false, message: result.message };
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to export grades';
      set({ error: errorMessage, loading: false });
      return { success: false, message: errorMessage };
    }
  },

  // ============= GRADING SCALE ACTIONS =============

  /**
   * Fetch all grading scales
   * @param {Object} params - Query parameters
   */
  fetchGradingScales: async (params = {}) => {
    set({ loading: true, error: null });
    
    try {
      const result = await gradeAPI.getGradingScales(params);
      
      if (result.success) {
        set({
          gradingScales: result.data || [],
          loading: false
        });
        return result.data;
      } else {
        set({ error: result.message, loading: false });
        toast.error(result.message);
        return [];
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to fetch grading scales';
      set({ error: errorMessage, loading: false });
      toast.error(errorMessage);
      return [];
    }
  },

  /**
   * Create a new grading scale
   * @param {Object} scaleData - Grading scale data
   */
  createGradingScale: async (scaleData) => {
    set({ loading: true, error: null });
    
    try {
      const result = await gradeAPI.createGradingScale(scaleData);
      
      if (result.success) {
        // Refresh scales list
        await get().fetchGradingScales();
        
        set({ loading: false });
        return { success: true, data: result.data };
      } else {
        set({ error: result.message, loading: false });
        return { success: false, message: result.message };
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to create grading scale';
      set({ error: errorMessage, loading: false });
      return { success: false, message: errorMessage };
    }
  },

  // ============= BULK SELECTION ACTIONS =============

  /**
   * Select a grade for bulk actions
   * @param {string} gradeId - Grade ID
   */
  selectGrade: (gradeId) => {
    const { selectedGrades } = get();
    if (!selectedGrades.includes(gradeId)) {
      set({ selectedGrades: [...selectedGrades, gradeId] });
    }
  },

  /**
   * Deselect a grade
   * @param {string} gradeId - Grade ID
   */
  deselectGrade: (gradeId) => {
    const { selectedGrades } = get();
    set({ selectedGrades: selectedGrades.filter(id => id !== gradeId) });
  },

  /**
   * Select all visible grades
   */
  selectAllGrades: () => {
    const { courseGrades } = get();
    set({ selectedGrades: courseGrades.map(g => g._id) });
  },

  /**
   * Clear all selected grades
   */
  clearSelectedGrades: () => {
    set({ selectedGrades: [] });
  },

  // ============= FILTER ACTIONS =============

  /**
   * Set filters
   * @param {Object} newFilters - New filter values
   */
  setFilters: (newFilters) => {
    set({ 
      filters: { ...get().filters, ...newFilters, page: 1 } // Reset to first page
    });
  },

  /**
   * Set current page
   * @param {number} page - Page number
   */
  setPage: (page) => {
    set({ filters: { ...get().filters, page } });
  },

  /**
   * Reset all filters
   */
  resetFilters: () => {
    set({
      filters: {
        term: '',
        academicYear: '',
        assessmentType: '',
        studentId: '',
        page: 1,
        limit: 50
      }
    });
  },

  // ============= UTILITY FUNCTIONS =============

  /**
   * Calculate GPA from grades
   * @param {Array} grades - Array of grades
   * @returns {number}
   */
  calculateGPA: (grades) => {
    if (!grades || grades.length === 0) return 0;
    
    let totalPoints = 0;
    let totalCredits = 0;
    
    grades.forEach(grade => {
      if (grade.letterGrade && grade.weight) {
        const points = gradeAPI.getGradePoints(grade.letterGrade);
        totalPoints += points * grade.weight;
        totalCredits += grade.weight;
      }
    });
    
    return totalCredits > 0 ? (totalPoints / totalCredits).toFixed(2) : 0;
  },

  /**
   * Get grade summary for a student
   * @param {string} studentId - Student ID
   * @param {string} academicYear - Academic year
   */
  getStudentGradeSummary: async (studentId, academicYear = null) => {
    const grades = await get().fetchStudentGrades(studentId, { academicYear });
    
    if (!grades || grades.length === 0) {
      return {
        totalCourses: 0,
        totalCredits: 0,
        gpa: 0,
        byTerm: {}
      };
    }

    // Group by course
    const courseMap = new Map();
    grades.forEach(grade => {
      const courseId = grade.course?._id;
      if (!courseMap.has(courseId)) {
        courseMap.set(courseId, {
          course: grade.course,
          grades: [],
          totalWeight: 0,
          weightedSum: 0
        });
      }
      const courseData = courseMap.get(courseId);
      courseData.grades.push(grade);
      
      if (!grade.isDropped && grade.percentage) {
        courseData.weightedSum += grade.percentage * grade.weight;
        courseData.totalWeight += grade.weight;
      }
    });

    // Calculate course averages and GPA
    const courseAverages = [];
    let totalGradePoints = 0;
    let totalCredits = 0;

    courseMap.forEach((data, courseId) => {
      const average = data.totalWeight > 0 ? data.weightedSum / data.totalWeight : 0;
      const letterGrade = gradeAPI.calculateLetterGrade(average);
      const gradePoints = gradeAPI.getGradePoints(letterGrade);
      
      courseAverages.push({
        course: data.course,
        average: Math.round(average * 10) / 10,
        letterGrade,
        gradePoints,
        credits: data.totalWeight
      });

      totalGradePoints += gradePoints * data.totalWeight;
      totalCredits += data.totalWeight;
    });

    return {
      totalCourses: courseMap.size,
      totalCredits,
      gpa: totalCredits > 0 ? (totalGradePoints / totalCredits).toFixed(2) : 0,
      courses: courseAverages,
      byTerm: {} // Can be implemented if needed
    };
  },

  /**
   * Clear all grade data
   */
  clearGrades: () => {
    set({
      courseGrades: [],
      studentGrades: [],
      currentGrade: null,
      gradeStatistics: {
        overview: {
          averageScore: 0,
          averagePercentage: 0,
          highestScore: 0,
          lowestScore: 0,
          totalAssessments: 0,
          totalStudents: 0
        },
        distribution: [],
        byAssessmentType: [],
        topStudents: []
      },
      selectedGrades: [],
      error: null
    });
  },

  /**
   * Clear error
   */
  clearError: () => {
    set({ error: null });
  }
}));