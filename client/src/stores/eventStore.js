import { create } from "zustand";
import { eventAPI } from "../services/eventAPI";
import toast from "react-hot-toast";

export const useEventStore = create((set, get) => ({
  // State
  events: [],
  currentEvent: null,
  upcomingEvents: [],
  loading: false,
  error: null,
  filters: {
    eventType: '',
    upcoming: true,
    startDate: null,
    endDate: null
  },
  pagination: {
    current: 1,
    total: 1,
    results: 0,
    limit: 20
  },
  stats: null,

  // Fetch all events with filters
  fetchEvents: async (page = 1, filters = {}) => {
    set({ loading: true, error: null });
    
    try {
      const currentFilters = { ...get().filters, ...filters, page };
      const response = await eventAPI.getEvents(currentFilters);
      
      set({
        events: response.data.data,
        pagination: response.data.pagination,
        filters: currentFilters,
        loading: false
      });
      
      return response.data;
    } catch (error) {
      const errorMessage = error.response?.data?.message || "Failed to fetch events";
      set({ error: errorMessage, loading: false });
      toast.error(errorMessage);
      return { success: false, message: errorMessage };
    }
  },

  // Fetch single event
  fetchEvent: async (id) => {
    set({ loading: true, error: null });
    
    try {
      const response = await eventAPI.getEvent(id);
      set({ currentEvent: response.data.data, loading: false });
      return { success: true, data: response.data.data };
    } catch (error) {
      const errorMessage = error.response?.data?.message || "Failed to fetch event";
      set({ error: errorMessage, loading: false });
      toast.error(errorMessage);
      return { success: false, message: errorMessage };
    }
  },

  // Fetch upcoming events
  fetchUpcomingEvents: async (limit = 10) => {
    try {
      const response = await eventAPI.getUpcomingEvents(limit);
      set({ upcomingEvents: response.data.data });
      return response.data;
    } catch (error) {
      console.error("Failed to fetch upcoming events:", error);
      return { success: false };
    }
  },

  // Fetch event statistics
  fetchEventStats: async () => {
    try {
      const response = await eventAPI.getEventStats();
      set({ stats: response.data.data });
      return response.data;
    } catch (error) {
      console.error("Failed to fetch event stats:", error);
      return null;
    }
  },

  // Create new event (admin only)
  createEvent: async (eventData) => {
    set({ loading: true, error: null });
    
    try {
      const response = await eventAPI.createEvent(eventData);
      const newEvent = response.data.data;
      
      // Refresh events list
      await get().fetchEvents(1, get().filters);
      
      set({ loading: false });
      toast.success("Event created successfully!");
      return { success: true, data: newEvent };
    } catch (error) {
      let errorMessage = "Failed to create event";
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }
      set({ error: errorMessage, loading: false });
      toast.error(errorMessage);
      return { success: false, message: errorMessage };
    }
  },

  // Update event (admin only)
  updateEvent: async (id, eventData) => {
    set({ loading: true, error: null });
    
    try {
      const response = await eventAPI.updateEvent(id, eventData);
      const updatedEvent = response.data.data;
      
      // Update in events list if present
      const { events } = get();
      const updatedEvents = events.map(event => 
        event._id === id ? updatedEvent : event
      );
      
      set({
        events: updatedEvents,
        currentEvent: updatedEvent,
        loading: false
      });
      
      toast.success("Event updated successfully!");
      return { success: true, data: updatedEvent };
    } catch (error) {
      let errorMessage = "Failed to update event";
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }
      set({ error: errorMessage, loading: false });
      toast.error(errorMessage);
      return { success: false, message: errorMessage };
    }
  },

  // Delete event (admin only)
  deleteEvent: async (id) => {
    set({ loading: true, error: null });
    
    try {
      await eventAPI.deleteEvent(id);
      
      // Remove from events list
      const { events, pagination } = get();
      const filteredEvents = events.filter(event => event._id !== id);
      
      set({
        events: filteredEvents,
        pagination: {
          ...pagination,
          results: Math.max(0, pagination.results - 1)
        },
        loading: false
      });
      
      toast.success("Event deleted successfully!");
      return { success: true };
    } catch (error) {
      const errorMessage = error.response?.data?.message || "Failed to delete event";
      set({ error: errorMessage, loading: false });
      toast.error(errorMessage);
      return { success: false, message: errorMessage };
    }
  },

  // Set filters
  setFilters: (filters) => {
    set({ filters: { ...get().filters, ...filters } });
  },

  // Clear current event
  clearCurrentEvent: () => {
    set({ currentEvent: null });
  },

  // Clear all events data
  clearEvents: () => {
    set({
      events: [],
      currentEvent: null,
      upcomingEvents: [],
      loading: false,
      error: null,
      stats: null
    });
  },

  // Reset pagination
  resetPagination: () => {
    set({
      pagination: {
        current: 1,
        total: 1,
        results: 0,
        limit: 20
      }
    });
  }
}));