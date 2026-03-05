// stores/authStore.js - UPDATED googleLogin function
import { create } from "zustand";
import { authAPI } from "../services/api";

export const useAuthStore = create((set, get) => ({
  user: null,
  loading: false,
  error: null,

  // Initialize auth state from localStorage
  initialize: () => {
    const token = localStorage.getItem("token");
    const userData = JSON.parse(localStorage.getItem("userData") || "null");
    if (token && userData) {
      set({ user: userData });
    }
  },

  // Regular login
  login: async (email, password) => {
    set({ loading: true, error: null });
    try {
      const response = await authAPI.login({ email, password });
      console.log("API Response:", response);

      if (response.data.success) {
        const { token, ...userData } = response.data.data;
        localStorage.setItem("token", token);
        localStorage.setItem("userData", JSON.stringify(userData));
        set({ user: userData, loading: false });
        return { success: true };
      } else {
        set({ loading: false });
        return {
          success: false,
          message: response.data.message || "Login failed",
        };
      }
    } catch (error) {
      console.log("API Error:", error);
      const errorMessage =
        error.response?.data?.message || "Login failed. Please try again.";
      set({ loading: false });
      return {
        success: false,
        message: errorMessage,
      };
    }
  },

  // Google login - UPDATED VERSION
  googleLogin: async (googleData) => {
    set({ loading: true, error: null });
    try {
      console.log("Calling googleAuth with data:", googleData);
      
      // Make sure authAPI.googleAuth exists
      if (!authAPI.googleAuth) {
        throw new Error("Google auth API endpoint not configured");
      }
      
      const response = await authAPI.googleAuth(googleData);
      console.log("Google Auth API Response:", response);

      if (response.data.success) {
        const { token, ...userData } = response.data.data;
        localStorage.setItem("token", token);
        localStorage.setItem("userData", JSON.stringify(userData));
        set({ user: userData, loading: false });
        return { success: true };
      } else {
        set({ loading: false });
        return {
          success: false,
          message: response.data.message || "Google login failed",
        };
      }
    } catch (error) {
      console.log("Google Auth API Error:", error);
      const errorMessage =
        error.response?.data?.message || "Google login failed. Please try again.";
      set({ error: errorMessage, loading: false });
      return {
        success: false,
        message: errorMessage,
      };
    }
  },

  // Register
  register: async (userData) => {
    set({ loading: true, error: null });
    try {
      const response = await authAPI.register(userData);
      if (response.data.success) {
        const { token, ...userInfo } = response.data.data;
        localStorage.setItem("token", token);
        localStorage.setItem("userData", JSON.stringify(userInfo));
        set({ user: userInfo, loading: false });
        return { success: true };
      }
    } catch (error) {
      const errorMessage =
        error.response?.data?.message || "Registration failed";
      set({ error: errorMessage, loading: false });
      return { success: false, message: errorMessage };
    }
  },

  // Google register (can use the same as googleLogin since backend handles both)
  googleRegister: async (googleData) => {
    return get().googleLogin(googleData); // Reuse googleLogin logic
  },

  logout: () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userData");
    set({ user: null, error: null });
  },

  // Password reset functions (keep existing)
  requestPasswordReset: async (email) => {
    set({ loading: true, error: null });
    try {
      const response = await authAPI.forgotPassword(email);
      return response.data;
    } catch (error) {
      const errorMessage =
        error.response?.data?.message || "Failed to send reset email";
      set({ error: errorMessage, loading: false });
      return { success: false, message: errorMessage };
    }
  },

  validateResetToken: async (token) => {
    set({ loading: true, error: null });
    try {
      const response = await authAPI.validateResetToken(token);
      return response.data;
    } catch (error) {
      const errorMessage =
        error.response?.data?.message || "Invalid or expired token";
      set({ error: errorMessage, loading: false });
      return { success: false, message: errorMessage };
    }
  },

  resetPassword: async (token, password) => {
    set({ loading: true, error: null });
    try {
      const response = await authAPI.resetPassword(token, password);
      return response.data;
    } catch (error) {
      const errorMessage =
        error.response?.data?.message || "Failed to reset password";
      set({ error: errorMessage, loading: false });
      return { success: false, message: errorMessage };
    }
  },

  clearError: () => set({ error: null }),
}));