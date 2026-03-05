import api from "./api";

export const enrollmentAPI = {
  // Enroll a student in a course
  enrollStudent: async (courseId, studentId, notes = "") => {
    try {
      // IMPORTANT: Send as separate fields, not wrapped in an object
      const response = await api.post("/enrollments", {
        studentId,
        courseId,
        notes,
      });

      return {
        success: true,
        data: response.data.data,
        message: response.data.message,
      };
    } catch (error) {
      console.error("Enrollment API error:", error);
      const errorMessage =
        error.response?.data?.message || "Failed to enroll student";
      return {
        success: false,
        message: errorMessage,
        error: error.response?.data,
      };
    }
  },

  // Remove student from course
  // Replace your removeStudent method in enrollmentAPI.js with this:

  removeStudent: async (courseId, studentId) => {
    try {
      const response = await api.delete("/enrollments", {
        data: {
          courseId: courseId.toString(),
          studentId: studentId.toString(),
        },
      });

      return {
        success: true,
        data: response.data.data,
        message: response.data.message || "Student removed successfully",
      };
    } catch (error) {
      console.error("Remove enrollment API error:", {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message,
      });

      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "Failed to remove student";

      return {
        success: false,
        message: errorMessage,
        error: error.response?.data,
      };
    }
  },

  // Get enrollments for a course
  getCourseEnrollments: async (courseId, status = "enrolled") => {
    try {
      const response = await api.get(`/enrollments/course/${courseId}`, {
        params: { status },
      });

      return {
        success: true,
        data: response.data.data,
        count: response.data.count,
      };
    } catch (error) {
      console.error("Get course enrollments API error:", error);
      const errorMessage =
        error.response?.data?.message || "Failed to fetch course enrollments";
      return { success: false, message: errorMessage };
    }
  },

  // Get enrollments for a student
  getStudentEnrollments: async (studentId, status = "enrolled") => {
    try {
      const response = await api.get(`/enrollments/student/${studentId}`, {
        params: { status },
      });

      return {
        success: true,
        data: response.data.data,
        count: response.data.count,
      };
    } catch (error) {
      console.error("Get student enrollments API error:", error);
      const errorMessage =
        error.response?.data?.message || "Failed to fetch student enrollments";
      return { success: false, message: errorMessage };
    }
  },

  // Bulk enroll students
  bulkEnrollStudents: async (courseId, studentIds, notes = "") => {
    try {
      const response = await api.post("/enrollments/bulk", {
        courseId,
        studentIds,
        notes,
      });

      return {
        success: true,
        data: response.data.data,
        message: response.data.message,
      };
    } catch (error) {
      console.error("Bulk enroll API error:", error);
      const errorMessage =
        error.response?.data?.message || "Failed to bulk enroll students";
      return { success: false, message: errorMessage };
    }
  },

  // Replace your updateEnrollment method in enrollmentAPI.js with this:

  updateEnrollment: async (enrollmentId, data) => {
    try {
      const response = await api.put(`/enrollments/${enrollmentId}`, data);

      return {
        success: true,
        data: response.data.data,
        message: response.data.message || "Enrollment updated successfully",
      };
    } catch (error) {
      console.error("Update enrollment API error:", {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message,
        enrollmentId,
        data,
      });

      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "Failed to update enrollment";

      return {
        success: false,
        message: errorMessage,
        error: error.response?.data,
      };
    }
  },

  // Get available students for enrollment
  getAvailableStudents: async (courseId, search = "") => {
    try {
      const response = await api.get(`/students/available/${courseId}`, {
        params: { search },
      });

      return {
        success: true,
        data: response.data.data,
        count: response.data.count,
      };
    } catch (error) {
      console.error("Get available students API error:", error);
      const errorMessage =
        error.response?.data?.message || "Failed to fetch available students";
      return { success: false, message: errorMessage };
    }
  },
};

export default enrollmentAPI;
