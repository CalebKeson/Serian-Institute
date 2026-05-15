// src/services/directorAPI.js
import api from './api';

export const directorAPI = {
  // Get all directors
  getDirectors: (params = {}) => {
    const { isActive = true, search = '' } = params;
    return api.get('/directors', { params: { isActive, search } });
  },

  // Get single director
  getDirector: (id) => {
    return api.get(`/directors/${id}`);
  },

  // Create director
  createDirector: (data) => {
    return api.post('/directors', data);
  },

  // Update director
  updateDirector: (id, data) => {
    return api.put(`/directors/${id}`, data);
  },

  // Delete director
  deleteDirector: (id) => {
    return api.delete(`/directors/${id}`);
  },

  // Record director investment
  recordInvestment: (id, data) => {
    return api.post(`/directors/${id}/investment`, data);
  },

  // Record director repayment
  recordRepayment: (id, data) => {
    return api.post(`/directors/${id}/repayment`, data);
  },

  // Get director summary
  getDirectorSummary: () => {
    return api.get('/directors/summary');
  }
};

export default directorAPI;