// stores/enquiryStore.js - COMPLETE NEW FILE

import { create } from 'zustand';
import { enquiryAPI } from '../services/enquiryAPI';
import toast from 'react-hot-toast';

export const useEnquiryStore = create((set, get) => ({
  // ============ STATE ============
  enquiries: [],
  currentEnquiry: null,
  stats: null,
  sourceBreakdown: null,
  conversionReport: null,
  loading: false,
  error: null,
  pagination: {
    current: 1,
    total: 1,
    results: 0,
    limit: 20
  },
  filters: {
    status: '',
    source: '',
    startDate: '',
    endDate: '',
    search: ''
  },
  
  // ============ PUBLIC ACTIONS ============
  
  // Submit online enquiry (public)
  submitEnquiry: async (enquiryData) => {
    set({ loading: true, error: null });
    try {
      const result = await enquiryAPI.submitEnquiry(enquiryData);
      
      if (result.success) {
        set({ loading: false });
        return { 
          success: true, 
          message: result.message || 'Enquiry submitted successfully!',
          data: result.data
        };
      } else {
        const errorMessage = result.message || 'Failed to submit enquiry';
        set({ error: errorMessage, loading: false });
        return { success: false, message: errorMessage };
      }
    } catch (error) {
      console.error('Submit enquiry error:', error);
      const errorMessage = error.message || 'Failed to submit enquiry';
      set({ error: errorMessage, loading: false });
      return { success: false, message: errorMessage };
    }
  },
  
  // ============ ADMIN ACTIONS ============
  
  // Fetch all online enquiries
  fetchEnquiries: async (params = {}) => {
    set({ loading: true, error: null });
    try {
      const mergedParams = { ...get().filters, ...params };
      const response = await enquiryAPI.getEnquiries(mergedParams);
      
      set({
        enquiries: response.data.data || [],
        pagination: {
          current: response.data.pagination?.current || 1,
          total: response.data.pagination?.total || 1,
          results: response.data.pagination?.results || 0,
          limit: response.data.pagination?.limit || 20
        },
        filters: mergedParams,
        loading: false
      });
      
      return { success: true, data: response.data.data };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to fetch enquiries';
      set({ error: errorMessage, loading: false });
      toast.error(errorMessage);
      return { success: false, message: errorMessage };
    }
  },
  
  // Fetch single enquiry
  fetchEnquiry: async (id) => {
    set({ loading: true, error: null });
    try {
      const response = await enquiryAPI.getEnquiry(id);
      set({
        currentEnquiry: response.data.data,
        loading: false
      });
      return { success: true, data: response.data.data };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to fetch enquiry';
      set({ error: errorMessage, loading: false });
      toast.error(errorMessage);
      return { success: false, message: errorMessage };
    }
  },
  
  // Update enquiry
  updateEnquiry: async (id, data) => {
    set({ loading: true, error: null });
    try {
      const response = await enquiryAPI.updateEnquiry(id, data);
      
      set(state => ({
        enquiries: state.enquiries.map(e => 
          e._id === id ? response.data.data : e
        ),
        currentEnquiry: response.data.data,
        loading: false
      }));
      
      toast.success('Enquiry updated successfully');
      return { success: true, data: response.data.data };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to update enquiry';
      set({ error: errorMessage, loading: false });
      toast.error(errorMessage);
      return { success: false, message: errorMessage };
    }
  },
  
  // Convert enquiry to physical visit
  convertToVisit: async (id) => {
    set({ loading: true, error: null });
    try {
      const response = await enquiryAPI.convertToVisit(id);
      
      set(state => ({
        enquiries: state.enquiries.map(e => 
          e._id === id ? response.data.data : e
        ),
        currentEnquiry: response.data.data,
        loading: false
      }));
      
      toast.success('Enquiry converted to visit successfully');
      return { success: true, data: response.data.data };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to convert enquiry';
      set({ error: errorMessage, loading: false });
      toast.error(errorMessage);
      return { success: false, message: errorMessage };
    }
  },
  
  // Delete enquiry
  deleteEnquiry: async (id) => {
    set({ loading: true, error: null });
    try {
      await enquiryAPI.deleteEnquiry(id);
      
      set(state => ({
        enquiries: state.enquiries.filter(e => e._id !== id),
        loading: false
      }));
      
      toast.success('Enquiry deleted successfully');
      return { success: true };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to delete enquiry';
      set({ error: errorMessage, loading: false });
      toast.error(errorMessage);
      return { success: false, message: errorMessage };
    }
  },
  
  // Add note to enquiry
  addNote: async (id, note) => {
    set({ loading: true, error: null });
    try {
      const response = await enquiryAPI.addNote(id, note);
      
      set(state => ({
        enquiries: state.enquiries.map(e => {
          if (e._id === id) {
            const updated = { ...e };
            if (!updated.notes) updated.notes = [];
            updated.notes.push(response.data.data);
            return updated;
          }
          return e;
        }),
        currentEnquiry: state.currentEnquiry?._id === id ? {
          ...state.currentEnquiry,
          notes: [...(state.currentEnquiry.notes || []), response.data.data]
        } : state.currentEnquiry,
        loading: false
      }));
      
      toast.success('Note added successfully');
      return { success: true, data: response.data.data };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to add note';
      set({ error: errorMessage, loading: false });
      toast.error(errorMessage);
      return { success: false, message: errorMessage };
    }
  },
  
  // Fetch enquiry statistics
  fetchStats: async (params = {}) => {
    set({ loading: true, error: null });
    try {
      const response = await enquiryAPI.getEnquiryStats(params);
      set({
        stats: response.data.data,
        loading: false
      });
      return { success: true, data: response.data.data };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to fetch stats';
      set({ error: errorMessage, loading: false });
      return { success: false, message: errorMessage };
    }
  },
  
  // Fetch source breakdown for analytics
  fetchSourceBreakdown: async (params = {}) => {
    set({ loading: true, error: null });
    try {
      const response = await enquiryAPI.getSourceBreakdown(params);
      set({
        sourceBreakdown: response.data.data,
        loading: false
      });
      return { success: true, data: response.data.data };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to fetch source breakdown';
      set({ error: errorMessage, loading: false });
      return { success: false, message: errorMessage };
    }
  },
  
  // Fetch conversion report
  fetchConversionReport: async (params = {}) => {
    set({ loading: true, error: null });
    try {
      const response = await enquiryAPI.getConversionReport(params);
      set({
        conversionReport: response.data.data,
        loading: false
      });
      return { success: true, data: response.data.data };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to fetch conversion report';
      set({ error: errorMessage, loading: false });
      return { success: false, message: errorMessage };
    }
  },
  
  // ============ FILTER ACTIONS ============
  
  setFilters: (filters) => {
    set({ filters: { ...get().filters, ...filters } });
  },
  
  resetFilters: () => {
    set({
      filters: {
        status: '',
        source: '',
        startDate: '',
        endDate: '',
        search: ''
      }
    });
  },
  
  setPage: (page) => {
    set({ pagination: { ...get().pagination, current: page } });
  },
  
  // ============ UTILITY ACTIONS ============
  
  clearCurrentEnquiry: () => {
    set({ currentEnquiry: null });
  },
  
  clearError: () => {
    set({ error: null });
  },
  
  resetStore: () => {
    set({
      enquiries: [],
      currentEnquiry: null,
      stats: null,
      sourceBreakdown: null,
      conversionReport: null,
      loading: false,
      error: null,
      pagination: {
        current: 1,
        total: 1,
        results: 0,
        limit: 20
      },
      filters: {
        status: '',
        source: '',
        startDate: '',
        endDate: '',
        search: ''
      }
    });
  }
}));