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

  // Create new student
  createStudent: (studentData) => {
    return api.post("/students", studentData);
  },

  // Update student
  updateStudent: (id, studentData) => {
    return api.put(`/students/${id}`, studentData);
  },
  // Get student count
  getStudentCount: () => {
    return api.get("/students/count");
  },

  // Get student stats
  getStudentStats: () => {
    return api.get("/students/stats");
  },

  // Delete student
  deleteStudent: (id) => {
    return api.delete(`/students/${id}`);
  },
};

export default studentAPI;
