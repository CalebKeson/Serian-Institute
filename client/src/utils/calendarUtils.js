// Calendar helper functions

// Get days in month
export const getDaysInMonth = (year, month) => {
  return new Date(year, month + 1, 0).getDate();
};

// Get first day of month (0 = Sunday, 1 = Monday, etc.)
export const getFirstDayOfMonth = (year, month) => {
  return new Date(year, month, 1).getDay();
};

// Get month name
export const getMonthName = (month) => {
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 
                  'July', 'August', 'September', 'October', 'November', 'December'];
  return months[month];
};

// Get short month name
export const getShortMonthName = (month) => {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return months[month];
};

// Get day name
export const getDayName = (dayIndex) => {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return days[dayIndex];
};

// Get short day name
export const getShortDayName = (dayIndex) => {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  return days[dayIndex];
};

// Format date for display
export const formatDate = (date) => {
  if (!date) return '';
  const d = new Date(date);
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

// Format date for input (YYYY-MM-DD)
export const formatDateForInput = (date) => {
  if (!date) return '';
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Check if two dates are the same day
export const isSameDay = (date1, date2) => {
  return date1.toDateString() === date2.toDateString();
};

// Check if date is within range
export const isDateInRange = (date, startDate, endDate) => {
  const target = new Date(date);
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  // Reset time part for accurate date comparison
  target.setHours(0, 0, 0, 0);
  start.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);
  
  return target >= start && target <= end;
};

// Get events for a specific date
export const getEventsForDate = (events, date) => {
  if (!events || events.length === 0) return [];
  
  return events.filter(event => {
    const eventStart = new Date(event.startDate);
    const eventEnd = new Date(event.endDate);
    return isDateInRange(date, eventStart, eventEnd);
  });
};

// Get event type color classes
export const getEventTypeColor = (eventType) => {
  const colors = {
    holiday: 'bg-red-100 text-red-800 border-red-200',
    academic: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    social: 'bg-green-100 text-green-800 border-green-200',
    administrative: 'bg-blue-100 text-blue-800 border-blue-200',
    closure: 'bg-gray-100 text-gray-800 border-gray-200'
  };
  return colors[eventType] || colors.academic;
};

// Get event type badge color (for calendar dots)
export const getEventTypeDotColor = (eventType) => {
  const colors = {
    holiday: 'bg-red-500',
    academic: 'bg-yellow-500',
    social: 'bg-green-500',
    administrative: 'bg-blue-500',
    closure: 'bg-gray-500'
  };
  return colors[eventType] || colors.academic;
};

// Get event type label
export const getEventTypeLabel = (eventType) => {
  const labels = {
    holiday: 'Holiday',
    academic: 'Academic',
    social: 'Social',
    administrative: 'Administrative',
    closure: 'Closure'
  };
  return labels[eventType] || eventType;
};

// Format time for display (convert HH:MM to 12-hour format)
export const formatTime = (time) => {
  if (!time) return '';
  const [hours, minutes] = time.split(':');
  const hour = parseInt(hours);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const hour12 = hour % 12 || 12;
  return `${hour12}:${minutes} ${ampm}`;
};