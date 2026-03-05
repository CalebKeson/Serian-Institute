import { create } from 'zustand';
import { requestAPI } from '../services/requestAPI';

export const useRequestStore = create((set, get) => ({
  requests: [],
  currentRequest: null,
  stats: null,
  staffMembers: [],
  todayCount: 0,
  loading: false,
  error: null,
  pollingInterval: null,
  
  // Create new request
  createRequest: async (requestData) => {
    set({ loading: true, error: null });
    try {
      const response = await requestAPI.createRequest(requestData);
      return { success: true, data: response.data.data };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to create request';
      set({ error: errorMessage });
      return { success: false, message: errorMessage };
    } finally {
      set({ loading: false });
    }
  },
  
  // Get all requests
  fetchRequests: async (params = {}) => {
    set({ loading: true, error: null });
    try {
      const response = await requestAPI.getAllRequests(params);
      set({ requests: response.data.data });
      return { success: true };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to fetch requests';
      set({ error: errorMessage });
      return { success: false, message: errorMessage };
    } finally {
      set({ loading: false });
    }
  },
  
  // Get single request
  fetchRequest: async (id) => {
    set({ loading: true, error: null });
    try {
      const response = await requestAPI.getRequest(id);
      set({ currentRequest: response.data.data });
      return { success: true };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to fetch request';
      set({ error: errorMessage });
      return { success: false, message: errorMessage };
    } finally {
      set({ loading: false });
    }
  },
  
  // Update request
  updateRequest: async (id, updateData) => {
    set({ loading: true, error: null });
    try {
      const response = await requestAPI.updateRequest(id, updateData);
      
      // Update in local state
      const updatedRequests = get().requests.map(req => 
        req._id === id ? response.data.data : req
      );
      
      set({ 
        requests: updatedRequests,
        currentRequest: response.data.data 
      });
      
      return { success: true, data: response.data.data };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to update request';
      set({ error: errorMessage });
      return { success: false, message: errorMessage };
    } finally {
      set({ loading: false });
    }
  },
  
  // Delete request
  deleteRequest: async (id) => {
    set({ loading: true, error: null });
    try {
      await requestAPI.deleteRequest(id);
      
      // Remove from local state
      const filteredRequests = get().requests.filter(req => req._id !== id);
      set({ 
        requests: filteredRequests,
        currentRequest: null 
      });
      
      return { success: true };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to delete request';
      set({ error: errorMessage });
      return { success: false, message: errorMessage };
    } finally {
      set({ loading: false });
    }
  },
  
  // Add note to request
  addNote: async (id, noteData) => {
    set({ loading: true, error: null });
    try {
      const response = await requestAPI.addNote(id, noteData);
      
      // Update current request with new note
      const currentReq = get().currentRequest;
      if (currentReq && currentReq._id === id) {
        const updatedRequest = { ...currentReq };
        if (!updatedRequest.notes) updatedRequest.notes = [];
        updatedRequest.notes.push(response.data.data);
        set({ currentRequest: updatedRequest });
      }
      
      // Also update in requests list
      const updatedRequests = get().requests.map(req => {
        if (req._id === id) {
          const updatedReq = { ...req };
          if (!updatedReq.notes) updatedReq.notes = [];
          updatedReq.notes.push(response.data.data);
          return updatedReq;
        }
        return req;
      });
      
      set({ requests: updatedRequests });
      
      return { success: true, data: response.data.data };
    } catch (error) {
      console.error('Add note error:', error);
      const errorMessage = error.response?.data?.message || 'Failed to add note';
      set({ error: errorMessage });
      return { success: false, message: errorMessage };
    } finally {
      set({ loading: false });
    }
  },
  
  // Get today's request count (FIXED: Only update if count changed)
  fetchTodayCount: async () => {
    try {
      const response = await requestAPI.getTodayCount();
      const newCount = response.data.data.count;
      
      // Only update state if the count actually changed
      if (get().todayCount !== newCount) {
        set({ todayCount: newCount });
      }
      
      return { success: true, count: newCount };
    } catch (error) {
      // Silent fail for polling - don't trigger re-renders
      console.warn('Polling failed for today count:', error);
      return { success: false };
    }
  },
  
  // Start polling for today's count updates (FIXED: Silent polling)
  startPolling: () => {
    // Clear any existing interval
    if (get().pollingInterval) {
      clearInterval(get().pollingInterval);
    }
    
    // Poll every 60 seconds (less frequent than notifications)
    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        get().fetchTodayCount();
      }
    }, 60000); // 60 seconds
    
    set({ pollingInterval: interval });
    
    // Initial fetch
    get().fetchTodayCount();
  },
  
  // Stop polling
  stopPolling: () => {
    if (get().pollingInterval) {
      clearInterval(get().pollingInterval);
      set({ pollingInterval: null });
    }
  },
  
  // Get stats
  fetchStats: async () => {
    set({ loading: true, error: null });
    try {
      const response = await requestAPI.getRequestStats();
      set({ stats: response.data.data });
      return { success: true };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to fetch stats';
      set({ error: errorMessage });
      return { success: false, message: errorMessage };
    } finally {
      set({ loading: false });
    }
  },
  
  // Get staff members for assignment
  fetchStaffMembers: async () => {
    set({ loading: true, error: null });
    try {
      const response = await requestAPI.getStaffMembers();
      set({ staffMembers: response.data.data });
      return { success: true };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to fetch staff members';
      set({ error: errorMessage });
      return { success: false, message: errorMessage };
    } finally {
      set({ loading: false });
    }
  },
  
  // Assign request to staff member
  assignRequest: async (id, assignedTo) => {
    set({ loading: true, error: null });
    try {
      const response = await requestAPI.assignRequest(id, { assignedTo });
      
      // Update in local state
      const updatedRequests = get().requests.map(req => 
        req._id === id ? response.data.data : req
      );
      
      set({ 
        requests: updatedRequests,
        currentRequest: response.data.data 
      });
      
      return { success: true, data: response.data.data };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to assign request';
      set({ error: errorMessage });
      return { success: false, message: errorMessage };
    } finally {
      set({ loading: false });
    }
  },
  
  // Clear current request
  clearCurrentRequest: () => set({ currentRequest: null }),
  
  // Clear error
  clearError: () => set({ error: null }),
  
  // Reset store (useful for logout)
  reset: () => set({
    requests: [],
    currentRequest: null,
    stats: null,
    staffMembers: [],
    todayCount: 0,
    loading: false,
    error: null
  })
}));