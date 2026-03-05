import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router';
import { 
  ArrowLeft,
  BookOpen,
  Users,
  UserPlus,
  Download,
  BarChart3,
  CheckCircle,
  XCircle,
  Award,
  Loader,
  RefreshCw,
  AlertCircle
} from 'lucide-react';
import Layout from '../../components/Layout/Layout';
import { useCourseStore } from '../../stores/courseStore';
import { useEnrollmentStore } from '../../stores/enrollmentStore';
import { useAuthStore } from '../../stores/authStore';
import EnrollmentTable from '../../components/Enrollment/EnrollmentTable';
import AddStudentModal from '../../components/Enrollment/AddStudentModal';
import toast from 'react-hot-toast';

const CourseEnrollments = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user } = useAuthStore();
  const { 
    currentCourse, 
    fetchCourse, 
    loading: courseLoading 
  } = useCourseStore();

  const {
    courseEnrollments,
    availableStudents,
    loading: enrollmentsLoading,
    fetchCourseEnrollments,
    enrollStudent,
    removeStudent,
    updateEnrollment,
    searchAvailableStudents,
    clearAvailableStudents,
    clearEnrollments
  } = useEnrollmentStore();

  // CHANGED: Default tab to 'all' instead of 'enrolled'
  const [activeView, setActiveView] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [enrolling, setEnrolling] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [initialLoadDone, setInitialLoadDone] = useState(false);

  // Load initial data when component mounts
  useEffect(() => {
    if (id) {
      loadInitialData();
    }

    return () => {
      clearEnrollments();
      clearAvailableStudents();
    };
  }, [id]);

  // Load data when activeView changes
  useEffect(() => {
    if (id && initialLoadDone) {
      loadEnrollmentsByView();
    }
  }, [id, activeView, initialLoadDone]);

  const loadInitialData = async () => {
    setRefreshing(true);
    try {
      // Load both course and enrollments in parallel
      await Promise.all([
        fetchCourse(id),
        fetchCourseEnrollments(id, activeView === 'all' ? '' : activeView)
      ]);
      setInitialLoadDone(true);
    } catch (error) {
      console.error('Error loading initial data:', error);
      toast.error('Failed to load enrollment data');
    } finally {
      setRefreshing(false);
    }
  };

  const loadEnrollmentsByView = async () => {
    const status = activeView === 'all' ? '' : activeView;
    await fetchCourseEnrollments(id, status);
  };

  // Search available students when modal is open
  useEffect(() => {
    if (showAddModal && searchTerm !== undefined) {
      const timer = setTimeout(() => {
        searchAvailableStudents(id, searchTerm);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [searchTerm, showAddModal, id]);

  const handleBack = () => {
    navigate(`/courses/${id}`);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        fetchCourse(id),
        fetchCourseEnrollments(id, activeView === 'all' ? '' : activeView)
      ]);
      toast.success('Data refreshed');
    } catch (error) {
      toast.error('Failed to refresh data');
    } finally {
      setRefreshing(false);
    }
  };

  const handleEnrollStudent = async (studentId, notes = '') => {
    setEnrolling(true);
    try {
      const result = await enrollStudent(id, studentId, notes);
      
      if (result.success) {
        setShowAddModal(false);
        setSearchTerm('');
        clearAvailableStudents();
        
        // Refresh data
        await Promise.all([
          fetchCourse(id),
          fetchCourseEnrollments(id, activeView === 'all' ? '' : activeView)
        ]);
        
        toast.success(result.message || 'Student enrolled successfully!');
      }
    } catch (error) {
      console.error('Enroll error:', error);
      toast.error('Failed to enroll student');
    } finally {
      setEnrolling(false);
    }
  };

  const handleRemoveStudent = async (studentId) => {
    if (!window.confirm('Are you sure you want to remove this student from the course? This action cannot be undone.')) {
      return;
    }
    
    try {
      const result = await removeStudent(id, studentId);
      
      if (result.success) {
        // Refresh data
        await Promise.all([
          fetchCourse(id),
          fetchCourseEnrollments(id, activeView === 'all' ? '' : activeView)
        ]);
        
        toast.success('Student removed from course successfully');
      }
    } catch (error) {
      console.error('Remove student error:', error);
      toast.error('Failed to remove student');
    }
  };

  const handleUpdateStatus = async (enrollmentId, data) => {
    try {
      const result = await updateEnrollment(enrollmentId, data);
      
      if (result.success) {
        // Refresh data
        await Promise.all([
          fetchCourse(id),
          fetchCourseEnrollments(id, activeView === 'all' ? '' : activeView)
        ]);
        
        toast.success(`Student status updated to ${data.status}`);
      }
    } catch (error) {
      console.error('Update status error:', error);
      toast.error('Failed to update status');
    }
  };

  const handleExportEnrollments = () => {
    if (courseEnrollments.length === 0) {
      toast.error('No enrollments to export');
      return;
    }

    const headers = ['Student ID', 'Name', 'Email', 'Enrollment Date', 'Status', 'Grade'];
    const csvData = courseEnrollments.map(enrollment => [
      enrollment.student?.studentId || '',
      enrollment.student?.user?.name || '',
      enrollment.student?.user?.email || '',
      new Date(enrollment.enrollmentDate).toLocaleDateString(),
      enrollment.status,
      enrollment.grade || 'Not Graded' // CHANGED: Default for export
    ]);

    const csvContent = [headers, ...csvData]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${currentCourse?.courseCode || 'course'}_enrollments.csv`;
    a.click();
    window.URL.revokeObjectURL(url);

    toast.success('Enrollments exported successfully!');
  };

  // Calculate stats from enrollments
  const getEnrollmentStats = () => {
    const enrolled = courseEnrollments.filter(e => e.status === 'enrolled').length;
    const dropped = courseEnrollments.filter(e => e.status === 'dropped').length;
    const completed = courseEnrollments.filter(e => e.status === 'completed').length;
    return {
      enrolled,
      dropped,
      completed,
      total: courseEnrollments.length
    };
  };

  const stats = getEnrollmentStats();
  const canManage = ['admin', 'instructor', 'receptionist'].includes(user?.role);
  
  const enrolledCount = stats.enrolled || 0;
  const maxStudents = currentCourse?.maxStudents || 0;
  const isFull = enrolledCount >= maxStudents;
  const availableSpots = maxStudents > 0 ? maxStudents - enrolledCount : 0;

  if (courseLoading && !currentCourse && !refreshing && !initialLoadDone) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-96">
          <div className="text-center">
            <Loader className="w-12 h-12 animate-spin text-purple-600 mx-auto" />
            <p className="mt-4 text-gray-600">Loading course data...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (!currentCourse && !courseLoading && initialLoadDone) {
    return (
      <Layout>
        <div className="text-center py-12">
          <AlertCircle className="mx-auto h-12 w-12 text-red-500" />
          <h3 className="mt-4 text-lg font-medium text-gray-900">Course not found</h3>
          <p className="mt-2 text-sm text-gray-500">
            The course you're looking for doesn't exist or has been removed.
          </p>
          <button
            onClick={() => navigate('/courses')}
            className="mt-6 inline-flex items-center px-4 py-2 border border-transparent rounded-lg text-sm font-medium text-white bg-purple-600 hover:bg-purple-700"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Courses
          </button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={handleBack}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                  <Users className="w-8 h-8 mr-3 text-purple-600" />
                  Enrollment Management
                </h1>
                <p className="mt-2 text-gray-600">
                  {currentCourse?.courseCode} - {currentCourse?.name || 'Loading...'}
                </p>
              </div>
            </div>

            <div className="mt-4 lg:mt-0 flex space-x-3">
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 transition-colors"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                Refresh
              </button>
              
              <button
                onClick={handleExportEnrollments}
                disabled={courseEnrollments.length === 0}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Download className="w-4 h-4 mr-2" />
                Export
              </button>

              {canManage && !isFull && (
                <button
                  onClick={() => setShowAddModal(true)}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg text-sm font-medium text-white bg-gradient-to-r from-purple-600 to-indigo-700 hover:from-purple-700 hover:to-indigo-800 transition-all shadow-sm hover:shadow-md"
                >
                  <UserPlus className="w-4 h-4 mr-2" />
                  Add Student
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Currently Enrolled</p>
                <p className="text-2xl font-bold text-gray-900 mt-2">{stats.enrolled}</p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Completed</p>
                <p className="text-2xl font-bold text-gray-900 mt-2">{stats.completed}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <Award className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Dropped</p>
                <p className="text-2xl font-bold text-gray-900 mt-2">{stats.dropped}</p>
              </div>
              <div className="p-3 bg-red-100 rounded-lg">
                <XCircle className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Available Spots</p>
                <p className="text-2xl font-bold text-gray-900 mt-2">{availableSpots}</p>
              </div>
              <div className="p-3 bg-purple-100 rounded-lg">
                <Users className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Capacity Alert */}
        {isFull && currentCourse && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4">
            <div className="flex items-center">
              <XCircle className="w-5 h-5 text-red-600 mr-3" />
              <div>
                <h4 className="text-sm font-medium text-red-800">Course Full</h4>
                <p className="text-sm text-red-700 mt-1">
                  This course has reached its maximum capacity of {currentCourse.maxStudents} students.
                  You cannot enroll additional students until spots become available.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* CHANGED: View Toggles - New order: All, Enrolled, Completed, Dropped */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setActiveView('all')}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                activeView === 'all'
                  ? 'bg-purple-600 text-white'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              All ({stats.total})
            </button>
            <button
              onClick={() => setActiveView('enrolled')}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                activeView === 'enrolled'
                  ? 'bg-purple-600 text-white'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              Enrolled ({stats.enrolled})
            </button>
            <button
              onClick={() => setActiveView('completed')}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                activeView === 'completed'
                  ? 'bg-purple-600 text-white'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              Completed ({stats.completed})
            </button>
            <button
              onClick={() => setActiveView('dropped')}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                activeView === 'dropped'
                  ? 'bg-purple-600 text-white'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              Dropped ({stats.dropped})
            </button>
          </div>
        </div>

        {/* Enrollment Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <EnrollmentTable
            enrollments={courseEnrollments}
            loading={enrollmentsLoading || refreshing}
            onRemoveStudent={handleRemoveStudent}
            onUpdateEnrollment={handleUpdateStatus}
            currentUser={user}
            courseId={id}
            view="course"
          />
        </div>

        {/* Capacity Progress */}
        {currentCourse && (
          <div className="mt-6 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Course Capacity</h3>
            <div className="space-y-4">
              <div className="flex justify-between text-sm text-gray-600">
                <span>Enrollment Progress</span>
                <span>
                  {stats.enrolled} / {currentCourse.maxStudents} students
                  ({currentCourse.maxStudents > 0 
                    ? Math.round((stats.enrolled / currentCourse.maxStudents) * 100) 
                    : 0}%)
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div 
                  className={`h-3 rounded-full transition-all duration-500 ${
                    stats.enrolled >= currentCourse.maxStudents 
                      ? 'bg-red-600'
                      : stats.enrolled >= currentCourse.maxStudents * 0.8
                      ? 'bg-orange-500'
                      : 'bg-green-500'
                  }`}
                  style={{ 
                    width: `${currentCourse.maxStudents > 0 
                      ? Math.min(100, (stats.enrolled / currentCourse.maxStudents) * 100) 
                      : 0}%` 
                  }}
                ></div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Add Student Modal */}
      {showAddModal && currentCourse && (
        <AddStudentModal
          course={{
            ...currentCourse,
            availableSpots,
            enrolledCount: stats.enrolled
          }}
          availableStudents={availableStudents}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          onEnrollStudent={handleEnrollStudent}
          onClose={() => {
            setShowAddModal(false);
            setSearchTerm('');
            clearAvailableStudents();
          }}
          loading={enrolling}
        />
      )}
    </Layout>
  );
};

export default CourseEnrollments;