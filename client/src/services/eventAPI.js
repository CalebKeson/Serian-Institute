import api from "./api";

export const eventAPI = {
  // Get all events with filters
  getEvents: (params = {}) => {
    const { page = 1, limit = 20, eventType, upcoming, start, end } = params;
    const queryParams = new URLSearchParams();
    
    queryParams.append('page', page);
    queryParams.append('limit', limit);
    if (eventType) queryParams.append('eventType', eventType);
    if (upcoming) queryParams.append('upcoming', upcoming);
    if (start) queryParams.append('start', start);
    if (end) queryParams.append('end', end);
    
    return api.get(`/events?${queryParams.toString()}`);
  },

  // Get single event by ID
  getEvent: (id) => {
    return api.get(`/events/${id}`);
  },

  // Get upcoming events
  getUpcomingEvents: (limit = 10) => {
    return api.get(`/events/upcoming?limit=${limit}`);
  },

  // Get events by date range
  getEventsByDateRange: (startDate, endDate) => {
    return api.get(`/events/range/${startDate}/${endDate}`);
  },

  // Get event statistics
  getEventStats: () => {
    return api.get('/events/stats');
  },

  // Create new event (admin only)
  createEvent: (eventData) => {
    return api.post('/events', eventData);
  },

  // Update event (admin only)
  updateEvent: (id, eventData) => {
    return api.put(`/events/${id}`, eventData);
  },

  // Delete event (admin only)
  deleteEvent: (id) => {
    return api.delete(`/events/${id}`);
  }
};

export default eventAPI;