import api from './api';

export const courseAPI = {
  // Get all courses with pagination and filters
  getCourses: (params = {}) => {
    const { 
      page = 1, 
      limit = 10, 
      search = '', 
      courseType = '', 
      intakeMonth = '', 
      status = '', 
      instructor = '' 
    } = params;
    
    return api.get('/courses', {
      params: { 
        page, 
        limit, 
        search, 
        courseType, 
        intakeMonth, 
        status, 
        instructor 
      }
    });
  },

  // ADD THIS: Get course count for sidebar
  getCourseCount: () => {
    return api.get('/courses/count');
  },

  // Get single course by ID
  getCourse: (id) => {
    return api.get(`/courses/${id}`);
  },

  // Create new course
  createCourse: (courseData) => {
    return api.post('/courses', courseData);
  },

  // Update course
  updateCourse: (id, courseData) => {
    return api.put(`/courses/${id}`, courseData);
  },

  // Delete course
  deleteCourse: (id) => {
    return api.delete(`/courses/${id}`);
  },

  // Enroll student in course
  enrollStudent: (courseId, studentId) => {
    return api.post(`/courses/${courseId}/enroll`, { studentId });
  },

  // Remove student from course
  removeStudent: (courseId, studentId) => {
    return api.delete(`/courses/${courseId}/enroll`, { data: { studentId } });
  },

  // Get enrolled students for a course
  getEnrolledStudents: (courseId) => {
    return api.get(`/courses/${courseId}/students`);
  },

  // Get available instructors for course creation
  getAvailableInstructors: () => {
    return api.get('/courses/instructors/available');
  },

  // Get course statistics
  getCourseStats: () => {
    return api.get('/courses/stats/overview');
  }
};

export default courseAPI;