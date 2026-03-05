// services/requestAPI.js
import api from './api';

export const requestAPI = {
  // Create new request
  createRequest: (data) => api.post('/requests', data),
  
  // Get all requests
  getAllRequests: (params) => api.get('/requests', { params }),
  
  // Get single request
  getRequest: (id) => api.get(`/requests/${id}`),
  
  // Update request
  updateRequest: (id, data) => api.put(`/requests/${id}`, data),
  
  // Delete request
  deleteRequest: (id) => api.delete(`/requests/${id}`),
  
  // Add note
  addNote: (id, note) => api.post(`/requests/${id}/notes`, note),
  
  // Get stats
  getRequestStats: () => api.get('/requests/stats'),

  // Get today's request count
  getTodayCount: () => api.get('/requests/today-count'),
};