// frontend/src/components/Calendar/SimpleCalendar.jsx
import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const SimpleCalendar = ({ events, onDateClick }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [calendarDays, setCalendarDays] = useState([]);
  
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  
  // Get days in month
  const getDaysInMonth = (year, month) => {
    return new Date(year, month + 1, 0).getDate();
  };
  
  // Get first day of month (0 = Sunday)
  const getFirstDayOfMonth = (year, month) => {
    return new Date(year, month, 1).getDay();
  };
  
  // Check if date has events
  const hasEventOnDate = (date) => {
    if (!events || events.length === 0) return false;
    const dateStr = date.toISOString().split('T')[0];
    return events.some(event => {
      const eventStart = new Date(event.startDate).toISOString().split('T')[0];
      const eventEnd = new Date(event.endDate).toISOString().split('T')[0];
      return dateStr >= eventStart && dateStr <= eventEnd;
    });
  };
  
  // Generate calendar days
  const generateCalendar = () => {
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);
    const days = [];
    
    // Previous month days
    const prevMonthDays = getDaysInMonth(year, month - 1);
    for (let i = firstDay - 1; i >= 0; i--) {
      const date = new Date(year, month - 1, prevMonthDays - i);
      days.push({
        date,
        isCurrentMonth: false,
        hasEvent: hasEventOnDate(date)
      });
    }
    
    // Current month days
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      days.push({
        date,
        isCurrentMonth: true,
        hasEvent: hasEventOnDate(date)
      });
    }
    
    // Next month days (to fill 6 rows)
    const remainingDays = 42 - days.length;
    for (let day = 1; day <= remainingDays; day++) {
      const date = new Date(year, month + 1, day);
      days.push({
        date,
        isCurrentMonth: false,
        hasEvent: hasEventOnDate(date)
      });
    }
    
    setCalendarDays(days);
  };
  
  useEffect(() => {
    generateCalendar();
  }, [currentDate, events]);
  
  const goToPrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };
  
  const goToNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };
  
  const goToToday = () => {
    setCurrentDate(new Date());
  };
  
  const isToday = (date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };
  
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* Calendar Header */}
      <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={goToPrevMonth}
              className="p-1 hover:bg-gray-200 rounded-md transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-semibold text-gray-900">
              {monthNames[month]} {year}
            </span>
            <button
              onClick={goToNextMonth}
              className="p-1 hover:bg-gray-200 rounded-md transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <button
            onClick={goToToday}
            className="text-xs text-blue-600 hover:text-blue-800"
          >
            Today
          </button>
        </div>
      </div>
      
      {/* Weekday Headers */}
      <div className="grid grid-cols-7 border-b border-gray-100">
        {weekDays.map((day, index) => (
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
          const isTodayDate = isToday(day.date);
          
          return (
            <div
              key={index}
              onClick={() => onDateClick && onDateClick(day.date)}
              className={`
                min-h-[60px] p-1 border-r border-b border-gray-100
                ${!day.isCurrentMonth ? 'bg-gray-50' : 'bg-white'}
                ${isTodayDate ? 'ring-1 ring-blue-500 ring-inset' : ''}
                hover:bg-blue-50 transition-colors cursor-pointer
              `}
            >
              <div className="flex justify-between items-start">
                <span className={`
                  text-xs font-medium
                  ${!day.isCurrentMonth ? 'text-gray-400' : 'text-gray-700'}
                  ${isTodayDate ? 'bg-blue-600 text-white w-5 h-5 rounded-full flex items-center justify-center' : ''}
                `}>
                  {day.date.getDate()}
                </span>
              </div>
              
              {/* Event Dot Indicator */}
              {day.hasEvent && (
                <div className="flex justify-center mt-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
                </div>
              )}
            </div>
          );
        })}
      </div>
      
      {/* Legend */}
      <div className="px-3 py-2 border-t border-gray-100 bg-gray-50 text-center">
        <div className="flex items-center justify-center gap-3 text-xs">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-blue-500"></div>
            <span className="text-gray-500">Event day</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-blue-600 ring-1 ring-blue-500"></div>
            <span className="text-gray-500">Today</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SimpleCalendar;