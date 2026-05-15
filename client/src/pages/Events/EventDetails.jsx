import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router';
import { 
  ArrowLeft, 
  Calendar, 
  MapPin, 
  Clock, 
  AlertCircle, 
  Users,
  Edit,
  Trash2,
  Printer
} from 'lucide-react';
import Layout from '../../components/Layout/Layout';
import { useEventStore } from '../../stores/eventStore';
import { useAuthStore } from '../../stores/authStore';
import { 
  getEventTypeColor, 
  getEventTypeLabel, 
  formatDate, 
  formatTime 
} from '../../utils/calendarUtils';

const EventDetails = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user } = useAuthStore();
  const { currentEvent, fetchEvent, deleteEvent, loading, clearCurrentEvent } = useEventStore();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  
  useEffect(() => {
    if (id) {
      fetchEvent(id);
    }
    
    return () => {
      clearCurrentEvent();
    };
  }, [id]);
  
  const handleBack = () => {
    navigate('/events');
  };
  
  const handleEdit = () => {
    navigate(`/events/edit/${id}`);
  };
  
  const handleDelete = async () => {
    await deleteEvent(id);
    navigate('/events');
  };
  
  const handlePrint = () => {
    window.print();
  };
  
  if (loading && !currentEvent) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-96">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </Layout>
    );
  }
  
  if (!currentEvent && !loading) {
    return (
      <Layout>
        <div className="text-center py-12">
          <Calendar className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Event not found</h3>
          <p className="mt-1 text-sm text-gray-500">The event you're looking for doesn't exist.</p>
          <button
            onClick={handleBack}
            className="mt-4 inline-flex items-center px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
          >
            Back to Events
          </button>
        </div>
      </Layout>
    );
  }
  
  const typeColor = getEventTypeColor(currentEvent.eventType);
  const typeLabel = getEventTypeLabel(currentEvent.eventType);
  const isMultiDay = new Date(currentEvent.startDate).toDateString() !== new Date(currentEvent.endDate).toDateString();
  
  const formatDateRange = () => {
    const start = new Date(currentEvent.startDate);
    const end = new Date(currentEvent.endDate);
    
    if (isMultiDay) {
      return `${formatDate(start)} - ${formatDate(end)}`;
    }
    return formatDate(start);
  };
  
  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center space-x-3">
              <button
                onClick={handleBack}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Event Details</h1>
              </div>
            </div>
            
            <div className="mt-4 sm:mt-0 flex space-x-2">
              <button
                onClick={handlePrint}
                className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
              >
                <Printer className="w-4 h-4 mr-2" />
                Print
              </button>
              
              {user?.role === 'admin' && (
                <>
                  <button
                    onClick={handleEdit}
                    className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Edit
                  </button>
                  <button
                    onClick={() => setShowDeleteConfirm(true)}
                    className="inline-flex items-center px-3 py-2 border border-red-300 rounded-md text-sm font-medium text-red-700 bg-white hover:bg-red-50 transition-colors"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
        
        {/* Event Content */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          {/* Type Badge */}
          <div className="p-6 border-b border-gray-200 bg-gray-50">
            <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${typeColor}`}>
              {typeLabel}
            </span>
          </div>
          
          <div className="p-6">
            {/* Title */}
            <h1 className="text-2xl font-bold text-gray-900 mb-4">{currentEvent.title}</h1>
            
            {/* Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              {/* Date */}
              <div className="flex items-start space-x-3">
                <Calendar className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-gray-500">Date</p>
                  <p className="text-gray-900">{formatDateRange()}</p>
                  {!currentEvent.isAllDay && currentEvent.startTime && (
                    <p className="text-sm text-gray-500">
                      {formatTime(currentEvent.startTime)} - {formatTime(currentEvent.endTime)}
                    </p>
                  )}
                  {currentEvent.isAllDay && (
                    <p className="text-sm text-gray-500">All day event</p>
                  )}
                </div>
              </div>
              
              {/* Location */}
              <div className="flex items-start space-x-3">
                <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-gray-500">Location</p>
                  <p className="text-gray-900">{currentEvent.location || 'Serian Institute Campus'}</p>
                </div>
              </div>
              
              {/* Target Audience */}
              <div className="flex items-start space-x-3">
                <Users className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-gray-500">For</p>
                  <p className="text-gray-900">
                    {currentEvent.forRoles?.map(role => 
                      role.charAt(0).toUpperCase() + role.slice(1)
                    ).join(', ')}
                  </p>
                </div>
              </div>
              
              {/* Created By */}
              <div className="flex items-start space-x-3">
                <Calendar className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-gray-500">Created By</p>
                  <p className="text-gray-900">{currentEvent.createdBy?.name || 'Unknown'}</p>
                  <p className="text-xs text-gray-500">
                    {new Date(currentEvent.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
            
            {/* Warnings */}
            {(currentEvent.noClasses || currentEvent.officesClosed) && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 mb-6">
                <div className="flex items-start space-x-3">
                  <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
                  <div>
                    {currentEvent.noClasses && (
                      <p className="text-sm text-yellow-800 font-medium">No Classes Scheduled</p>
                    )}
                    {currentEvent.officesClosed && (
                      <p className="text-sm text-yellow-800 font-medium">Administrative Offices Closed</p>
                    )}
                    <p className="text-xs text-yellow-700 mt-1">
                      Please plan your schedule accordingly.
                    </p>
                  </div>
                </div>
              </div>
            )}
            
            {/* Description */}
            {currentEvent.description && (
              <div className="pt-4 border-t border-gray-200">
                <h3 className="text-md font-semibold text-gray-900 mb-2">Description</h3>
                <div className="prose prose-sm max-w-none">
                  <p className="text-gray-700 whitespace-pre-wrap">{currentEvent.description}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Confirm Delete</h3>
              <p className="text-sm text-gray-600 mb-4">
                Are you sure you want to delete "{currentEvent.title}"? This action cannot be undone.
              </p>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  className="px-4 py-2 text-sm text-white bg-red-600 hover:bg-red-700 rounded-md transition-colors"
                >
                  Delete Event
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default EventDetails;