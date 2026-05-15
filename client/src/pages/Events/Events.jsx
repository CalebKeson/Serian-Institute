// frontend/src/pages/Events/Events.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router';
import { Calendar as CalendarIcon, List, Plus, RefreshCw } from 'lucide-react';
import Layout from '../../components/Layout/Layout';
import EventCard from '../../components/Events/EventCard';
import EventFilters from '../../components/Events/EventFilters';
import EventCalendar from '../../components/Events/EventCalendar';
import EventDetailsModal from '../../components/Events/EventDetailsModal';
import { useEventStore } from '../../stores/eventStore';
import { useAuthStore } from '../../stores/authStore';

const Events = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { 
    events, 
    loading, 
    filters,
    pagination,
    fetchEvents,
    setFilters,
    deleteEvent
  } = useEventStore();
  
  const [viewMode, setViewMode] = useState('list');
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  
  // Memoize fetchEvents to prevent infinite loop
  const loadEvents = useCallback(async () => {
    if (isInitialLoad || filters) {
      await fetchEvents(1, filters);
      setIsInitialLoad(false);
    }
  }, [fetchEvents, filters, isInitialLoad]);
  
  // Load events on mount only
  useEffect(() => {
    loadEvents();
  }, []); // Empty dependency array - only runs once on mount
  
  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
    fetchEvents(1, { ...filters, ...newFilters });
  };
  
  const handleClearFilters = () => {
    const resetFilters = { eventType: '', upcoming: true };
    setFilters(resetFilters);
    fetchEvents(1, resetFilters);
  };
  
  const handleEventClick = (event) => {
    setSelectedEvent(event);
    setShowModal(true);
  };
  
  const handleViewDetails = (event) => {
    navigate(`/events/${event._id}`);
  };
  
  const handleEditEvent = (event) => {
    navigate(`/events/edit/${event._id}`);
  };
  
  const handleDeleteEvent = async (event) => {
    if (window.confirm(`Are you sure you want to delete "${event.title}"?`)) {
      await deleteEvent(event._id);
      fetchEvents(1, filters);
    }
  };
  
  const handleDateClick = (date, eventsOnDate) => {
    // Optional: Show events for the clicked date
    console.log('Events on', date, eventsOnDate);
  };
  
  const handleRefresh = () => {
    fetchEvents(1, filters);
  };
  
  return (
    <Layout>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                <CalendarIcon className="w-6 h-6 mr-2 text-blue-600" />
                Events Calendar
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                Stay updated with institute events, holidays, and announcements
              </p>
            </div>
            
            <div className="mt-4 sm:mt-0 flex space-x-3">
              <button
                onClick={handleRefresh}
                disabled={loading}
                className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
              
              {user?.role === 'admin' && (
                <Link
                  to="/events/add"
                  className="inline-flex items-center px-3 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 transition-all"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Event
                </Link>
              )}
            </div>
          </div>
        </div>
        
        {/* View Toggle */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2 bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('list')}
              className={`flex items-center px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'list'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <List className="w-4 h-4 mr-1" />
              List View
            </button>
            <button
              onClick={() => setViewMode('calendar')}
              className={`flex items-center px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'calendar'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <CalendarIcon className="w-4 h-4 mr-1" />
              Calendar View
            </button>
          </div>
          
          {/* Results count */}
          {viewMode === 'list' && !loading && (
            <span className="text-sm text-gray-500">
              Showing {events.length} of {pagination.results} events
            </span>
          )}
        </div>
        
        {/* Filters */}
        <EventFilters
          filters={filters}
          onFilterChange={handleFilterChange}
          onClearFilters={handleClearFilters}
        />
        
        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        )}
        
        {/* Content based on view mode */}
        {!loading && (
          <>
            {viewMode === 'list' ? (
              // List View - Event Cards Grid
              events.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {events.map((event) => (
                    <div key={event._id} className="relative group">
                      <EventCard
                        event={event}
                        onClick={handleEventClick}
                        isAdmin={user?.role === 'admin'}
                      />
                      {/* Admin quick actions */}
                      {user?.role === 'admin' && (
                        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex space-x-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditEvent(event);
                            }}
                            className="p-1 bg-white rounded-md shadow-sm text-blue-600 hover:text-blue-700"
                            title="Edit"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                            </svg>
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteEvent(event);
                            }}
                            className="p-1 bg-white rounded-md shadow-sm text-red-600 hover:text-red-700"
                            title="Delete"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
                  <CalendarIcon className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No events found</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    {filters.eventType || filters.upcoming 
                      ? 'Try adjusting your filters' 
                      : 'Get started by creating a new event'}
                  </p>
                  {user?.role === 'admin' && (
                    <Link
                      to="/events/add"
                      className="mt-4 inline-flex items-center px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Event
                    </Link>
                  )}
                </div>
              )
            ) : (
              // Calendar View
              <EventCalendar
                events={events}
                onDateClick={handleDateClick}
                onEventClick={handleEventClick}
              />
            )}
          </>
        )}
        
        {/* Pagination (only for list view) */}
        {viewMode === 'list' && !loading && pagination.total > 1 && (
          <div className="mt-6 flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Page {pagination.current} of {pagination.total}
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => fetchEvents(pagination.current - 1, filters)}
                disabled={pagination.current === 1}
                className="px-3 py-1 border border-gray-300 rounded-md text-sm text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Previous
              </button>
              <button
                onClick={() => fetchEvents(pagination.current + 1, filters)}
                disabled={pagination.current === pagination.total}
                className="px-3 py-1 border border-gray-300 rounded-md text-sm text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
      
      {/* Event Details Modal */}
      {showModal && selectedEvent && (
        <EventDetailsModal
          event={selectedEvent}
          onClose={() => {
            setShowModal(false);
            setSelectedEvent(null);
          }}
          onViewDetails={handleViewDetails}
        />
      )}
    </Layout>
  );
};

export default Events;