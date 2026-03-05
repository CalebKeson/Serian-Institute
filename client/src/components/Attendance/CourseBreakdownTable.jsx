// src/components/Attendance/CourseBreakdownTable.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import {
  BookOpen,
  TrendingUp,
  TrendingDown,
  Minus,
  Eye,
  BarChart3,
  CheckCircle,
  XCircle,
  Clock,
  FileText,
  ArrowRight,
  Download
} from 'lucide-react';

const CourseBreakdownTable = ({ courses, studentId, loading }) => {
  const navigate = useNavigate();
  const [sortField, setSortField] = useState('attendanceRate');
  const [sortDirection, setSortDirection] = useState('desc');
  const [expandedCourse, setExpandedCourse] = useState(null);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const sortedCourses = [...courses].sort((a, b) => {
    let aVal = a[sortField];
    let bVal = b[sortField];
    
    if (sortField === 'attendanceRate' || sortField === 'totalClasses') {
      aVal = Number(aVal);
      bVal = Number(bVal);
    }
    
    if (sortDirection === 'asc') {
      return aVal > bVal ? 1 : -1;
    } else {
      return aVal < bVal ? 1 : -1;
    }
  });

  const getRateColor = (rate) => {
    if (rate >= 90) return 'text-green-600';
    if (rate >= 80) return 'text-yellow-600';
    if (rate >= 70) return 'text-orange-600';
    return 'text-red-600';
  };

  const getRateBgColor = (rate) => {
    if (rate >= 90) return 'bg-green-100';
    if (rate >= 80) return 'bg-yellow-100';
    if (rate >= 70) return 'bg-orange-100';
    return 'bg-red-100';
  };

  const getTrendIcon = (trend) => {
    if (trend > 0) return <TrendingUp className="w-4 h-4 text-green-600" />;
    if (trend < 0) return <TrendingDown className="w-4 h-4 text-red-600" />;
    return <Minus className="w-4 h-4 text-gray-400" />;
  };

  const handleViewCourse = (courseId) => {
    navigate(`/courses/${courseId}`);
  };

  const handleViewAttendance = (courseId) => {
    navigate(`/courses/${courseId}/attendance`);
  };

  const handleExportCourseData = (course) => {
    // Create CSV data
    const headers = ['Date', 'Status', 'Check-in Time', 'Notes'];
    const csvData = course.recentAttendance?.map(record => [
      new Date(record.date).toLocaleDateString(),
      record.status,
      record.checkInTime || '',
      record.notes || ''
    ]) || [];

    const csvContent = [headers, ...csvData]
      .map(row => row.join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${course.courseCode}_attendance.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="p-6 animate-pulse">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="mb-6 last:mb-0">
              <div className="flex items-center space-x-4 mb-4">
                <div className="h-10 w-10 bg-gray-200 rounded-lg"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/3"></div>
                </div>
              </div>
              <div className="grid grid-cols-4 gap-4 mb-4">
                {[...Array(4)].map((_, j) => (
                  <div key={j} className="h-16 bg-gray-200 rounded"></div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (courses.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
        <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Course Data</h3>
        <p className="text-gray-500">
          This student is not enrolled in any courses or no attendance data is available.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-blue-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <BookOpen className="w-5 h-5 text-purple-600" />
            <h3 className="text-lg font-semibold text-gray-900">Course Performance</h3>
          </div>
          <span className="text-sm text-gray-500">{courses.length} Courses</span>
        </div>
      </div>

      {/* Table Header */}
      <div className="hidden md:grid grid-cols-12 gap-4 p-4 bg-gray-50 border-b border-gray-200 text-xs font-medium text-gray-500 uppercase tracking-wider">
        <div className="col-span-4 flex items-center space-x-2 cursor-pointer" onClick={() => handleSort('courseName')}>
          <span>Course</span>
          {sortField === 'courseName' && (
            <span>{sortDirection === 'asc' ? '↑' : '↓'}</span>
          )}
        </div>
        <div className="col-span-1 text-center cursor-pointer" onClick={() => handleSort('totalClasses')}>
          Classes
          {sortField === 'totalClasses' && (sortDirection === 'asc' ? '↑' : '↓')}
        </div>
        <div className="col-span-1 text-center">Present</div>
        <div className="col-span-1 text-center">Absent</div>
        <div className="col-span-1 text-center">Late</div>
        <div className="col-span-1 text-center">Excused</div>
        <div className="col-span-1 text-center cursor-pointer" onClick={() => handleSort('attendanceRate')}>
          Rate
          {sortField === 'attendanceRate' && (sortDirection === 'asc' ? '↑' : '↓')}
        </div>
        <div className="col-span-1 text-center">Trend</div>
        <div className="col-span-1 text-right">Actions</div>
      </div>

      {/* Course Rows */}
      <div className="divide-y divide-gray-200">
        {sortedCourses.map((course, index) => (
          <div key={course.courseId || index} className="p-4 hover:bg-gray-50 transition-colors">
            {/* Mobile View */}
            <div className="md:hidden space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="h-10 w-10 bg-gradient-to-r from-purple-600 to-indigo-700 rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold text-sm">
                      {course.courseCode?.charAt(0) || 'C'}
                    </span>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">{course.courseName}</h4>
                    <p className="text-xs text-gray-500">{course.courseCode}</p>
                  </div>
                </div>
                <div className={`px-3 py-1 rounded-full text-sm font-bold ${getRateBgColor(course.attendanceRate)} ${getRateColor(course.attendanceRate)}`}>
                  {course.attendanceRate}%
                </div>
              </div>

              <div className="grid grid-cols-4 gap-2 text-center">
                <div className="bg-green-50 rounded-lg p-2">
                  <p className="text-xs text-gray-500">Present</p>
                  <p className="text-lg font-bold text-green-600">{course.present || 0}</p>
                </div>
                <div className="bg-red-50 rounded-lg p-2">
                  <p className="text-xs text-gray-500">Absent</p>
                  <p className="text-lg font-bold text-red-600">{course.absent || 0}</p>
                </div>
                <div className="bg-yellow-50 rounded-lg p-2">
                  <p className="text-xs text-gray-500">Late</p>
                  <p className="text-lg font-bold text-yellow-600">{course.late || 0}</p>
                </div>
                <div className="bg-blue-50 rounded-lg p-2">
                  <p className="text-xs text-gray-500">Excused</p>
                  <p className="text-lg font-bold text-blue-600">{course.excused || 0}</p>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-gray-500">Total Classes: {course.totalClasses || 0}</span>
                  <div className="flex items-center space-x-1">
                    {getTrendIcon(course.trend)}
                    <span className="text-xs text-gray-500">
                      {course.trend > 0 ? '+' : ''}{course.trend}%
                    </span>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleViewCourse(course.courseId)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="View Course"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleViewAttendance(course.courseId)}
                    className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                    title="View Attendance"
                  >
                    <BarChart3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleExportCourseData(course)}
                    className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                    title="Export Data"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Expandable Recent Attendance */}
              {course.recentAttendance && course.recentAttendance.length > 0 && (
                <div className="mt-2">
                  <button
                    onClick={() => setExpandedCourse(expandedCourse === course.courseId ? null : course.courseId)}
                    className="text-xs text-purple-600 flex items-center"
                  >
                    Recent Attendance
                    <ArrowRight className={`w-3 h-3 ml-1 transition-transform ${
                      expandedCourse === course.courseId ? 'rotate-90' : ''
                    }`} />
                  </button>
                  
                  {expandedCourse === course.courseId && (
                    <div className="mt-2 space-y-1">
                      {course.recentAttendance.slice(0, 3).map((record, idx) => (
                        <div key={idx} className="flex items-center justify-between text-xs bg-gray-50 p-2 rounded">
                          <span>{new Date(record.date).toLocaleDateString()}</span>
                          <span className={`px-2 py-0.5 rounded-full ${
                            record.status === 'present' ? 'bg-green-100 text-green-700' :
                            record.status === 'absent' ? 'bg-red-100 text-red-700' :
                            record.status === 'late' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-blue-100 text-blue-700'
                          }`}>
                            {record.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Desktop View */}
            <div className="hidden md:grid grid-cols-12 gap-4 items-center">
              {/* Course Info */}
              <div className="col-span-4">
                <div className="flex items-center space-x-3">
                  <div className="h-10 w-10 bg-gradient-to-r from-purple-600 to-indigo-700 rounded-lg flex items-center justify-center flex-shrink-0">
                    <span className="text-white font-bold text-sm">
                      {course.courseCode?.charAt(0) || 'C'}
                    </span>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">{course.courseName}</h4>
                    <p className="text-xs text-gray-500">{course.courseCode}</p>
                    {course.instructor && (
                      <p className="text-xs text-gray-400">Instructor: {course.instructor}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Total Classes */}
              <div className="col-span-1 text-center font-medium">
                {course.totalClasses || 0}
              </div>

              {/* Present */}
              <div className="col-span-1 text-center">
                <span className="text-green-600 font-medium">{course.present || 0}</span>
              </div>

              {/* Absent */}
              <div className="col-span-1 text-center">
                <span className="text-red-600 font-medium">{course.absent || 0}</span>
              </div>

              {/* Late */}
              <div className="col-span-1 text-center">
                <span className="text-yellow-600 font-medium">{course.late || 0}</span>
              </div>

              {/* Excused */}
              <div className="col-span-1 text-center">
                <span className="text-blue-600 font-medium">{course.excused || 0}</span>
              </div>

              {/* Attendance Rate with Progress Bar */}
              <div className="col-span-1">
                <div className="flex items-center space-x-2">
                  <span className={`text-sm font-bold ${getRateColor(course.attendanceRate)}`}>
                    {course.attendanceRate}%
                  </span>
                  <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        course.attendanceRate >= 90 ? 'bg-green-500' :
                        course.attendanceRate >= 80 ? 'bg-yellow-500' :
                        course.attendanceRate >= 70 ? 'bg-orange-500' :
                        'bg-red-500'
                      }`}
                      style={{ width: `${Math.min(100, course.attendanceRate)}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Trend */}
              <div className="col-span-1 text-center">
                <div className="flex items-center justify-center space-x-1">
                  {getTrendIcon(course.trend)}
                  <span className="text-xs text-gray-600">
                    {course.trend > 0 ? '+' : ''}{course.trend}%
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="col-span-1 text-right">
                <div className="flex items-center justify-end space-x-2">
                  <button
                    onClick={() => handleViewCourse(course.courseId)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="View Course"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleViewAttendance(course.courseId)}
                    className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                    title="View Attendance"
                  >
                    <BarChart3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleExportCourseData(course)}
                    className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                    title="Export Data"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Summary Footer */}
      <div className="p-4 bg-gray-50 border-t border-gray-200">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="text-center">
            <p className="text-xs text-gray-500">Total Classes</p>
            <p className="text-lg font-bold text-gray-900">
              {courses.reduce((sum, c) => sum + (c.totalClasses || 0), 0)}
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs text-gray-500">Total Present</p>
            <p className="text-lg font-bold text-green-600">
              {courses.reduce((sum, c) => sum + (c.present || 0), 0)}
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs text-gray-500">Total Absent</p>
            <p className="text-lg font-bold text-red-600">
              {courses.reduce((sum, c) => sum + (c.absent || 0), 0)}
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs text-gray-500">Total Late</p>
            <p className="text-lg font-bold text-yellow-600">
              {courses.reduce((sum, c) => sum + (c.late || 0), 0)}
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs text-gray-500">Overall Rate</p>
            <p className="text-lg font-bold text-purple-600">
              {(() => {
                const total = courses.reduce((sum, c) => sum + (c.totalClasses || 0), 0);
                const present = courses.reduce((sum, c) => sum + (c.present || 0), 0);
                const excused = courses.reduce((sum, c) => sum + (c.excused || 0), 0);
                return total > 0 ? Math.round(((present + excused) / total) * 100) : 0;
              })()}%
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourseBreakdownTable;