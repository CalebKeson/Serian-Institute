// src/stores/enrollmentStore.js
import { create } from "zustand";
import { enrollmentAPI } from "../services/enrollmentAPI";
import { courseAPI } from "../services/courseAPI";
import toast from "react-hot-toast";

export const useEnrollmentStore = create((set, get) => ({
  // State
  courseEnrollments: [],
  studentEnrollments: [],
  availableStudents: [],
  loading: false,
  error: null,
  searchTerm: "",
  
  // NEW: Enrollment statistics
  enrollmentStats: {
    total: 0,
    active: 0,
    today: 0,
    thisMonth: 0,
    byStatus: {
      enrolled: 0,
      completed: 0,
      dropped: 0,
      waitlisted: 0
    }
  },

  // Actions
  fetchCourseEnrollments: async (courseId, status = "enrolled") => {
    set({ loading: true, error: null });

    try {
      const result = await enrollmentAPI.getCourseEnrollments(courseId, status);

      if (result.success) {
        set({
          courseEnrollments: result.data || [],
          loading: false,
        });
        return result.data || [];
      } else {
        set({ error: result.message, loading: false });
        toast.error(result.message);
        return [];
      }
    } catch (error) {
      console.error("Fetch course enrollments error:", error);
      const errorMessage =
        error.response?.data?.message || "Failed to fetch course enrollments";
      set({ error: errorMessage, loading: false });
      toast.error(errorMessage);
      return [];
    }
  },

  fetchStudentEnrollments: async (studentId, status = "enrolled") => {
    set({ loading: true, error: null });

    try {
      const result = await enrollmentAPI.getStudentEnrollments(
        studentId,
        status,
      );

      if (result.success) {
        set({
          studentEnrollments: result.data || [],
          loading: false,
        });
        return result.data || [];
      } else {
        set({ error: result.message, loading: false });
        toast.error(result.message);
        return [];
      }
    } catch (error) {
      console.error("Fetch student enrollments error:", error);
      const errorMessage =
        error.response?.data?.message || "Failed to fetch student enrollments";
      set({ error: errorMessage, loading: false });
      toast.error(errorMessage);
      return [];
    }
  },

  enrollStudent: async (courseId, studentId, notes = "") => {
    set({ loading: true, error: null });

    try {
      const result = await enrollmentAPI.enrollStudent(
        courseId,
        studentId,
        notes,
      );

      if (result.success) {
        const { courseEnrollments, availableStudents } = get();
        const newEnrollment = result.data?.enrollment || result.data;

        if (newEnrollment) {
          set({
            courseEnrollments: [...courseEnrollments, newEnrollment],
            loading: false,
          });
        } else {
          set({ loading: false });
        }

        const updatedAvailable = availableStudents.filter(
          (student) => student && student._id !== studentId,
        );
        set({ availableStudents: updatedAvailable });

        toast.success(result.message || "Student enrolled successfully!");

        return {
          success: true,
          data: result.data,
          message: result.message,
        };
      } else {
        set({ error: result.message, loading: false });
        toast.error(result.message);
        return { success: false, message: result.message };
      }
    } catch (error) {
      console.error("Enroll student error:", error);
      const errorMessage =
        error.response?.data?.message || "Failed to enroll student";
      set({ error: errorMessage, loading: false });
      toast.error(errorMessage);
      return { success: false, message: errorMessage };
    }
  },

  removeStudent: async (courseId, studentId) => {
    set({ loading: true, error: null });

    try {
      const result = await enrollmentAPI.removeStudent(courseId, studentId);

      if (result.success) {
        const { courseEnrollments } = get();

        const updatedEnrollments = courseEnrollments.filter((enrollment) => {
          const enrollmentStudentId =
            enrollment.student?._id ||
            enrollment.student?.toString() ||
            enrollment.studentId;
          return enrollmentStudentId?.toString() !== studentId.toString();
        });

        set({
          courseEnrollments: updatedEnrollments,
          loading: false,
        });

        toast.success(
          result.message || "Student removed from course successfully!",
        );

        return {
          success: true,
          data: result.data,
          message: result.message,
        };
      } else {
        set({ error: result.message, loading: false });
        toast.error(result.message);
        return { success: false, message: result.message };
      }
    } catch (error) {
      console.error("Remove student error:", error);
      const errorMessage =
        error.response?.data?.message || "Failed to remove student";
      set({ error: errorMessage, loading: false });
      toast.error(errorMessage);
      return { success: false, message: errorMessage };
    }
  },

  updateEnrollment: async (enrollmentId, data) => {
    set({ loading: true, error: null });

    try {
      const result = await enrollmentAPI.updateEnrollment(enrollmentId, data);

      if (result.success) {
        const { courseEnrollments, studentEnrollments } = get();

        if (data.status === "dropped" || data.status === "completed") {
          const updatedCourseEnrollments = courseEnrollments.filter(
            (enrollment) => enrollment && enrollment._id !== enrollmentId,
          );

          set({
            courseEnrollments: updatedCourseEnrollments,
            loading: false,
          });
        } else {
          const updateEnrollments = (enrollments) =>
            enrollments.map((enrollment) =>
              enrollment && enrollment._id === enrollmentId
                ? result.data
                : enrollment,
            );

          set({
            courseEnrollments: updateEnrollments(courseEnrollments),
            studentEnrollments: updateEnrollments(studentEnrollments),
            loading: false,
          });
        }

        toast.success(result.message || "Enrollment updated successfully!");
        return { success: true, data: result.data };
      } else {
        set({ error: result.message, loading: false });
        toast.error(result.message);
        return { success: false, message: result.message };
      }
    } catch (error) {
      console.error("Update enrollment error:", error);
      const errorMessage =
        error.response?.data?.message || "Failed to update enrollment";
      set({ error: errorMessage, loading: false });
      toast.error(errorMessage);
      return { success: false, message: errorMessage };
    }
  },

  bulkEnrollStudents: async (courseId, studentIds, notes = "") => {
    set({ loading: true, error: null });

    try {
      const result = await enrollmentAPI.bulkEnrollStudents(
        courseId,
        studentIds,
        notes,
      );

      if (result.success) {
        const { courseEnrollments, availableStudents } = get();

        const newEnrollments = result.data?.enrollments || [];

        set({
          courseEnrollments: [...courseEnrollments, ...newEnrollments],
          loading: false,
        });

        const enrolledIds = newEnrollments.map(
          (e) => e.student?._id || e.studentId,
        );
        const updatedAvailable = availableStudents.filter(
          (student) => !enrolledIds.includes(student._id),
        );
        set({ availableStudents: updatedAvailable });

        if (result.data.errors && result.data.errors.length > 0) {
          toast.success(
            `Successfully enrolled ${result.data.summary.successful} students. ${result.data.summary.failed} failed.`,
            { duration: 4000 },
          );
        } else {
          toast.success(
            result.message ||
              `Successfully enrolled ${result.data.summary.successful} students!`,
          );
        }

        return {
          success: true,
          data: result.data,
          message: result.message,
        };
      } else {
        set({ error: result.message, loading: false });
        toast.error(result.message);
        return { success: false, message: result.message };
      }
    } catch (error) {
      console.error("Bulk enroll error:", error);
      const errorMessage =
        error.response?.data?.message || "Failed to bulk enroll students";
      set({ error: errorMessage, loading: false });
      toast.error(errorMessage);
      return { success: false, message: errorMessage };
    }
  },

  // NEW: Fetch enrollment statistics
  fetchEnrollmentStats: async () => {
    set({ loading: true, error: null });

    try {
      const result = await enrollmentAPI.getEnrollmentStats();

      if (result.success) {
        set({ 
          enrollmentStats: result.data,
          loading: false 
        });
        return { success: true, data: result.data };
      } else {
        // Fallback to calculating from current data if API fails
        const { courseEnrollments } = get();
        const stats = {
          total: courseEnrollments.length,
          active: courseEnrollments.filter(e => e.status === 'enrolled').length,
          today: 0,
          thisMonth: 0,
          byStatus: {
            enrolled: courseEnrollments.filter(e => e.status === 'enrolled').length,
            completed: courseEnrollments.filter(e => e.status === 'completed').length,
            dropped: courseEnrollments.filter(e => e.status === 'dropped').length,
            waitlisted: courseEnrollments.filter(e => e.status === 'waitlisted').length
          }
        };
        set({ enrollmentStats: stats, loading: false });
        return { success: true, data: stats };
      }
    } catch (error) {
      console.error("Fetch enrollment stats error:", error);
      
      // Fallback calculation
      const { courseEnrollments } = get();
      const stats = {
        total: courseEnrollments.length,
        active: courseEnrollments.filter(e => e.status === 'enrolled').length,
        today: 0,
        thisMonth: 0,
        byStatus: {
          enrolled: courseEnrollments.filter(e => e.status === 'enrolled').length,
          completed: courseEnrollments.filter(e => e.status === 'completed').length,
          dropped: courseEnrollments.filter(e => e.status === 'dropped').length,
          waitlisted: courseEnrollments.filter(e => e.status === 'waitlisted').length
        }
      };
      set({ enrollmentStats: stats, loading: false });
      return { success: true, data: stats };
    }
  },

  searchAvailableStudents: async (courseId, searchTerm = "") => {
    set({ loading: true, error: null, searchTerm });

    try {
      const result = await enrollmentAPI.getAvailableStudents(
        courseId,
        searchTerm,
      );

      if (result.success) {
        set({
          availableStudents: result.data || [],
          loading: false,
        });
        return result.data || [];
      } else {
        set({ error: result.message, loading: false });
        toast.error(result.message);
        return [];
      }
    } catch (error) {
      console.error("Search available students error:", error);
      const errorMessage =
        error.response?.data?.message || "Failed to search students";
      set({ error: errorMessage, loading: false });
      toast.error(errorMessage);
      return [];
    }
  },

  clearAvailableStudents: () => {
    set({ availableStudents: [], searchTerm: "" });
  },

  setSearchTerm: (searchTerm) => {
    set({ searchTerm });
  },

  clearError: () => {
    set({ error: null });
  },

  clearEnrollments: () => {
    set({
      courseEnrollments: [],
      studentEnrollments: [],
      availableStudents: [],
      searchTerm: "",
    });
  },

  // Helper methods
  isStudentEnrolled: (courseId, studentId) => {
    const { courseEnrollments } = get();
    return courseEnrollments.some((enrollment) => {
      const enrollmentStudentId =
        enrollment.student?._id || enrollment.studentId;
      const enrollmentCourseId = enrollment.course?._id || enrollment.courseId;
      return (
        enrollmentCourseId?.toString() === courseId.toString() &&
        enrollmentStudentId?.toString() === studentId.toString() &&
        enrollment.status === "enrolled"
      );
    });
  },

  getEnrollmentByStudent: (courseId, studentId) => {
    const { courseEnrollments } = get();
    return courseEnrollments.find((enrollment) => {
      const enrollmentStudentId =
        enrollment.student?._id || enrollment.studentId;
      const enrollmentCourseId = enrollment.course?._id || enrollment.courseId;
      return (
        enrollmentCourseId?.toString() === courseId.toString() &&
        enrollmentStudentId?.toString() === studentId.toString()
      );
    });
  },

  getEnrollmentStats: () => {
    const { courseEnrollments } = get();
    return {
      enrolled: courseEnrollments.filter((e) => e.status === "enrolled").length,
      dropped: courseEnrollments.filter((e) => e.status === "dropped").length,
      completed: courseEnrollments.filter((e) => e.status === "completed")
        .length,
      total: courseEnrollments.length,
    };
  },
}));