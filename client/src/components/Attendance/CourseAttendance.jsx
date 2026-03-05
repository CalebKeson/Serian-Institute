// src/pages/Attendance/CourseAttendance.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router';
import { 
  ArrowLeft,
  Calendar,
  Clock,
  Users,
  CheckCircle,
  XCircle,
  Clock as TimeIcon,
  FileText,
  Download,
  BarChart3,
  RefreshCw,
  PieChart,
  TrendingUp
} from 'lucide-react';
import Layout from '../../components/Layout/Layout';
import { useCourseStore } from '../../stores/courseStore';
import { useAttendanceStore } from '../../stores/attendanceStore';
import { useAuthStore } from '../../stores/authStore';
import AttendanceTable from '../../components/Attendance/AttendanceTable';
import EditAttendanceModal from '../../components/Attendance/EditAttendanceModal';
import ExcusedReasonModal from '../../components/Attendance/ExcusedReasonModal';
import AttendanceCharts from '../../components/Attendance/AttendanceCharts';
import DateRangePicker from '../../components/Attendance/DateRangePicker';
import ReportSummary from '../../components/Attendance/ReportSummary';
import toast from 'react-hot-toast';

const CourseAttendance = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user } = useAuthStore();
  const { 
    currentCourse, 
    fetchCourse, 
    loading: courseLoading 
  } = useCourseStore();

  const {
    courseAttendance,
    loading: attendanceLoading,
    selectedDate,
    fetchCourseAttendance,
    quickUpdateStatus,
    bulkMarkAttendance,
    fetchAttendanceStats,
    fetchAttendanceReport,
    setSelectedDate,
    getCurrentAttendanceSummary,
    clearCourseAttendance,
    setCurrentClassSchedule,
    selectedDateRange,
    // Edit modal state and methods
    editModalOpen,
    currentEditRecord,
    editModalLoading,
    openEditModal,
    closeEditModal,
    saveAttendanceFromModal,
    // Excused modal state and methods
    excusedModalOpen,
    currentExcusedRecord,
    excusedModalLoading,
    closeExcusedModal,
    saveExcusedReason,
    markAsExcused
  } = useAttendanceStore();

  const [bulkAction, setBulkAction] = useState('');
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const [showCharts, setShowCharts] = useState(true);
  const [activeView, setActiveView] = useState('daily'); // 'daily', 'reports', 'charts'

  // Fetch course and initial data
  useEffect(() => {
    if (id) {
      fetchCourse(id);
      fetchCourseAttendance(id);
      fetchAttendanceStats(id);
      fetchAttendanceReport({ courseId: id });
    }
    
    // Cleanup function
    return () => {
      clearCourseAttendance();
    };
  }, [id]);

  // Set class schedule when course loads
  useEffect(() => {
    if (currentCourse?.schedule) {
      setCurrentClassSchedule(currentCourse.schedule);
    }
  }, [currentCourse, setCurrentClassSchedule]);

  // Fetch daily attendance when date changes
  useEffect(() => {
    if (id && selectedDate) {
      fetchCourseAttendance(id, selectedDate);
      fetchAttendanceStats(id, null, selectedDate, selectedDate);
    }
  }, [selectedDate]);

  const handleBack = () => {
    navigate('/courses');
  };

  const handleQuickStatusUpdate = async (studentId, status) => {
    setIsSaving(true);
    const result = await quickUpdateStatus(studentId, id, status);
    
    if (result.success) {
      toast.success(`Marked as ${status}`);
      fetchAttendanceStats(id, null, selectedDate, selectedDate);
      // Refresh report data if we're in reports view
      if (activeView === 'reports') {
        fetchAttendanceReport({ courseId: id });
      }
    } else {
      toast.error(result.message || 'Failed to update attendance');
    }
    setIsSaving(false);
  };

  const handleBulkStatusUpdate = async () => {
    if (!bulkAction || selectedStudents.length === 0) {
      toast.error('Please select students and an action');
      return;
    }

    setIsSaving(true);
    
    // Prepare attendance data for bulk update
    const attendanceData = selectedStudents.map(studentId => ({
      studentId,
      status: bulkAction,
      notes: ''
    }));

    const result = await bulkMarkAttendance(id, selectedDate, 'full-day', attendanceData);
    
    if (result.success) {
      toast.success(result.message || 'Bulk update successful');
      setSelectedStudents([]);
      setBulkAction('');
      fetchAttendanceStats(id, null, selectedDate, selectedDate);
      // Refresh report data if we're in reports view
      if (activeView === 'reports') {
        fetchAttendanceReport({ courseId: id });
      }
    } else {
      toast.error(result.message || 'Failed to update attendance');
    }
    setIsSaving(false);
  };

  const handleStudentSelect = (studentId) => {
    setSelectedStudents(prev => 
      prev.includes(studentId) 
        ? prev.filter(id => id !== studentId)
        : [...prev, studentId]
    );
  };

  const handleSelectAll = () => {
    if (selectedStudents.length === courseAttendance.length) {
      setSelectedStudents([]);
    } else {
      const allStudentIds = courseAttendance
        .filter(record => record.student?._id)
        .map(record => record.student._id);
      setSelectedStudents(allStudentIds);
    }
  };

  const handleViewStudent = (studentId) => {
    navigate(`/students/${studentId}`);
  };

  const handleEditAttendance = (attendanceRecord) => {
    openEditModal(attendanceRecord);
  };

  const handleExportAttendance = () => {
    const headers = ['Student ID', 'Name', 'Email', 'Phone', 'Status', 'Check-in Time', 'Notes', 'Excused Reason'];
    const csvData = courseAttendance.map(record => [
      record.student?.studentId || '',
      record.student?.user?.name || '',
      record.student?.user?.email || '',
      record.student?.phone || '',
      record.status,
      record.checkInTime || '',
      record.notes || '',
      record.excusedReason || ''
    ]);

    const csvContent = [headers, ...csvData]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${currentCourse?.courseCode || 'course'}_attendance_${selectedDate}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);

    toast.success('Attendance exported successfully!');
  };

  const handleDateRangeChange = (range) => {
    if (activeView === 'reports') {
      fetchAttendanceReport({ 
        courseId: id,
        startDate: range.startDate,
        endDate: range.endDate
      });
    }
  };

  const attendanceSummary = getCurrentAttendanceSummary();

  if (courseLoading && !currentCourse) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
        </div>
      </Layout>
    );
  }

  if (!currentCourse && !courseLoading) {
    return (
      <Layout>
        <div className="text-center py-12">
          <Calendar className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Course not found</h3>
          <p className="mt-1 text-sm text-gray-500">The course you're looking for doesn't exist.</p>
          <button
            onClick={handleBack}
            className="mt-4 inline-flex items-center px-4 py-2 border border-transparent rounded-lg text-sm font-medium text-white bg-purple-600 hover:bg-purple-700"
          >
            Back to Courses
          </button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={handleBack}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                  <Calendar className="w-8 h-8 mr-3 text-purple-600" />
                  Attendance Management
                </h1>
                <p className="mt-2 text-gray-600">
                  Mark and manage attendance for {currentCourse.courseCode} - {currentCourse.name}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* View Tabs */}
        <div className="mb-6 border-b border-gray-200">
          <nav className="flex -mb-px space-x-8">
            <button
              onClick={() => setActiveView('daily')}
              className={`py-4 px-1 text-sm font-medium border-b-2 transition-colors ${
                activeView === 'daily'
                  ? 'border-purple-600 text-purple-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Clock className="w-4 h-4 inline mr-2" />
              Daily Attendance
            </button>
            <button
              onClick={() => setActiveView('reports')}
              className={`py-4 px-1 text-sm font-medium border-b-2 transition-colors ${
                activeView === 'reports'
                  ? 'border-purple-600 text-purple-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <PieChart className="w-4 h-4 inline mr-2" />
              Reports & Analytics
            </button>
            <button
              onClick={() => setActiveView('charts')}
              className={`py-4 px-1 text-sm font-medium border-b-2 transition-colors ${
                activeView === 'charts'
                  ? 'border-purple-600 text-purple-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <TrendingUp className="w-4 h-4 inline mr-2" />
              Charts
            </button>
          </nav>
        </div>

        {/* Daily Attendance View */}
        {activeView === 'daily' && (
          <>
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <CheckCircle className="w-6 h-6 text-green-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Present</p>
                    <p className="text-2xl font-bold text-gray-900">{attendanceSummary.present}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-red-100 rounded-lg">
                    <XCircle className="w-6 h-6 text-red-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Absent</p>
                    <p className="text-2xl font-bold text-gray-900">{attendanceSummary.absent}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-yellow-100 rounded-lg">
                    <TimeIcon className="w-6 h-6 text-yellow-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Late</p>
                    <p className="text-2xl font-bold text-gray-900">{attendanceSummary.late}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <FileText className="w-6 h-6 text-blue-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Excused</p>
                    <p className="text-2xl font-bold text-gray-900">{attendanceSummary.excused}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <BarChart3 className="w-6 h-6 text-purple-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Attendance Rate</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {attendanceSummary.attendanceRate.toFixed(1)}%
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Date Selector and Actions */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center">
                  <label className="text-sm font-medium text-gray-700 mr-3 whitespace-nowrap">
                    <Calendar className="w-4 h-4 inline mr-2" />
                    Select Date
                  </label>
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
                  />
                </div>

                <button
                  onClick={() => fetchCourseAttendance(id, selectedDate)}
                  disabled={attendanceLoading}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 transition-colors"
                >
                  <RefreshCw className={`w-4 h-4 mr-2 ${attendanceLoading ? 'animate-spin' : ''}`} />
                  Refresh
                </button>

                <button
                  onClick={handleExportAttendance}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors ml-auto"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </button>
              </div>
            </div>

            {/* Bulk Actions */}
            {selectedStudents.length > 0 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
                  <div className="flex items-center space-x-3">
                    <span className="text-sm font-medium text-yellow-800">
                      {selectedStudents.length} students selected
                    </span>
                    
                    <select
                      value={bulkAction}
                      onChange={(e) => setBulkAction(e.target.value)}
                      className="border border-yellow-300 rounded-lg px-3 py-1 text-sm focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 bg-white"
                    >
                      <option value="">Bulk Action</option>
                      <option value="present">Mark as Present</option>
                      <option value="absent">Mark as Absent</option>
                      <option value="late">Mark as Late</option>
                      <option value="excused">Mark as Excused</option>
                    </select>

                    <button
                      onClick={handleBulkStatusUpdate}
                      disabled={!bulkAction || isSaving}
                      className="px-3 py-1 bg-yellow-600 text-white text-sm font-medium rounded-lg hover:bg-yellow-700 disabled:opacity-50 transition-colors"
                    >
                      Apply
                    </button>
                  </div>

                  <button
                    onClick={() => setSelectedStudents([])}
                    className="text-sm text-yellow-700 hover:text-yellow-800 transition-colors"
                  >
                    Clear Selection
                  </button>
                </div>
              </div>
            )}

            {/* Course Info */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {currentCourse.courseCode} - {currentCourse.name}
                  </h3>
                  <p className="text-gray-600">
                    Instructor: {currentCourse.instructor?.name} • 
                    Students: {currentCourse.enrolledCount || currentCourse.enrolledStudents?.length || 0} enrolled
                  </p>
                  {currentCourse.schedule && (
                    <p className="text-sm text-blue-600 mt-2">
                      <Clock className="w-4 h-4 inline mr-1" />
                      Schedule: {currentCourse.schedule.time} • {currentCourse.schedule.days?.join(', ')}
                    </p>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500">Selected Date</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {new Date(selectedDate).toLocaleDateString('en-US', { 
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>
              </div>
            </div>

            {/* Attendance Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <AttendanceTable
                attendance={courseAttendance}
                loading={attendanceLoading}
                onStatusUpdate={handleQuickStatusUpdate}
                onViewStudent={handleViewStudent}
                onEditAttendance={handleEditAttendance}
                currentUser={user}
                courseId={id}
                view="course"
                markAsExcused={markAsExcused}
              />
            </div>
          </>
        )}

        {/* Reports View */}
        {activeView === 'reports' && (
          <div className="space-y-6">
            <DateRangePicker 
              courseId={id}
              onRangeChange={handleDateRangeChange}
              showExport={true}
            />
            <ReportSummary courseId={id} />
          </div>
        )}

        {/* Charts View */}
        {activeView === 'charts' && (
          <div className="space-y-6">
            <div className="flex justify-end">
              <button
                onClick={() => setShowCharts(!showCharts)}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
              >
                <BarChart3 className="w-4 h-4 mr-2" />
                {showCharts ? 'Hide Charts' : 'Show Charts'}
              </button>
            </div>
            {showCharts && (
              <AttendanceCharts
                courseId={id}
                view="course"
              />
            )}
          </div>
        )}

        {/* Quick Guide - Show in all views */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-xl p-6">
          <h4 className="text-sm font-medium text-blue-800 mb-3">Quick Guide</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-700">
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span><strong>Present:</strong> Student attended the session</span>
            </div>
            <div className="flex items-center space-x-2">
              <XCircle className="w-4 h-4 text-red-600" />
              <span><strong>Absent:</strong> Student did not attend</span>
            </div>
            <div className="flex items-center space-x-2">
              <TimeIcon className="w-4 h-4 text-yellow-600" />
              <span><strong>Late:</strong> Student arrived after start time</span>
            </div>
            <div className="flex items-center space-x-2">
              <FileText className="w-4 h-4 text-blue-600" />
              <span><strong>Excused:</strong> Absence with valid reason</span>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Attendance Modal */}
      <EditAttendanceModal
        isOpen={editModalOpen}
        onClose={closeEditModal}
        attendanceRecord={currentEditRecord}
        onSave={saveAttendanceFromModal}
        loading={editModalLoading}
      />

      {/* Excused Reason Modal */}
      <ExcusedReasonModal
        isOpen={excusedModalOpen}
        onClose={closeExcusedModal}
        onSave={saveExcusedReason}
        initialReason={currentExcusedRecord?.excusedReason || ''}
        studentName={currentExcusedRecord?.student?.user?.name}
        loading={excusedModalLoading}
      />
    </Layout>
  );
};

export default CourseAttendance;