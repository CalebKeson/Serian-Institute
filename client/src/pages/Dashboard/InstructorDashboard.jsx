// frontend/src/pages/Dashboard/InstructorDashboard.jsx
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router';
import { 
  Calendar, 
  BookOpen, 
  Users, 
  CheckSquare, 
  Clock, 
  TrendingUp,
  AlertCircle,
  ChevronRight,
  FileText,
  Award,
  UserCheck,
  BarChart3,
  Eye,
  CalendarDays,
  MapPin,
  Bell,
  DollarSign
} from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { useCourseStore } from '../../stores/courseStore';
import { useStudentStore } from '../../stores/studentStore';
import { useAttendanceStore } from '../../stores/attendanceStore';
import { useEventStore } from '../../stores/eventStore';
import SimpleCalendar from '../../components/Calendar/SimpleCalendar';
import CourseFeeSummary from '../../components/Instructors/CourseFeeSummary';
import toast from 'react-hot-toast';

const InstructorDashboard = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  
  // Store data
  const { courses, fetchCourses, loading: coursesLoading } = useCourseStore();
  const { students, fetchStudents, loading: studentsLoading } = useStudentStore();
  const { attendanceStats, fetchAttendanceStats, loading: attendanceLoading } = useAttendanceStore();
  const { events, fetchEvents, loading: eventsLoading } = useEventStore();
  
  const [myCourses, setMyCourses] = useState([]);
  const [totalStudents, setTotalStudents] = useState(0);
  const [pendingGrades, setPendingGrades] = useState(0);
  const [todaySchedule, setTodaySchedule] = useState([]);
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [attendanceRate, setAttendanceRate] = useState(0);
  const [recentActivities, setRecentActivities] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Fetch all data on mount
  useEffect(() => {
    loadDashboardData();
  }, []);
  
  const loadDashboardData = async () => {
    setLoading(true);
    try {
      await fetchCourses({ limit: 100 });
      await fetchStudents({ limit: 100 });
      await fetchEvents({ upcoming: true, limit: 50 });
      
      const today = new Date();
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      await fetchAttendanceStats(null, null, startOfMonth.toISOString().split('T')[0], endOfMonth.toISOString().split('T')[0]);
      
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };
  
  // Process courses when loaded
  useEffect(() => {
    if (courses.length > 0) {
      setMyCourses(courses.slice(0, 4));
      const total = courses.reduce((sum, course) => sum + (course.enrolledStudents?.length || 0), 0);
      setTotalStudents(total);
    }
  }, [courses]);
  
  // Process attendance stats
  useEffect(() => {
    if (attendanceStats) {
      setAttendanceRate(attendanceStats.attendanceRate || 0);
    }
  }, [attendanceStats]);
  
  // Process events
  useEffect(() => {
    if (events.length > 0) {
      const now = new Date();
      const upcoming = events
        .filter(event => new Date(event.startDate) >= now)
        .slice(0, 5);
      setUpcomingEvents(upcoming);
      
      const todayEvents = events.filter(event => {
        const eventDate = new Date(event.startDate);
        return eventDate.toDateString() === new Date().toDateString();
      });
      setTodaySchedule(todayEvents.slice(0, 3));
    }
  }, [events]);
  
  // Generate recent activities
  useEffect(() => {
    const activities = [];
    
    courses.slice(0, 3).forEach(course => {
      activities.push({
        id: `course-${course._id}`,
        type: 'course',
        message: `${course.courseCode} - ${course.name}`,
        timeAgo: 'Active course',
        icon: '📚',
        actionUrl: `/courses/${course._id}`
      });
    });
    
    if (attendanceStats) {
      activities.push({
        id: 'attendance',
        type: 'attendance',
        message: `Overall attendance rate: ${attendanceRate.toFixed(1)}%`,
        timeAgo: 'Current month',
        icon: '✅',
        actionUrl: '/attendance/reports'
      });
    }
    
    setRecentActivities(activities.slice(0, 4));
  }, [courses, attendanceStats, attendanceRate]);
  
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };
  
  const getAttendanceColor = (percentage) => {
    if (percentage >= 90) return 'text-green-600';
    if (percentage >= 75) return 'text-yellow-600';
    return 'text-red-600';
  };
  
  const formatEventTime = (event) => {
    const date = new Date(event.startDate);
    if (event.isAllDay) return 'All day';
    if (event.startTime) return event.startTime;
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  
  const handleDateClick = (date) => {
    setSelectedDate(date);
    // Filter events for the selected date
    const eventsOnDate = events.filter(event => {
      const eventDate = new Date(event.startDate);
      return eventDate.toDateString() === date.toDateString();
    });
    if (eventsOnDate.length > 0) {
      toast.success(`${eventsOnDate.length} event(s) on this date`);
    }
  };
  
  const handleViewCourseFees = (courseId) => {
    navigate(`/instructor/courses/${courseId}/fees`);
  };
  
  if (loading) {
    return (
      <div className="p-4">
        <div className="flex items-center justify-center min-h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="p-4 max-w-7xl mx-auto">
      {/* Welcome Header */}
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {getGreeting()}, {user?.name?.split(' ')[0] || 'Instructor'}! 👋
            </h1>
            <p className="text-gray-500 text-sm mt-1">
              {user?.designation || 'Instructor'} • {user?.department || 'Department'}
            </p>
            <p className="text-xs text-gray-400 mt-1">
              {new Date().toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </p>
          </div>
          
          <button 
            onClick={() => navigate('/attendance')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 text-sm"
          >
            <CheckSquare className="w-4 h-4" />
            Mark Attendance
          </button>
        </div>
      </div>
      
      {/* Statistics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate('/courses')}>
          <div className="flex items-center justify-between mb-2">
            <div className="p-2 bg-blue-100 rounded-lg">
              <BookOpen className="w-5 h-5 text-blue-600" />
            </div>
            <span className="text-xl font-bold text-gray-900">{myCourses.length}</span>
          </div>
          <h3 className="font-medium text-gray-900 text-sm">My Courses</h3>
          <p className="text-xs text-gray-500">Active this semester</p>
        </div>
        
        <div className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate('/students')}>
          <div className="flex items-center justify-between mb-2">
            <div className="p-2 bg-green-100 rounded-lg">
              <Users className="w-5 h-5 text-green-600" />
            </div>
            <span className="text-xl font-bold text-gray-900">{totalStudents}</span>
          </div>
          <h3 className="font-medium text-gray-900 text-sm">My Students</h3>
          <p className="text-xs text-gray-500">Across all courses</p>
        </div>
        
        <div className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate('/grades')}>
          <div className="flex items-center justify-between mb-2">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <FileText className="w-5 h-5 text-yellow-600" />
            </div>
            <span className="text-xl font-bold text-yellow-600">{pendingGrades}</span>
          </div>
          <h3 className="font-medium text-gray-900 text-sm">Pending Grades</h3>
          <p className="text-xs text-gray-500">Need submission</p>
        </div>
        
        <div className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <div className="p-2 bg-purple-100 rounded-lg">
              <UserCheck className="w-5 h-5 text-purple-600" />
            </div>
            <span className={`text-xl font-bold ${getAttendanceColor(attendanceRate)}`}>
              {Math.round(attendanceRate)}%
            </span>
          </div>
          <h3 className="font-medium text-gray-900 text-sm">Attendance Rate</h3>
          <p className="text-xs text-gray-500">This month</p>
        </div>
      </div>
      
      {/* Today's Schedule + Calendar Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Today's Schedule */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-200 bg-gray-50">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-blue-600" />
              <h2 className="font-semibold text-gray-900 text-base">Today's Schedule</h2>
            </div>
          </div>
          
          <div className="divide-y divide-gray-100">
            {todaySchedule.length > 0 ? (
              todaySchedule.map((event, index) => (
                <div key={index} className="p-4 hover:bg-gray-50 transition-colors cursor-pointer" onClick={() => navigate(`/events/${event._id}`)}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-medium text-gray-900">
                          {formatEventTime(event)}
                        </span>
                        <span className="px-2 py-0.5 text-xs bg-blue-100 text-blue-700 rounded-full">
                          {event.eventType}
                        </span>
                      </div>
                      <h3 className="font-medium text-gray-900 text-sm mb-1">{event.title}</h3>
                      <div className="flex items-center gap-3 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" /> {event.location || 'TBD'}
                        </span>
                      </div>
                    </div>
                    <button 
                      onClick={(e) => { e.stopPropagation(); navigate(`/events/${event._id}`); }}
                      className="px-3 py-1.5 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      View
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center">
                <Calendar className="mx-auto h-10 w-10 text-gray-400 mb-2" />
                <p className="text-gray-500 text-sm">No events scheduled for today</p>
                <p className="text-xs text-gray-400 mt-1">Enjoy your day! 🎉</p>
              </div>
            )}
          </div>
        </div>
        
        {/* Calendar */}
        <SimpleCalendar 
          events={events} 
          onDateClick={handleDateClick}
        />
      </div>
      
      {/* Upcoming Events + Course Fee Summary Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Upcoming Events */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-200 bg-gray-50">
            <div className="flex items-center gap-2">
              <CalendarDays className="w-4 h-4 text-green-600" />
              <h2 className="font-semibold text-gray-900 text-base">Upcoming Events</h2>
            </div>
          </div>
          
          <div className="divide-y divide-gray-100">
            {upcomingEvents.length > 0 ? (
              upcomingEvents.map((event) => (
                <div key={event._id} className="p-3 hover:bg-gray-50 transition-colors cursor-pointer" onClick={() => navigate(`/events/${event._id}`)}>
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 text-center min-w-[50px]">
                      <div className="text-lg font-bold text-blue-600">
                        {new Date(event.startDate).getDate()}
                      </div>
                      <div className="text-xs text-gray-500">
                        {new Date(event.startDate).toLocaleString('default', { month: 'short' })}
                      </div>
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900 text-sm line-clamp-2">{event.title}</p>
                      <p className="text-xs text-gray-500 mt-1">{event.eventType}</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  </div>
                </div>
              ))
            ) : (
              <div className="p-6 text-center">
                <CalendarDays className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                <p className="text-gray-500 text-sm">No upcoming events</p>
              </div>
            )}
            <div className="p-3 bg-gray-50 text-center">
              <Link to="/events" className="text-xs text-blue-600 hover:text-blue-800">
                View all events →
              </Link>
            </div>
          </div>
        </div>
        
        {/* Course Fee Summary - First course only as example */}
        {myCourses.length > 0 && (
          <CourseFeeSummary
            courseId={myCourses[0]._id}
            courseName={myCourses[0].name}
            courseCode={myCourses[0].courseCode}
            onViewDetails={handleViewCourseFees}
          />
        )}
      </div>
      
      {/* My Courses Section */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-blue-600" />
            <h2 className="font-semibold text-gray-900 text-base">My Courses</h2>
          </div>
          <Link to="/courses" className="text-xs text-blue-600 hover:text-blue-800">
            View all {myCourses.length} courses
          </Link>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {myCourses.slice(0, 4).map((course) => (
            <div 
              key={course._id} 
              className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => navigate(`/courses/${course._id}`)}
            >
              <div className="flex justify-between items-start mb-2">
                <span className="px-2 py-0.5 text-xs bg-blue-100 text-blue-700 rounded-full">
                  {course.courseCode}
                </span>
              </div>
              <h3 className="font-medium text-gray-900 text-sm mb-2 line-clamp-2">{course.name}</h3>
              <div className="flex justify-between text-xs text-gray-500 mb-3">
                <span>📚 {course.duration || 'N/A'}</span>
                <span>👥 {course.enrolledStudents?.length || 0} students</span>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={(e) => { e.stopPropagation(); navigate(`/grades/course/${course._id}`); }}
                  className="flex-1 px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Grades
                </button>
                <button 
                  onClick={(e) => { e.stopPropagation(); navigate(`/attendance/course/${course._id}`); }}
                  className="flex-1 px-2 py-1 text-xs border border-gray-300 rounded hover:bg-gray-50"
                >
                  Attendance
                </button>
                <button 
                  onClick={(e) => { e.stopPropagation(); handleViewCourseFees(course._id); }}
                  className="px-2 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700"
                  title="View Fees"
                >
                  <DollarSign className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Recent Activity */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-gray-600" />
            <h2 className="font-semibold text-gray-900 text-base">Recent Activity</h2>
          </div>
        </div>
        
        <div className="divide-y divide-gray-100">
          {recentActivities.length > 0 ? (
            recentActivities.map((activity) => (
              <div 
                key={activity.id} 
                className="p-3 hover:bg-gray-50 transition-colors cursor-pointer"
                onClick={() => activity.actionUrl && navigate(activity.actionUrl)}
              >
                <div className="flex items-start gap-3">
                  <div className="text-base">{activity.icon}</div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-900">{activity.message}</p>
                    <p className="text-xs text-gray-400 mt-1">{activity.timeAgo}</p>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="p-6 text-center">
              <Bell className="mx-auto h-8 w-8 text-gray-400 mb-2" />
              <p className="text-gray-500 text-sm">No recent activity</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default InstructorDashboard;