import React from 'react';
import { Calendar, MapPin, Clock, AlertCircle } from 'lucide-react';
import { getEventTypeColor, getEventTypeLabel, formatDate, formatTime } from '../../utils/calendarUtils';

const EventCard = ({ event, onClick, isAdmin = false }) => {
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
  
  const hasWarnings = event.noClasses || event.officesClosed;
  
  return (
    <div 
      onClick={() => onClick(event)}
      className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-all duration-200 cursor-pointer"
    >
      {/* Header with type badge */}
      <div className="flex justify-between items-start mb-3">
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${typeColor}`}>
          {typeLabel}
        </span>
        {hasWarnings && (
          <AlertCircle className="w-4 h-4 text-orange-500" />
        )}
      </div>
      
      {/* Title */}
      <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">
        {event.title}
      </h3>
      
      {/* Date */}
      <div className="flex items-center text-sm text-gray-600 mb-2">
        <Calendar className="w-4 h-4 mr-2 flex-shrink-0" />
        <span>{formatDateRange()}</span>
      </div>
      
      {/* Time (if not all-day) */}
      {!event.isAllDay && event.startTime && (
        <div className="flex items-center text-sm text-gray-600 mb-2">
          <Clock className="w-4 h-4 mr-2 flex-shrink-0" />
          <span>{formatTime(event.startTime)} - {formatTime(event.endTime)}</span>
        </div>
      )}
      
      {/* Location */}
      <div className="flex items-center text-sm text-gray-600">
        <MapPin className="w-4 h-4 mr-2 flex-shrink-0" />
        <span className="truncate">{event.location || 'Serian Institute'}</span>
      </div>
      
      {/* Warning badges */}
      {hasWarnings && (
        <div className="mt-3 flex gap-2">
          {event.noClasses && (
            <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded">
              No Classes
            </span>
          )}
          {event.officesClosed && (
            <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded">
              Offices Closed
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default EventCard;