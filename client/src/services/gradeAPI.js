// src/services/gradeAPI.js
import api from "./api";
import toast from "react-hot-toast";

export const gradeAPI = {
  // ============= GRADE CRUD OPERATIONS =============

  /**
   * Create a single grade
   * @param {Object} gradeData - Grade data
   * @returns {Promise<Object>}
   */
  createGrade: async (gradeData) => {
    try {
      const response = await api.post("/grades", gradeData);
      toast.success("Grade created successfully!");
      return {
        success: true,
        data: response.data.data,
      };
    } catch (error) {
      const errorMessage =
        error.response?.data?.message || "Failed to create grade";
      toast.error(errorMessage);
      return {
        success: false,
        message: errorMessage,
      };
    }
  },

  /**
   * Bulk create grades
   * @param {Array} grades - Array of grade objects
   * @returns {Promise<Object>}
   */
  bulkCreateGrades: async (grades) => {
    try {
      const response = await api.post("/grades/bulk", { grades });
      toast.success(response.data.message || "Grades uploaded successfully!");
      return {
        success: true,
        data: response.data.data,
      };
    } catch (error) {
      const errorMessage =
        error.response?.data?.message || "Failed to upload grades";
      toast.error(errorMessage);
      return {
        success: false,
        message: errorMessage,
      };
    }
  },

  // In gradeAPI.js, update the getCourseGrades function:

  /**
   * Get all grades for a course
   * @param {string} courseId - Course ID
   * @param {Object} params - Query parameters (term, academicYear, assessmentType, studentId, page, limit)
   * @returns {Promise<Object>}
   */
  getCourseGrades: async (courseId, params = {}) => {
    try {
      const response = await api.get(`/grades/course/${courseId}`, { params });

      // Ensure student data is properly structured
      const grades =
        response.data.data?.map((grade) => ({
          ...grade,
          student: grade.student || {
            _id: grade.student?._id,
            studentId: grade.student?.studentId || "N/A",
            user: {
              name: grade.student?.user?.name || "Unknown Student",
              email: grade.student?.user?.email || "",
            },
          },
        })) || [];

      return {
        success: true,
        data: grades,
        statistics: response.data.statistics,
        distribution: response.data.distribution,
        pagination: response.data.pagination,
      };
    } catch (error) {
      const errorMessage =
        error.response?.data?.message || "Failed to fetch course grades";
      toast.error(errorMessage);
      return {
        success: false,
        message: errorMessage,
      };
    }
  },

  // In gradeAPI.js, update the getStudentGrades function:

  /**
   * Get all grades for a student
   * @param {string} studentId - Student ID
   * @param {Object} params - Query parameters (academicYear, courseId, page, limit)
   * @returns {Promise<Object>}
   */
  getStudentGrades: async (studentId, params = {}) => {
    try {
      const response = await api.get(`/grades/student/${studentId}`, {
        params,
      });

      // Ensure course data is properly structured
      const grades =
        response.data.data?.map((grade) => ({
          ...grade,
          course: grade.course || {
            _id: grade.course?._id,
            courseCode: grade.course?.courseCode || "N/A",
            name: grade.course?.name || "Unknown Course",
          },
        })) || [];

      return {
        success: true,
        data: grades,
        courseStats: response.data.courseStats,
        pagination: response.data.pagination,
      };
    } catch (error) {
      const errorMessage =
        error.response?.data?.message || "Failed to fetch student grades";
      toast.error(errorMessage);
      return {
        success: false,
        message: errorMessage,
      };
    }
  },

  /**
   * Get grades for a specific student in a specific course
   * @param {string} studentId - Student ID
   * @param {string} courseId - Course ID
   * @param {Object} params - Query parameters (term, academicYear)
   * @returns {Promise<Object>}
   */
  getStudentCourseGrades: async (studentId, courseId, params = {}) => {
    try {
      const response = await api.get(
        `/grades/student/${studentId}/course/${courseId}`,
        { params },
      );
      return {
        success: true,
        data: response.data.data,
        summary: response.data.summary,
      };
    } catch (error) {
      const errorMessage =
        error.response?.data?.message ||
        "Failed to fetch student course grades";
      toast.error(errorMessage);
      return {
        success: false,
        message: errorMessage,
      };
    }
  },

  /**
   * Update a grade
   * @param {string} gradeId - Grade ID
   * @param {Object} updates - Fields to update
   * @returns {Promise<Object>}
   */
  updateGrade: async (gradeId, updates) => {
    try {
      const response = await api.put(`/grades/${gradeId}`, updates);
      toast.success("Grade updated successfully!");
      return {
        success: true,
        data: response.data.data,
      };
    } catch (error) {
      const errorMessage =
        error.response?.data?.message || "Failed to update grade";
      toast.error(errorMessage);
      return {
        success: false,
        message: errorMessage,
      };
    }
  },

  /**
   * Delete a grade
   * @param {string} gradeId - Grade ID
   * @returns {Promise<Object>}
   */
  deleteGrade: async (gradeId) => {
    try {
      const response = await api.delete(`/grades/${gradeId}`);
      toast.success("Grade deleted successfully!");
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      const errorMessage =
        error.response?.data?.message || "Failed to delete grade";
      toast.error(errorMessage);
      return {
        success: false,
        message: errorMessage,
      };
    }
  },

  // ============= GRADE CALCULATIONS =============

  /**
   * Calculate final grade for a student in a course
   * @param {string} studentId - Student ID
   * @param {string} courseId - Course ID
   * @param {Object} data - { term, academicYear }
   * @returns {Promise<Object>}
   */
  calculateFinalGrade: async (studentId, courseId, data = {}) => {
    try {
      const response = await api.post(
        `/grades/calculate/${studentId}/${courseId}`,
        data,
      );
      toast.success("Final grade calculated successfully!");
      return {
        success: true,
        data: response.data.data,
        calculation: response.data.calculation,
      };
    } catch (error) {
      const errorMessage =
        error.response?.data?.message || "Failed to calculate final grade";
      toast.error(errorMessage);
      return {
        success: false,
        message: errorMessage,
      };
    }
  },

  /**
   * Publish grades for a course
   * @param {string} courseId - Course ID
   * @param {Object} options - { studentIds, assessmentIds }
   * @returns {Promise<Object>}
   */
  publishGrades: async (courseId, options = {}) => {
    try {
      const response = await api.post(`/grades/publish/${courseId}`, options);
      toast.success(response.data.message || "Grades published successfully!");
      return {
        success: true,
        data: response.data.data,
      };
    } catch (error) {
      const errorMessage =
        error.response?.data?.message || "Failed to publish grades";
      toast.error(errorMessage);
      return {
        success: false,
        message: errorMessage,
      };
    }
  },

  // ============= GRADE STATISTICS =============

  /**
   * Get grade statistics for a course
   * @param {string} courseId - Course ID
   * @param {Object} params - { term, academicYear }
   * @returns {Promise<Object>}
   */
  getGradeStatistics: async (courseId, params = {}) => {
    try {
      const response = await api.get(`/grades/stats/${courseId}`, { params });
      return {
        success: true,
        data: response.data.data,
      };
    } catch (error) {
      const errorMessage =
        error.response?.data?.message || "Failed to fetch grade statistics";
      toast.error(errorMessage);
      return {
        success: false,
        message: errorMessage,
      };
    }
  },

  // ============= GRADE EXPORT =============

  /**
   * Export grades as CSV
   * @param {string} courseId - Course ID
   * @param {Object} params - { format, term, academicYear }
   * @returns {Promise<Object>}
   */
  exportGrades: async (courseId, params = {}) => {
    try {
      const response = await api.get(`/grades/export/${courseId}`, {
        params,
        responseType: "blob",
      });

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        `grades_${courseId}_${new Date().toISOString().split("T")[0]}.csv`,
      );
      document.body.appendChild(link);
      link.click();
      link.remove();

      toast.success("Grades exported successfully!");
      return {
        success: true,
      };
    } catch (error) {
      const errorMessage =
        error.response?.data?.message || "Failed to export grades";
      toast.error(errorMessage);
      return {
        success: false,
        message: errorMessage,
      };
    }
  },

  // ============= GRADING SCALES =============

  /**
   * Get all grading scales
   * @param {Object} params - { type, courseId }
   * @returns {Promise<Object>}
   */
  getGradingScales: async (params = {}) => {
    try {
      const response = await api.get("/grades/scales", { params });
      return {
        success: true,
        data: response.data.data,
      };
    } catch (error) {
      const errorMessage =
        error.response?.data?.message || "Failed to fetch grading scales";
      toast.error(errorMessage);
      return {
        success: false,
        message: errorMessage,
      };
    }
  },

  /**
   * Create a new grading scale (Admin only)
   * @param {Object} scaleData - Grading scale data
   * @returns {Promise<Object>}
   */
  createGradingScale: async (scaleData) => {
    try {
      const response = await api.post("/grades/scales", scaleData);
      toast.success("Grading scale created successfully!");
      return {
        success: true,
        data: response.data.data,
      };
    } catch (error) {
      const errorMessage =
        error.response?.data?.message || "Failed to create grading scale";
      toast.error(errorMessage);
      return {
        success: false,
        message: errorMessage,
      };
    }
  },

  // ============= HELPER FUNCTIONS =============

  /**
   * Get available assessment types
   * @returns {Array}
   */
  getAssessmentTypes: () => {
    return [
      { value: "quiz", label: "Quiz", color: "blue" },
      { value: "assignment", label: "Assignment", color: "green" },
      { value: "midterm", label: "Midterm Exam", color: "purple" },
      { value: "final", label: "Final Exam", color: "red" },
      { value: "project", label: "Project", color: "orange" },
      { value: "participation", label: "Participation", color: "yellow" },
      { value: "lab", label: "Lab Work", color: "indigo" },
      { value: "presentation", label: "Presentation", color: "pink" },
    ];
  },

  /**
   * Get available terms
   * @returns {Array}
   */
  getTerms: () => {
    return [
      { value: "Term 1", label: "Term 1" },
      { value: "Term 2", label: "Term 2" },
      { value: "Term 3", label: "Term 3" },
      { value: "Final", label: "Final" },
      { value: "Summer", label: "Summer" },
    ];
  },

  /**
   * Generate academic years
   * @returns {Array}
   */
  getAcademicYears: () => {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let i = 0; i < 5; i++) {
      const start = currentYear - 2 + i;
      const end = start + 1;
      years.push({
        value: `${start}-${end}`,
        label: `${start}/${end}`,
      });
    }
    return years;
  },

  /**
   * Calculate letter grade from percentage based on standard scale
   * @param {number} percentage
   * @returns {string}
   */
  calculateLetterGrade: (percentage) => {
    if (percentage >= 97) return "A+";
    if (percentage >= 93) return "A";
    if (percentage >= 90) return "A-";
    if (percentage >= 87) return "B+";
    if (percentage >= 83) return "B";
    if (percentage >= 80) return "B-";
    if (percentage >= 77) return "C+";
    if (percentage >= 73) return "C";
    if (percentage >= 70) return "C-";
    if (percentage >= 67) return "D+";
    if (percentage >= 63) return "D";
    if (percentage >= 60) return "D-";
    return "F";
  },

  /**
   * Calculate grade points for GPA
   * @param {string} letterGrade
   * @returns {number}
   */
  getGradePoints: (letterGrade) => {
    const points = {
      "A+": 4.0,
      A: 4.0,
      "A-": 3.7,
      "B+": 3.3,
      B: 3.0,
      "B-": 2.7,
      "C+": 2.3,
      C: 2.0,
      "C-": 1.7,
      "D+": 1.3,
      D: 1.0,
      "D-": 0.7,
      F: 0.0,
    };
    return points[letterGrade] || 0;
  },

  /**
   * Get color class based on percentage
   * @param {number} percentage
   * @returns {string}
   */
  getGradeColorClass: (percentage) => {
    if (percentage >= 90) return "text-green-600 bg-green-100";
    if (percentage >= 80) return "text-blue-600 bg-blue-100";
    if (percentage >= 70) return "text-yellow-600 bg-yellow-100";
    if (percentage >= 60) return "text-orange-600 bg-orange-100";
    return "text-red-600 bg-red-100";
  },
};

export default gradeAPI;
