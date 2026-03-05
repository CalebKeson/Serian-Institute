// src/components/Attendance/StudentAttendanceSummary.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import {
  User,
  Calendar,
  Award,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  XCircle,
  Clock,
  FileText,
  Download,
  RefreshCw,
  ChevronDown,
  Filter,
  BarChart3,
  BookOpen
} from 'lucide-react';
import { useAttendanceStore } from '../../stores/attendanceStore';
import { useStudentStore } from '../../stores/studentStore';
import AttendanceCalendar from './AttendanceCalendar';
import CourseBreakdownTable from './CourseBreakdownTable';
import toast from 'react-hot-toast';

const StudentAttendanceSummary = ({ studentId }) => {
  const navigate = useNavigate();
  const { currentStudent, fetchStudent, loading: studentLoading } = useStudentStore();
  const {
    studentSummary,
    studentSummaryLoading,
    fetchStudentSummary,
    setSelectedStudentCourse,
    selectedStudentCourse,
    clearStudentSummary,
    selectedDateRange,
    setDateRange,
    exportReport
  } = useAttendanceStore();

  const [dateRange, setLocalDateRange] = useState('30days');
  const [showFilters, setShowFilters] = useState(false);
  const [customStartDate, setCustomStartDate] = useState(
    new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0]
  );
  const [customEndDate, setCustomEndDate] = useState(
    new Date().toISOString().split('T')[0]
  );

  // Fetch student data and summary on mount
  useEffect(() => {
    if (studentId) {
      fetchStudent(studentId);
      loadStudentSummary();
    }

    return () => {
      clearStudentSummary();
    };
  }, [studentId]);

  const loadStudentSummary = async () => {
    const { startDate, endDate } = getEffectiveDateRange();
    await fetchStudentSummary(studentId, { 
      startDate, 
      endDate,
      courseId: selectedStudentCourse !== 'all' ? selectedStudentCourse : null
    });
  };

  const getEffectiveDateRange = () => {
    if (dateRange === 'custom') {
      return { startDate: customStartDate, endDate: customEndDate };
    }

    const end = new Date();
    const start = new Date();

    switch (dateRange) {
      case '7days':
        start.setDate(end.getDate() - 7);
        break;
      case '30days':
        start.setDate(end.getDate() - 30);
        break;
      case '90days':
        start.setDate(end.getDate() - 90);
        break;
      case 'thisMonth':
        start.setDate(1);
        break;
      case 'lastMonth':
        start.setMonth(end.getMonth() - 1);
        start.setDate(1);
        end.setDate(0); // Last day of previous month
        break;
      default:
        start.setDate(end.getDate() - 30);
    }

    return {
      startDate: start.toISOString().split('T')[0],
      endDate: end.toISOString().split('T')[0]
    };
  };

  const handleDateRangeChange = (newRange) => {
    setLocalDateRange(newRange);
    const { startDate, endDate } = getEffectiveDateRange();
    setDateRange({
      label: newRange,
      startDate,
      endDate
    });
    loadStudentSummary();
  };

  const handleCourseFilterChange = (courseId) => {
    setSelectedStudentCourse(courseId);
    loadStudentSummary();
  };

  const handleRefresh = () => {
    loadStudentSummary();
    toast.success('Data refreshed');
  };

  const handleExport = async (format = 'csv') => {
    const result = await exportReport(format);
    if (result.success) {
      toast.success(`Report exported as ${format.toUpperCase()}`);
    }
  };

  const handleViewAllCourses = () => {
    navigate(`/students/${studentId}/courses`);
  };

  const getStatusColor = (rate) => {
    if (rate >= 90) return 'text-green-600';
    if (rate >= 80) return 'text-yellow-600';
    if (rate >= 70) return 'text-orange-600';
    return 'text-red-600';
  };

  const getStatusBgColor = (rate) => {
    if (rate >= 90) return 'bg-green-100';
    if (rate >= 80) return 'bg-yellow-100';
    if (rate >= 70) return 'bg-orange-100';
    return 'bg-red-100';
  };

  const getStatusMessage = (rate) => {
    if (rate >= 90) return 'Excellent';
    if (rate >= 80) return 'Good';
    if (rate >= 70) return 'Needs Improvement';
    return 'Critical';
  };

  if (studentLoading || !currentStudent) {
    return (
      <div className="space-y-6">
        {/* Header Skeleton */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 animate-pulse">
          <div className="flex items-center space-x-4">
            <div className="h-16 w-16 bg-gray-200 rounded-full"></div>
            <div className="flex-1">
              <div className="h-6 bg-gray-200 rounded w-1/4 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-1/3"></div>
            </div>
          </div>
        </div>

        {/* Stats Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-200 p-6 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
              <div className="h-8 bg-gray-200 rounded w-3/4"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const { overview = {}, courseBreakdown = [] } = studentSummary;
  const attendanceRate = overview.attendanceRate || 0;

  return (
    <div className="space-y-6">
      {/* Student Header */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div className="flex items-center space-x-4">
            <div className="h-16 w-16 bg-gradient-to-r from-blue-600 to-indigo-700 rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-xl">
                {currentStudent?.user?.name?.charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                {currentStudent?.user?.name}
              </h2>
              <div className="flex items-center space-x-4 mt-1">
                <span className="text-sm text-gray-500 flex items-center">
                  <User className="w-4 h-4 mr-1" />
                  ID: {currentStudent?.studentId}
                </span>
                <span className="text-sm text-gray-500 flex items-center">
                  <BookOpen className="w-4 h-4 mr-1" />
                  {courseBreakdown.length} Courses
                </span>
              </div>
            </div>
          </div>

          {/* Overall Attendance Rate */}
          <div className="mt-4 md:mt-0 flex items-center space-x-4">
            <div className={`px-4 py-2 rounded-lg ${getStatusBgColor(attendanceRate)}`}>
              <p className="text-xs text-gray-600">Overall Attendance</p>
              <p className={`text-2xl font-bold ${getStatusColor(attendanceRate)}`}>
                {attendanceRate}%
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-500">Status</p>
              <p className={`text-sm font-medium ${getStatusColor(attendanceRate)}`}>
                {getStatusMessage(attendanceRate)}
              </p>
            </div>
          </div>
        </div>

        {/* Alert for consecutive absences */}
        {overview.consecutiveAbsences >= 3 && (
          <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-3">
            <div className="flex items-center">
              <AlertCircle className="w-5 h-5 text-red-600 mr-2" />
              <p className="text-sm text-red-700">
                ⚠️ Student has been absent for {overview.consecutiveAbsences} consecutive days.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Quick Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-2">
            <Calendar className="w-5 h-5 text-purple-600" />
            <span className="text-xs text-gray-400">Total</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{overview.totalDays || 0}</p>
          <p className="text-xs text-gray-500">Days Attended</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-2">
            <Award className="w-5 h-5 text-green-600" />
            <span className="text-xs text-gray-400">Streak</span>
          </div>
          <p className="text-2xl font-bold text-green-600">{overview.currentStreak || 0}</p>
          <p className="text-xs text-gray-500">Current Streak</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-2">
            <TrendingUp className="w-5 h-5 text-blue-600" />
            <span className="text-xs text-gray-400">Best</span>
          </div>
          <p className="text-2xl font-bold text-blue-600">{overview.longestStreak || 0}</p>
          <p className="text-xs text-gray-500">Longest Streak</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-2">
            <Clock className="w-5 h-5 text-yellow-600" />
            <span className="text-xs text-gray-400">Late</span>
          </div>
          <p className="text-2xl font-bold text-yellow-600">{overview.late || 0}</p>
          <p className="text-xs text-gray-500">Times Late</p>
        </div>
      </div>

      {/* Filters and Controls */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
          {/* Date Range Selector */}
          <div className="flex items-center space-x-3">
            <select
              value={dateRange}
              onChange={(e) => handleDateRangeChange(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white"
            >
              <option value="7days">Last 7 Days</option>
              <option value="30days">Last 30 Days</option>
              <option value="90days">Last 90 Days</option>
              <option value="thisMonth">This Month</option>
              <option value="lastMonth">Last Month</option>
              <option value="custom">Custom Range</option>
            </select>

            {dateRange === 'custom' && (
              <div className="flex items-center space-x-2">
                <input
                  type="date"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                />
                <span className="text-gray-500">to</span>
                <input
                  type="date"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                />
                <button
                  onClick={loadStudentSummary}
                  className="px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 transition-colors"
                >
                  Apply
                </button>
              </div>
            )}
          </div>

          {/* Right side controls */}
          <div className="flex items-center space-x-2">
            {/* Course Filter */}
            <div className="relative">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`p-2 rounded-lg transition-colors ${
                  selectedStudentCourse !== 'all'
                    ? 'bg-purple-100 text-purple-600'
                    : 'text-gray-500 hover:bg-gray-100'
                }`}
                title="Filter by course"
              >
                <Filter className="w-4 h-4" />
              </button>

              {showFilters && (
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 z-50 p-3">
                  <label className="block text-xs text-gray-500 mb-2">Filter by Course</label>
                  <select
                    value={selectedStudentCourse}
                    onChange={(e) => {
                      handleCourseFilterChange(e.target.value);
                      setShowFilters(false);
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  >
                    <option value="all">All Courses</option>
                    {courseBreakdown.map((course) => (
                      <option key={course.courseId} value={course.courseId}>
                        {course.courseName} ({course.courseCode})
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Refresh Button */}
            <button
              onClick={handleRefresh}
              disabled={studentSummaryLoading}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
              title="Refresh"
            >
              <RefreshCw className={`w-4 h-4 ${studentSummaryLoading ? 'animate-spin' : ''}`} />
            </button>

            {/* Export Button */}
            <button
              onClick={() => handleExport('csv')}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
            >
              <Download className="w-4 h-4 mr-2" />
              Export
            </button>
          </div>
        </div>
      </div>

      {/* Status Breakdown Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-green-50 to-green-100/50 rounded-xl border border-green-200 p-4">
          <div className="flex items-center space-x-2 mb-2">
            <CheckCircle className="w-4 h-4 text-green-600" />
            <span className="text-sm font-medium text-green-800">Present</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{overview.present || 0}</p>
          <p className="text-xs text-gray-500 mt-1">
            {overview.totalDays > 0 ? Math.round((overview.present / overview.totalDays) * 100) : 0}% of days
          </p>
        </div>

        <div className="bg-gradient-to-br from-red-50 to-red-100/50 rounded-xl border border-red-200 p-4">
          <div className="flex items-center space-x-2 mb-2">
            <XCircle className="w-4 h-4 text-red-600" />
            <span className="text-sm font-medium text-red-800">Absent</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{overview.absent || 0}</p>
          <p className="text-xs text-gray-500 mt-1">
            {overview.totalDays > 0 ? Math.round((overview.absent / overview.totalDays) * 100) : 0}% of days
          </p>
        </div>

        <div className="bg-gradient-to-br from-yellow-50 to-yellow-100/50 rounded-xl border border-yellow-200 p-4">
          <div className="flex items-center space-x-2 mb-2">
            <Clock className="w-4 h-4 text-yellow-600" />
            <span className="text-sm font-medium text-yellow-800">Late</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{overview.late || 0}</p>
          <p className="text-xs text-gray-500 mt-1">
            {overview.totalDays > 0 ? Math.round((overview.late / overview.totalDays) * 100) : 0}% of days
          </p>
        </div>

        <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-xl border border-blue-200 p-4">
          <div className="flex items-center space-x-2 mb-2">
            <FileText className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-medium text-blue-800">Excused</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{overview.excused || 0}</p>
          <p className="text-xs text-gray-500 mt-1">
            {overview.totalDays > 0 ? Math.round((overview.excused / overview.totalDays) * 100) : 0}% of days
          </p>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Calendar View */}
        <div className="lg:col-span-1">
          <AttendanceCalendar 
            studentId={studentId}
            courseId={selectedStudentCourse !== 'all' ? selectedStudentCourse : null}
          />
        </div>

        {/* Quick Stats and Trends */}
        <div className="lg:col-span-1 space-y-6">
          {/* Attendance Trend Summary */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h4 className="text-sm font-medium text-gray-700 mb-4 flex items-center">
              <TrendingUp className="w-4 h-4 mr-2 text-purple-600" />
              Attendance Insights
            </h4>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600">Attendance Rate</span>
                  <span className={`font-medium ${getStatusColor(attendanceRate)}`}>
                    {attendanceRate}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${
                      attendanceRate >= 90 ? 'bg-green-500' :
                      attendanceRate >= 80 ? 'bg-yellow-500' :
                      attendanceRate >= 70 ? 'bg-orange-500' :
                      'bg-red-500'
                    }`}
                    style={{ width: `${Math.min(100, attendanceRate)}%` }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-2">
                <div>
                  <p className="text-xs text-gray-500">Best Day</p>
                  <p className="text-sm font-medium text-gray-900">
                    {overview.bestDay || 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Worst Day</p>
                  <p className="text-sm font-medium text-gray-900">
                    {overview.worstDay || 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Most Common</p>
                  <p className="text-sm font-medium text-gray-900">
                    {overview.mostCommon || 'Present'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">This Week</p>
                  <p className="text-sm font-medium text-gray-900">
                    {overview.thisWeek || 0} / 5 days
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl border border-purple-200 p-6">
            <h4 className="text-sm font-medium text-purple-800 mb-3">Quick Actions</h4>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={handleViewAllCourses}
                className="p-3 bg-white rounded-lg border border-purple-200 hover:border-purple-400 transition-colors text-left"
              >
                <BookOpen className="w-5 h-5 text-purple-600 mb-2" />
                <p className="text-sm font-medium text-gray-900">View All Courses</p>
                <p className="text-xs text-gray-500">{courseBreakdown.length} enrolled</p>
              </button>
              <button
                onClick={() => navigate(`/students/${studentId}`)}
                className="p-3 bg-white rounded-lg border border-purple-200 hover:border-purple-400 transition-colors text-left"
              >
                <User className="w-5 h-5 text-purple-600 mb-2" />
                <p className="text-sm font-medium text-gray-900">Student Profile</p>
                <p className="text-xs text-gray-500">View details</p>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Course Breakdown Table */}
      <div className="mt-6">
        <CourseBreakdownTable 
          courses={courseBreakdown}
          studentId={studentId}
          loading={studentSummaryLoading}
        />
      </div>
    </div>
  );
};

export default StudentAttendanceSummary;