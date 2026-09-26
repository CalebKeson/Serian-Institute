// frontend/src/stores/authStore.js - COMPLETE FIXED VERSION

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { authAPI } from "../services/api";
import toast from "react-hot-toast";

export const useAuthStore = create(
  persist(
    (set, get) => ({
      // ============ STATE ============
      user: null,
      token: null,
      loading: false,
      error: null,
      isChangingPassword: false,

      // ============ INITIALIZE ============
      initialize: () => {
        const token = localStorage.getItem("token");
        const userData = JSON.parse(localStorage.getItem("userData") || "null");
        if (token && userData) {
          set({ user: userData, token });
        }
      },

      // ============ LOGIN ============
      login: async (email, password) => {
        set({ loading: true, error: null });
        try {
          const response = await authAPI.login({ email, password });
          if (response.data.success) {
            const { token, ...userData } = response.data.data;
            localStorage.setItem("token", token);
            localStorage.setItem("userData", JSON.stringify(userData));
            set({ user: userData, token, loading: false });
            toast.success("Welcome back! Login successful.");
            return { success: true };
          }
        } catch (error) {
          const errorMessage = error.response?.data?.message || "Login failed";
          set({ error: errorMessage, loading: false });
          toast.error(errorMessage);
          return { success: false, message: errorMessage };
        }
      },

      // ============ GOOGLE LOGIN ============
      googleLogin: async (googleData) => {
        set({ loading: true, error: null });
        try {
          const response = await authAPI.googleAuth(googleData);
          if (response.data.success) {
            const { token, ...userData } = response.data.data;
            localStorage.setItem("token", token);
            localStorage.setItem("userData", JSON.stringify(userData));
            set({ user: userData, token, loading: false });
            toast.success("Signed in with Google successfully!");
            return { success: true };
          }
        } catch (error) {
          const errorMessage = error.response?.data?.message || "Google login failed";
          set({ error: errorMessage, loading: false });
          toast.error(errorMessage);
          return { success: false, message: errorMessage };
        }
      },

      // ============ REGISTER ============
      register: async (userData) => {
        set({ loading: true, error: null });
        try {
          const response = await authAPI.register(userData);
          if (response.data.success) {
            const { token, ...userInfo } = response.data.data;
            localStorage.setItem("token", token);
            localStorage.setItem("userData", JSON.stringify(userInfo));
            set({ user: userInfo, token, loading: false });
            toast.success("Account created successfully!");
            return { success: true };
          }
        } catch (error) {
          const errorMessage = error.response?.data?.message || "Registration failed";
          set({ error: errorMessage, loading: false });
          toast.error(errorMessage);
          return { success: false, message: errorMessage };
        }
      },

      // ============ LOGOUT ============
      logout: () => {
        localStorage.removeItem("token");
        localStorage.removeItem("userData");
        set({ user: null, token: null, error: null });
        toast.success("Logged out successfully");
      },

      // ============ FORGOT PASSWORD ============
      requestPasswordReset: async (email) => {
        set({ loading: true, error: null });
        try {
          const response = await authAPI.forgotPassword(email);
          set({ loading: false });
          toast.success(response.data.message || "Reset email sent");
          return { success: true, message: response.data.message };
        } catch (error) {
          const errorMessage = error.response?.data?.message || "Failed to send reset email";
          set({ error: errorMessage, loading: false });
          toast.error(errorMessage);
          return { success: false, message: errorMessage };
        }
      },

      // ============ VALIDATE RESET TOKEN ============
      validateResetToken: async (token) => {
        set({ loading: true, error: null });
        try {
          const response = await authAPI.validateResetToken(token);
          set({ loading: false });
          return { success: true, data: response.data.data };
        } catch (error) {
          const errorMessage = error.response?.data?.message || "Invalid or expired token";
          set({ error: errorMessage, loading: false });
          return { success: false, message: errorMessage };
        }
      },

      // ============ RESET PASSWORD ============
      resetPassword: async (token, password) => {
        set({ loading: true, error: null });
        try {
          const response = await authAPI.resetPassword(token, password);
          set({ loading: false });
          toast.success(response.data.message || "Password reset successful");
          return { success: true, message: response.data.message };
        } catch (error) {
          const errorMessage = error.response?.data?.message || "Failed to reset password";
          set({ error: errorMessage, loading: false });
          toast.error(errorMessage);
          return { success: false, message: errorMessage };
        }
      },

      // ============ CHANGE PASSWORD - COMPLETE FIX ============
      changePassword: async (passwordData) => {
        set({ loading: true, error: null, isChangingPassword: true });
        try {
          const response = await authAPI.changePassword(passwordData);
          
          if (response.data.success) {
            // === FIX: Update token and user data ===
            if (response.data.data?.token) {
              const newToken = response.data.data.token;
              localStorage.setItem("token", newToken);
              
              // Update token in state
              set({ token: newToken });
            }
            
            // Update user data if provided
            if (response.data.data?.user) {
              const userData = response.data.data.user;
              localStorage.setItem("userData", JSON.stringify(userData));
              set({ user: userData });
            }
            
            set({ loading: false, isChangingPassword: false });
            toast.success(response.data.message || "Password changed successfully");
            return { 
              success: true, 
              message: response.data.message,
              data: response.data.data
            };
          }
        } catch (error) {
          const errorMessage = error.response?.data?.message || "Failed to change password";
          set({ error: errorMessage, loading: false, isChangingPassword: false });
          toast.error(errorMessage);
          return { success: false, message: errorMessage };
        }
      },

      // ============ UTILITY ============
      clearError: () => set({ error: null }),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ user: state.user, token: state.token }),
    }
  )
);