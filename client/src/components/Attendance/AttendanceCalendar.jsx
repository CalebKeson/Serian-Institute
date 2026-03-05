// src/components/Attendance/AttendanceCalendar.jsx
import React, { useState, useEffect } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  CheckCircle,
  XCircle,
  Clock,
  FileText,
  Info
} from 'lucide-react';
import { useAttendanceStore } from '../../stores/attendanceStore';

const AttendanceCalendar = ({ studentId, courseId = null }) => {
  const {
    studentSummary,
    studentSummaryLoading,
    fetchStudentCalendar,
    selectedMonth,
    selectedYear,
    setCalendarMonth
  } = useAttendanceStore();

  const [selectedDate, setSelectedDate] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [calendarDays, setCalendarDays] = useState([]);

  // Status colors for calendar days
  const statusColors = {
    present: 'bg-green-500 hover:bg-green-600 text-white',
    absent: 'bg-red-500 hover:bg-red-600 text-white',
    late: 'bg-yellow-500 hover:bg-yellow-600 text-white',
    excused: 'bg-blue-500 hover:bg-blue-600 text-white',
    noData: 'bg-gray-100 hover:bg-gray-200 text-gray-500'
  };

  const statusIcons = {
    present: CheckCircle,
    absent: XCircle,
    late: Clock,
    excused: FileText
  };

  // Generate calendar days for current month
  useEffect(() => {
    generateCalendarDays();
  }, [selectedYear, selectedMonth, studentSummary.calendarData]);

  const generateCalendarDays = () => {
    const firstDay = new Date(selectedYear, selectedMonth - 1, 1);
    const lastDay = new Date(selectedYear, selectedMonth, 0);
    
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay(); // 0 = Sunday, 1 = Monday, etc.
    
    const days = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push({ day: null, status: 'empty' });
    }
    
    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const dayData = studentSummary.calendarData?.find(d => d.date === dateStr);
      
      days.push({
        day,
        date: dateStr,
        status: dayData?.status || 'noData',
        checkInTime: dayData?.checkInTime,
        notes: dayData?.notes,
        courseName: dayData?.courseName
      });
    }
    
    setCalendarDays(days);
  };

  const handlePrevMonth = () => {
    if (selectedMonth === 1) {
      setCalendarMonth(12, selectedYear - 1);
    } else {
      setCalendarMonth(selectedMonth - 1, selectedYear);
    }
    setSelectedDate(null);
    setShowDetails(false);
  };

  const handleNextMonth = () => {
    if (selectedMonth === 12) {
      setCalendarMonth(1, selectedYear + 1);
    } else {
      setCalendarMonth(selectedMonth + 1, selectedYear);
    }
    setSelectedDate(null);
    setShowDetails(false);
  };

  const handleDayClick = (day) => {
    if (day.status !== 'empty' && day.status !== 'noData') {
      setSelectedDate(day);
      setShowDetails(true);
    }
  };

  const getStatusIcon = (status) => {
    const Icon = statusIcons[status] || Info;
    return <Icon className="w-3 h-3" />;
  };

  const getStatusLabel = (status) => {
    const labels = {
      present: 'Present',
      absent: 'Absent',
      late: 'Late',
      excused: 'Excused',
      noData: 'No Data'
    };
    return labels[status] || status;
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (timeStr) => {
    if (!timeStr) return '';
    return new Date(`2000-01-01T${timeStr}`).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  if (studentSummaryLoading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
          <div className="grid grid-cols-7 gap-2 mb-4">
            {[...Array(7)].map((_, i) => (
              <div key={i} className="h-4 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-2">
            {[...Array(35)].map((_, i) => (
              <div key={i} className="h-12 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* Calendar Header */}
      <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-blue-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <CalendarIcon className="w-5 h-5 text-purple-600" />
            <h3 className="text-lg font-semibold text-gray-900">
              {new Date(selectedYear, selectedMonth - 1).toLocaleDateString('en-US', { 
                month: 'long', 
                year: 'numeric' 
              })}
            </h3>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handlePrevMonth}
              className="p-2 hover:bg-white rounded-lg transition-colors"
              title="Previous Month"
            >
              <ChevronLeft className="w-5 h-5 text-gray-600" />
            </button>
            <button
              onClick={() => setCalendarMonth(new Date().getMonth() + 1, new Date().getFullYear())}
              className="px-3 py-1 text-sm bg-white rounded-lg hover:bg-gray-50 transition-colors"
            >
              Today
            </button>
            <button
              onClick={handleNextMonth}
              className="p-2 hover:bg-white rounded-lg transition-colors"
              title="Next Month"
            >
              <ChevronRight className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-4 mt-4">
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
            <span className="text-xs text-gray-600">Present</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <span className="text-xs text-gray-600">Absent</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
            <span className="text-xs text-gray-600">Late</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 rounded-full bg-blue-500"></div>
            <span className="text-xs text-gray-600">Excused</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 rounded-full bg-gray-200"></div>
            <span className="text-xs text-gray-600">No Data</span>
          </div>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="p-4">
        {/* Weekday headers */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {weekDays.map(day => (
            <div key={day} className="text-center text-xs font-medium text-gray-500 py-2">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar days */}
        <div className="grid grid-cols-7 gap-1">
          {calendarDays.map((day, index) => (
            <div
              key={index}
              onClick={() => handleDayClick(day)}
              className={`
                aspect-square p-2 rounded-lg flex flex-col items-center justify-center cursor-pointer
                transition-all duration-200 hover:scale-105
                ${day.status === 'empty' ? 'bg-transparent cursor-default' : statusColors[day.status]}
                ${selectedDate?.date === day.date ? 'ring-2 ring-purple-600 ring-offset-2' : ''}
              `}
            >
              {day.status !== 'empty' && (
                <>
                  <span className="text-sm font-medium">{day.day}</span>
                  {day.status !== 'noData' && (
                    <div className="mt-1">
                      {getStatusIcon(day.status)}
                    </div>
                  )}
                </>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Day Details Panel */}
      {showDetails && selectedDate && (
        <div className="border-t border-gray-200 p-4 bg-gray-50">
          <div className="flex items-start justify-between">
            <div>
              <h4 className="font-medium text-gray-900">
                {formatDate(selectedDate.date)}
              </h4>
              <div className="mt-3 space-y-2">
                <div className="flex items-center space-x-2">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    selectedDate.status === 'present' ? 'bg-green-100 text-green-800' :
                    selectedDate.status === 'absent' ? 'bg-red-100 text-red-800' :
                    selectedDate.status === 'late' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-blue-100 text-blue-800'
                  }`}>
                    {getStatusIcon(selectedDate.status)}
                    <span className="ml-1">{getStatusLabel(selectedDate.status)}</span>
                  </span>
                  {selectedDate.checkInTime && (
                    <span className="text-xs text-gray-500">
                      Check-in: {formatTime(selectedDate.checkInTime)}
                    </span>
                  )}
                </div>
                
                {selectedDate.courseName && (
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Course:</span> {selectedDate.courseName}
                  </p>
                )}
                
                {selectedDate.notes && (
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Notes:</span> {selectedDate.notes}
                  </p>
                )}
              </div>
            </div>
            <button
              onClick={() => setShowDetails(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <XCircle className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* Summary Stats */}
      <div className="border-t border-gray-200 p-4 bg-gradient-to-r from-purple-50 to-blue-50">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-green-600">
              {studentSummary.calendarData?.filter(d => d.status === 'present').length || 0}
            </p>
            <p className="text-xs text-gray-600">Present</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-red-600">
              {studentSummary.calendarData?.filter(d => d.status === 'absent').length || 0}
            </p>
            <p className="text-xs text-gray-600">Absent</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-yellow-600">
              {studentSummary.calendarData?.filter(d => d.status === 'late').length || 0}
            </p>
            <p className="text-xs text-gray-600">Late</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-blue-600">
              {studentSummary.calendarData?.filter(d => d.status === 'excused').length || 0}
            </p>
            <p className="text-xs text-gray-600">Excused</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AttendanceCalendar;