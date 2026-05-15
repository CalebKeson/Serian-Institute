import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import { 
  getDaysInMonth, 
  getFirstDayOfMonth, 
  getMonthName,
  getShortDayName,
  getEventsForDate,
  getEventTypeDotColor,
  formatDate
} from '../../utils/calendarUtils';

const EventCalendar = ({ events, onDateClick, onEventClick }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [calendarDays, setCalendarDays] = useState([]);
  
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  
  // Generate calendar days
  useEffect(() => {
    generateCalendarDays();
  }, [currentDate, events]);
  
  const generateCalendarDays = () => {
    const daysInMonth = getDaysInMonth(year, month);
    const firstDayOfMonth = getFirstDayOfMonth(year, month);
    const days = [];
    
    // Get previous month's days to fill the first row
    const prevMonthDays = getFirstDayOfMonth(year, month);
    const prevMonthDate = new Date(year, month, 0);
    const daysInPrevMonth = getDaysInMonth(year, month - 1);
    
    // Add days from previous month
    for (let i = prevMonthDays - 1; i >= 0; i--) {
      const date = new Date(year, month - 1, daysInPrevMonth - i);
      days.push({
        date,
        isCurrentMonth: false,
        events: getEventsForDate(events, date)
      });
    }
    
    // Add days from current month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      days.push({
        date,
        isCurrentMonth: true,
        events: getEventsForDate(events, date)
      });
    }
    
    // Add days from next month to complete the grid (6 rows * 7 days = 42 cells)
    const remainingDays = 42 - days.length;
    for (let day = 1; day <= remainingDays; day++) {
      const date = new Date(year, month + 1, day);
      days.push({
        date,
        isCurrentMonth: false,
        events: getEventsForDate(events, date)
      });
    }
    
    setCalendarDays(days);
  };
  
  const goToPrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
    setSelectedDate(null);
  };
  
  const goToNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
    setSelectedDate(null);
  };
  
  const goToToday = () => {
    setCurrentDate(new Date());
    setSelectedDate(null);
  };
  
  const handleDateClick = (day) => {
    setSelectedDate(day.date);
    if (onDateClick) {
      onDateClick(day.date, day.events);
    }
  };
  
  const isToday = (date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };
  
  const isSelected = (date) => {
    return selectedDate && date.toDateString() === selectedDate.toDateString();
  };
  
  // Get unique event types for a day to show multiple dots
  const getUniqueEventTypes = (events) => {
    const types = [...new Set(events.map(e => e.eventType))];
    return types.slice(0, 3); // Max 3 dots per day
  };
  
  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      {/* Calendar Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center space-x-2">
          <CalendarIcon className="w-5 h-5 text-blue-600" />
          <h2 className="text-lg font-semibold text-gray-900">
            {getMonthName(month)} {year}
          </h2>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={goToPrevMonth}
            className="p-2 hover:bg-gray-200 rounded-md transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={goToToday}
            className="px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
          >
            Today
          </button>
          <button
            onClick={goToNextMonth}
            className="p-2 hover:bg-gray-200 rounded-md transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
      
      {/* Weekday Headers */}
      <div className="grid grid-cols-7 border-b border-gray-200">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, index) => (
          <div
            key={index}
            className="py-2 text-center text-xs font-medium text-gray-500"
          >
            {day}
          </div>
        ))}
      </div>
      
      {/* Calendar Grid */}
      <div className="grid grid-cols-7">
        {calendarDays.map((day, index) => {
          const isCurrentMonth = day.isCurrentMonth;
          const isTodayDate = isToday(day.date);
          const isSelectedDate = isSelected(day.date);
          const eventTypes = getUniqueEventTypes(day.events);
          
          return (
            <div
              key={index}
              onClick={() => handleDateClick(day)}
              className={`
                min-h-[100px] p-2 border-b border-r border-gray-100
                ${!isCurrentMonth ? 'bg-gray-50' : 'bg-white'}
                ${isSelectedDate ? 'ring-2 ring-blue-500 ring-inset' : ''}
                hover:bg-blue-50 transition-colors cursor-pointer
              `}
            >
              <div className="flex justify-between items-start">
                <span className={`
                  text-sm font-medium
                  ${!isCurrentMonth ? 'text-gray-400' : 'text-gray-700'}
                  ${isTodayDate ? 'bg-blue-600 text-white w-6 h-6 rounded-full flex items-center justify-center' : ''}
                `}>
                  {day.date.getDate()}
                </span>
              </div>
              
              {/* Event Dots */}
              {eventTypes.length > 0 && (
                <div className="mt-1 flex flex-wrap gap-0.5">
                  {eventTypes.map((type, idx) => (
                    <div
                      key={idx}
                      className={`w-2 h-2 rounded-full ${getEventTypeDotColor(type)}`}
                      title={`${day.events.filter(e => e.eventType === type).length} event(s)`}
                    />
                  ))}
                </div>
              )}
              
              {/* Event Titles (show only if 1-2 events) */}
              {day.events.length > 0 && day.events.length <= 2 && (
                <div className="mt-1 space-y-0.5">
                  {day.events.slice(0, 2).map((event, idx) => (
                    <div
                      key={idx}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (onEventClick) onEventClick(event);
                      }}
                      className="text-xs truncate hover:underline cursor-pointer"
                    >
                      {event.title.length > 20 ? event.title.substring(0, 20) + '...' : event.title}
                    </div>
                  ))}
                </div>
              )}
              
              {/* Show count if more than 2 events */}
              {day.events.length > 2 && (
                <div className="mt-1 text-xs text-gray-500">
                  +{day.events.length - 2} more
                </div>
              )}
            </div>
          );
        })}
      </div>
      
      {/* Legend */}
      <div className="p-3 border-t border-gray-200 bg-gray-50 flex flex-wrap gap-4">
        <span className="text-xs text-gray-600 flex items-center gap-1">
          <div className="w-3 h-3 rounded-full bg-red-500"></div>
          Holiday
        </span>
        <span className="text-xs text-gray-600 flex items-center gap-1">
          <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
          Academic
        </span>
        <span className="text-xs text-gray-600 flex items-center gap-1">
          <div className="w-3 h-3 rounded-full bg-green-500"></div>
          Social
        </span>
        <span className="text-xs text-gray-600 flex items-center gap-1">
          <div className="w-3 h-3 rounded-full bg-blue-500"></div>
          Administrative
        </span>
        <span className="text-xs text-gray-600 flex items-center gap-1">
          <div className="w-3 h-3 rounded-full bg-gray-500"></div>
          Closure
        </span>
      </div>
    </div>
  );
};

export default EventCalendar;