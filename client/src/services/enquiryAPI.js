// services/enquiryAPI.js - COMPLETE NEW FILE

import api from './api';

// Public endpoint (no authentication required)
const PUBLIC_API_URL = import.meta.env.VITE_REACT_APP_BACKEND_BASE_URL + '/api';

export const enquiryAPI = {
  // ============ PUBLIC ENDPOINTS ============
  
  // Submit online enquiry (public - no auth)
  submitEnquiry: async (enquiryData) => {
    try {
      const response = await fetch(`${PUBLIC_API_URL}/requests/enquiry`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(enquiryData),
      });
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Submit enquiry error:', error);
      return {
        success: false,
        message: error.message || 'Failed to submit enquiry'
      };
    }
  },
  
  // ============ ADMIN ENDPOINTS (requires authentication) ============
  
  // Get all online enquiries
  getEnquiries: async (params = {}) => {
    const { status, source, startDate, endDate, search } = params;
    return api.get('/requests', {
      params: {
        type: 'online',
        status,
        source,
        startDate,
        endDate,
        search
      }
    });
  },
  
  // Get single enquiry
  getEnquiry: async (id) => {
    return api.get(`/requests/${id}`);
  },
  
  // Update enquiry
  updateEnquiry: async (id, data) => {
    return api.put(`/requests/${id}`, data);
  },
  
  // Convert enquiry to visit
  convertToVisit: async (id) => {
    return api.post(`/requests/${id}/convert-to-visit`);
  },
  
  // Delete enquiry
  deleteEnquiry: async (id) => {
    return api.delete(`/requests/${id}`);
  },
  
  // Add note to enquiry
  addNote: async (id, note) => {
    return api.post(`/requests/${id}/notes`, note);
  },
  
  // Get enquiry statistics
  getEnquiryStats: async (params = {}) => {
    const { startDate, endDate } = params;
    return api.get('/requests/stats', {
      params: { startDate, endDate }
    });
  },
  
  // Get source breakdown for enquiries
  getSourceBreakdown: async (params = {}) => {
    const { startDate, endDate } = params;
    return api.get('/analytics/sources', {
      params: { startDate, endDate }
    });
  },
  
  // Get conversion report
  getConversionReport: async (params = {}) => {
    const { startDate, endDate } = params;
    return api.get('/analytics/conversions', {
      params: { startDate, endDate }
    });
  }
};

export default enquiryAPI;