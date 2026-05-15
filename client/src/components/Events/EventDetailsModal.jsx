// frontend/src/components/Events/EventDetailsModal.jsx
import React from 'react';
import { X, Calendar, MapPin, Clock, AlertCircle, Users } from 'lucide-react';
import { getEventTypeColor, getEventTypeLabel, formatDate, formatTime } from '../../utils/calendarUtils';

const EventDetailsModal = ({ event, onClose, onViewDetails }) => {
  if (!event) return null;
  
  const typeColor = getEventTypeColor(event.eventType);
  const typeLabel = getEventTypeLabel(event.eventType);
  
  const isMultiDay = new Date(event.startDate).toDateString() !== new Date(event.endDate).toDateString();
  
  const formatDateRange = () => {
    const start = new Date(event.startDate);
    const end = new Date(event.endDate);
    
    if (isMultiDay) {
      return `${formatDate(start)} - ${formatDate(end)}`;
    }
    return formatDate(start);
  };
  
  const handleViewDetails = () => {
    onViewDetails(event);
    onClose();
  };
  
  return (
    <div className="fixed inset-0 bg-gray-400 bg-opacity-40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Event Details</h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-md transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        
        {/* Content */}
        <div className="p-4 space-y-4">
          {/* Type Badge */}
          <div>
            <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${typeColor}`}>
              {typeLabel}
            </span>
          </div>
          
          {/* Title */}
          <h2 className="text-xl font-bold text-gray-900">{event.title}</h2>
          
          {/* Date */}
          <div className="flex items-start space-x-3">
            <Calendar className="w-5 h-5 text-gray-400 mt-0.5" />
            <div>
              <p className="text-sm text-gray-900">{formatDateRange()}</p>
              {!event.isAllDay && event.startTime && (
                <p className="text-sm text-gray-500">
                  {formatTime(event.startTime)} - {formatTime(event.endTime)}
                </p>
              )}
              {event.isAllDay && (
                <p className="text-sm text-gray-500">All day</p>
              )}
            </div>
          </div>
          
          {/* Location */}
          <div className="flex items-start space-x-3">
            <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
            <p className="text-sm text-gray-900">{event.location || 'Serian Institute Campus'}</p>
          </div>
          
          {/* Target Audience */}
          <div className="flex items-start space-x-3">
            <Users className="w-5 h-5 text-gray-400 mt-0.5" />
            <p className="text-sm text-gray-900">
              For: {event.forRoles?.map(role => role.charAt(0).toUpperCase() + role.slice(1)).join(', ')}
            </p>
          </div>
          
          {/* Description */}
          {event.description && (
            <div className="pt-2 border-t border-gray-100">
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{event.description}</p>
            </div>
          )}
          
          {/* Warnings */}
          {(event.noClasses || event.officesClosed) && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
              <div className="flex items-start space-x-2">
                <AlertCircle className="w-4 h-4 text-yellow-600 mt-0.5" />
                <div>
                  {event.noClasses && (
                    <p className="text-sm text-yellow-800">No classes scheduled</p>
                  )}
                  {event.officesClosed && (
                    <p className="text-sm text-yellow-800">Administrative offices closed</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
        
        {/* Footer */}
        <div className="p-4 border-t border-gray-200 flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
          >
            Close
          </button>
          <button
            onClick={handleViewDetails}
            className="px-4 py-2 text-sm text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
          >
            View Full Details
          </button>
        </div>
      </div>
    </div>
  );
};

export default EventDetailsModal;