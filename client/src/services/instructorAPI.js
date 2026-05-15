// frontend/src/services/instructorAPI.js
import api from "./api";

export const instructorAPI = {
  // Get all instructors with pagination and search
  getInstructors: (params = {}) => {
    const { page = 1, limit = 10, search = "", department = "", status = "" } = params;
    return api.get("/instructors", {
      params: { page, limit, search, department, status },
    });
  },

  // Get single instructor by ID
  getInstructor: (id) => {
    return api.get(`/instructors/${id}`);
  },

  // Create new instructor
  createInstructor: (instructorData) => {
    return api.post("/instructors", instructorData);
  },

  // Update instructor
  updateInstructor: (id, instructorData) => {
    return api.put(`/instructors/${id}`, instructorData);
  },

  // Delete instructor
  deleteInstructor: (id) => {
    return api.delete(`/instructors/${id}`);
  },

  // Get instructor count for sidebar
  getInstructorCount: () => {
    return api.get("/instructors/count");
  },

  // Get instructor statistics for dashboard
  getInstructorStats: () => {
    return api.get("/instructors/stats");
  },

  // Record salary payment
  recordSalaryPayment: (id, paymentData) => {
    return api.post(`/instructors/${id}/salary-payment`, paymentData);
  },

  // Get instructor's assigned courses
  getInstructorCourses: (id) => {
    return api.get(`/instructors/${id}/courses`);
  },

  // Update instructor workload
  updateInstructorWorkload: (id) => {
    return api.put(`/instructors/${id}/update-workload`);
  }
};

export default instructorAPI;