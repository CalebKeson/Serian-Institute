// src/services/studentAPI.js
import api from "./api";

export const studentAPI = {
  // Get all students with pagination and search
  getStudents: (params = {}) => {
    const { page = 1, limit = 10, search = "" } = params;
    return api.get("/students", {
      params: { page, limit, search },
    });
  },

  // Get single student by ID
  getStudent: (id) => {
    return api.get(`/students/${id}`);
  },

  // NEW: Get single student with enrollments (includes course data)
  getStudentWithEnrollments: (id) => {
    return api.get(`/students/${id}/with-enrollments`);
  },

  // Create new student
  createStudent: (studentData) => {
    return api.post("/students", studentData);
  },

  // Update student
  updateStudent: (id, studentData) => {
    return api.put(`/students/${id}`, studentData);
  },

  // Get student count for sidebar
  getStudentCount: () => {
    return api.get("/students/count");
  },

  // Get student statistics for dashboard
  getStudentStats: () => {
    return api.get("/students/stats");
  },

  // Delete student
  deleteStudent: (id) => {
    return api.delete(`/students/${id}`);
  },

  // Get available students for enrollment (not enrolled in a specific course)
  getAvailableStudents: (courseId, search = "") => {
    return api.get(`/students/available/${courseId}`, {
      params: { search },
    });
  },

  // Get student fee summary
  getStudentFees: (id) => {
    return api.get(`/students/${id}/fees`);
  },

  // Get student payment history
  getStudentPayments: (id, params = {}) => {
    const { page = 1, limit = 10, startDate, endDate } = params;
    return api.get(`/payments`, {
      params: { 
        studentId: id, 
        page, 
        limit, 
        startDate, 
        endDate,
        status: 'completed'
      }
    });
  },

  // Get student attendance summary
  getStudentAttendance: (id, params = {}) => {
    const { startDate, endDate, courseId } = params;
    return api.get(`/attendance/student/${id}/summary`, {
      params: { startDate, endDate, courseId }
    });
  },

  // Get student grades
  getStudentGrades: (id, params = {}) => {
    const { academicYear, courseId } = params;
    return api.get(`/grades/student/${id}`, {
      params: { academicYear, courseId }
    });
  }
};

export default studentAPI;