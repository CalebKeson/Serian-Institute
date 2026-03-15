// src/pages/Courses/CourseDetails.jsx - UPDATED WITH CNA
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router';
import {
  ArrowLeft,
  BookOpen,
  User,
  Calendar,
  Clock,
  MapPin,
  Users,
  Building,
  Edit,
  BadgeCheck,
  XCircle,
  Clock as TimeIcon,
  Shield,
  Mail,
  UserPlus,
  Award,
  Hash,
  Car,
  Droplets,
  Zap,
  Cpu,
  FileText,
  BarChart3,
  CheckCircle,
  AlertCircle,
  Loader,
  ChevronRight,
  GraduationCap,
  Wrench,
  Award as GradeIcon,
  DollarSign,
  HeartPulse // ADD THIS for CNA
} from 'lucide-react';
import Layout from '../../components/Layout/Layout';
import { useCourseStore } from '../../stores/courseStore';
import { useEnrollmentStore } from '../../stores/enrollmentStore';
import { useAuthStore } from '../../stores/authStore';
import { useGradeStore } from '../../stores/gradeStore';
import { usePaymentStore } from '../../stores/paymentStore';
import GradeTable from '../../components/Grades/GradeTable';
import GradeEntryModal from '../../components/Grades/GradeEntryModal';
import GradeStatistics from '../../components/Grades/GradeStatistics';
import { formatCurrency } from '../../utils/feeFormatter';
import toast from 'react-hot-toast';

const CourseDetails = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user } = useAuthStore();
  const { 
    currentCourse, 
    fetchCourse, 
    loading: courseLoading,
    clearCurrentCourse 
  } = useCourseStore();
  
  const {
    courseEnrollments,
    fetchCourseEnrollments,
    loading: enrollmentsLoading
  } = useEnrollmentStore();

  const {
    courseGrades,
    loading: gradesLoading,
    fetchCourseGrades,
    createGrade,
    updateGrade,
    deleteGrade,
    clearGrades
  } = useGradeStore();

  const {
    coursePaymentSummary,
    fetchCoursePaymentSummary,
    loading: paymentLoading
  } = usePaymentStore();

  const [activeTab, setActiveTab] = useState('overview');
  const [refreshing, setRefreshing] = useState(false);
  const [showGradeModal, setShowGradeModal] = useState(false);
  const [editingGrade, setEditingGrade] = useState(null);

  // Fetch course and enrollment data
  useEffect(() => {
    if (id) {
      loadCourseData();
    }

    return () => {
      clearCurrentCourse();
      clearGrades();
    };
  }, [id]);

  // Fetch grades when switching to grades tab
  useEffect(() => {
    if (activeTab === 'grades' && id) {
      fetchCourseGrades(id);
    }
  }, [activeTab, id]);

  // Fetch payment summary when switching to fees tab
  useEffect(() => {
    if (activeTab === 'fees' && id) {
      fetchCoursePaymentSummary(id);
    }
  }, [activeTab, id]);

  const loadCourseData = async () => {
    setRefreshing(true);
    try {
      await fetchCourse(id);
      await fetchCourseEnrollments(id, 'enrolled');
    } catch (error) {
      console.error('Error loading course data:', error);
      toast.error('Failed to load course details');
    } finally {
      setRefreshing(false);
    }
  };

  const handleBack = () => {
    navigate('/courses');
  };

  const handleEdit = () => {
    navigate(`/courses/edit/${id}`);
  };

  const handleManageEnrollments = () => {
    navigate(`/courses/${id}/enrollments`);
  };

  const handleViewCourseFees = () => {
    navigate(`/fees/course/${id}`);
  };

  const handleRefresh = () => {
    loadCourseData();
    if (activeTab === 'grades') {
      fetchCourseGrades(id);
    }
    if (activeTab === 'fees') {
      fetchCoursePaymentSummary(id);
    }
    toast.success('Course data refreshed');
  };

  // Grade handlers
  const handleAddGrade = () => {
    setEditingGrade(null);
    setShowGradeModal(true);
  };

  const handleEditGrade = (grade) => {
    setEditingGrade(grade);
    setShowGradeModal(true);
  };

  const handleDeleteGrade = async (grade) => {
    if (window.confirm(`Are you sure you want to delete this grade for ${grade.student?.user?.name}?`)) {
      const result = await deleteGrade(grade._id, id);
      if (result.success) {
        toast.success('Grade deleted successfully');
      }
    }
  };

  const handleSaveGrade = async (gradeData) => {
    let result;
    if (editingGrade) {
      result = await updateGrade(editingGrade._id, gradeData, id);
    } else {
      result = await createGrade(gradeData);
    }

    if (result.success) {
      setShowGradeModal(false);
      setEditingGrade(null);
      fetchCourseGrades(id);
    }
  };

  const handlePublishGrades = async (gradeIds) => {
    toast.success('Grades published successfully');
  };

  const handleExportGrades = () => {
    toast.success('Grades export started');
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch {
      return 'Invalid Date';
    }
  };

  const getStatusConfig = (status) => {
    const configs = {
      active: {
        color: 'bg-green-100 text-green-800',
        icon: BadgeCheck,
        label: 'Active',
        badgeColor: 'bg-green-500',
        borderColor: 'border-green-200'
      },
      inactive: {
        color: 'bg-gray-100 text-gray-800',
        icon: XCircle,
        label: 'Inactive',
        badgeColor: 'bg-gray-500',
        borderColor: 'border-gray-200'
      },
      completed: {
        color: 'bg-blue-100 text-blue-800',
        icon: Award,
        label: 'Completed',
        badgeColor: 'bg-blue-500',
        borderColor: 'border-blue-200'
      },
      cancelled: {
        color: 'bg-red-100 text-red-800',
        icon: XCircle,
        label: 'Cancelled',
        badgeColor: 'bg-red-500',
        borderColor: 'border-red-200'
      },
    };
    return configs[status] || configs.inactive;
  };

  // UPDATED: Added CNA to course type config
  const getCourseTypeConfig = (courseType) => {
    const configs = {
      driving: {
        color: 'bg-red-100 text-red-800',
        icon: Car,
        label: 'Driving Classes',
        bgColor: 'bg-red-50',
        iconColor: 'text-red-600',
        borderColor: 'border-red-200'
      },
      plumbing: {
        color: 'bg-blue-100 text-blue-800',
        icon: Droplets,
        label: 'Plumbing',
        bgColor: 'bg-blue-50',
        iconColor: 'text-blue-600',
        borderColor: 'border-blue-200'
      },
      electrical: {
        color: 'bg-yellow-100 text-yellow-800',
        icon: Zap,
        label: 'Electrical Installation',
        bgColor: 'bg-yellow-50',
        iconColor: 'text-yellow-600',
        borderColor: 'border-yellow-200'
      },
      computer: {
        color: 'bg-purple-100 text-purple-800',
        icon: Cpu,
        label: 'Computer Packages',
        bgColor: 'bg-purple-50',
        iconColor: 'text-purple-600',
        borderColor: 'border-purple-200'
      },
      cna: { // ADDED for nursing
        color: 'bg-pink-100 text-pink-800',
        icon: HeartPulse,
        label: 'Certified Nursing Assistant',
        bgColor: 'bg-pink-50',
        iconColor: 'text-pink-600',
        borderColor: 'border-pink-200'
      }
    };
    return configs[courseType] || { 
      color: 'bg-gray-100 text-gray-800', 
      icon: BookOpen, 
      label: courseType,
      bgColor: 'bg-gray-50',
      iconColor: 'text-gray-600',
      borderColor: 'border-gray-200'
    };
  };

  // UPDATED: Added CNA certifications
  const getCertificationConfig = (certification) => {
    const configs = {
      'NTSA License': { 
        color: 'bg-blue-100 text-blue-800', 
        icon: Shield,
        bgColor: 'bg-blue-50'
      },
      'Government Trade Test': { 
        color: 'bg-green-100 text-green-800', 
        icon: Award,
        bgColor: 'bg-green-50'
      },
      'Institutional Certificate': { 
        color: 'bg-purple-100 text-purple-800', 
        icon: FileText,
        bgColor: 'bg-purple-50'
      },
      'Other': { 
        color: 'bg-gray-100 text-gray-800', 
        icon: Award,
        bgColor: 'bg-gray-50'
      },
      'CNA Certification': { // ADDED
        color: 'bg-pink-100 text-pink-800',
        icon: Award,
        bgColor: 'bg-pink-50'
      },
      'NCLEX Preparation': { // ADDED
        color: 'bg-indigo-100 text-indigo-800',
        icon: Award,
        bgColor: 'bg-indigo-50'
      },
      'State Board Approved': { // ADDED
        color: 'bg-teal-100 text-teal-800',
        icon: Shield,
        bgColor: 'bg-teal-50'
      }
    };
    return configs[certification] || configs['Other'];
  };

  const getEnrollmentStatus = () => {
    const enrolledCount = courseEnrollments?.length || 0;
    const maxStudents = currentCourse?.maxStudents || 1;
    const percentage = maxStudents > 0 ? (enrolledCount / maxStudents) * 100 : 0;

    if (enrolledCount >= maxStudents) {
      return { 
        color: 'bg-red-100 text-red-800', 
        text: 'Course Full',
        progressColor: 'bg-red-500',
        icon: XCircle,
        description: 'No spots available'
      };
    } else if (enrolledCount === 0) {
      return { 
        color: 'bg-gray-100 text-gray-800', 
        text: 'No Enrollments',
        progressColor: 'bg-gray-400',
        icon: Users,
        description: 'Course is empty'
      };
    } else if (percentage >= 80) {
      return { 
        color: 'bg-orange-100 text-orange-800', 
        text: 'Almost Full',
        progressColor: 'bg-orange-500',
        icon: AlertCircle,
        description: `${maxStudents - enrolledCount} spots left`
      };
    } else {
      return {
        color: 'bg-green-100 text-green-800',
        text: 'Open for Enrollment',
        progressColor: 'bg-green-500',
        icon: CheckCircle,
        description: `${maxStudents - enrolledCount} spots available`
      };
    }
  };

  // Calculate statistics
  const enrolledCount = courseEnrollments?.length || 0;
  const maxStudents = currentCourse?.maxStudents || 1;
  const availableSpots = Math.max(0, maxStudents - enrolledCount);
  const enrollmentPercentage = maxStudents > 0 ? Math.min(100, Math.round((enrolledCount / maxStudents) * 100)) : 0;

  const statusConfig = getStatusConfig(currentCourse?.status);
  const courseTypeConfig = getCourseTypeConfig(currentCourse?.courseType);
  const certificationConfig = getCertificationConfig(currentCourse?.certification);
  const enrollmentStatus = getEnrollmentStatus();
  
  const StatusIcon = statusConfig.icon;
  const CourseTypeIcon = courseTypeConfig.icon;
  const CertificationIcon = certificationConfig.icon;
  const EnrollmentStatusIcon = enrollmentStatus.icon;

  // Get payment summary
  const collectionRate = coursePaymentSummary?.financialSummary?.collectionPercentage || 0;
  const totalCollected = coursePaymentSummary?.financialSummary?.totalCollected || 0;
  const expectedRevenue = coursePaymentSummary?.financialSummary?.expectedRevenue || 0;

  if (courseLoading && !currentCourse && !refreshing) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-96">
          <div className="text-center">
            <Loader className="w-12 h-12 animate-spin text-purple-600 mx-auto" />
            <p className="mt-4 text-gray-600">Loading course details...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (!currentCourse && !courseLoading) {
    return (
      <Layout>
        <div className="text-center py-12">
          <div className="bg-red-50 rounded-full w-20 h-20 flex items-center justify-center mx-auto">
            <BookOpen className="h-10 w-10 text-red-500" />
          </div>
          <h3 className="mt-4 text-lg font-medium text-gray-900">
            Course not found
          </h3>
          <p className="mt-2 text-sm text-gray-500">
            The course you're looking for doesn't exist or has been removed.
          </p>
          <button
            onClick={handleBack}
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
                title="Back to Courses"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <div className="flex items-center space-x-3">
                  <h1 className="text-3xl font-bold text-gray-900">
                    {currentCourse?.courseCode}
                  </h1>
                  <span
                    className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${statusConfig.color}`}
                  >
                    <StatusIcon className="w-4 h-4 mr-1" />
                    {statusConfig.label}
                  </span>
                </div>
                <p className="mt-2 text-gray-600">
                  {currentCourse?.name}
                </p>
              </div>
            </div>

            <div className="mt-4 lg:mt-0 flex space-x-3">
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 transition-colors"
              >
                <Loader className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                Refresh
              </button>
              
              {['admin', 'instructor', 'receptionist'].includes(user?.role) && (
                <button
                  onClick={handleManageEnrollments}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                >
                  <Users className="w-4 h-4 mr-2" />
                  Manage Enrollments
                </button>
              )}

              {['admin', 'receptionist'].includes(user?.role) && (
                <button
                  onClick={handleViewCourseFees}
                  className="inline-flex items-center px-4 py-2 border border-green-300 rounded-lg text-sm font-medium text-green-700 bg-green-50 hover:bg-green-100 transition-colors"
                >
                  <DollarSign className="w-4 h-4 mr-2" />
                  View Fees
                </button>
              )}
              
              {['admin', 'instructor'].includes(user?.role) && (
                <button
                  onClick={handleEdit}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg text-sm font-medium text-white bg-gradient-to-r from-purple-600 to-indigo-700 hover:from-purple-700 hover:to-indigo-800 transition-all shadow-sm hover:shadow-md"
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Edit Course
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="mb-6 border-b border-gray-200">
          <nav className="flex -mb-px space-x-8">
            <button
              onClick={() => setActiveTab('overview')}
              className={`py-4 px-1 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'overview'
                  ? 'border-purple-600 text-purple-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('grades')}
              className={`py-4 px-1 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'grades'
                  ? 'border-purple-600 text-purple-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <GradeIcon className="w-4 h-4 inline mr-2" />
              Grades
            </button>
            <button
              onClick={() => setActiveTab('statistics')}
              className={`py-4 px-1 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'statistics'
                  ? 'border-purple-600 text-purple-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <BarChart3 className="w-4 h-4 inline mr-2" />
              Statistics
            </button>
            <button
              onClick={() => setActiveTab('fees')}
              className={`py-4 px-1 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'fees'
                  ? 'border-green-600 text-green-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <DollarSign className="w-4 h-4 inline mr-2" />
              Fees
            </button>
          </nav>
        </div>

        {/* Tab Content - Only showing the Overview tab changes for CNA */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column - Course Info (2/3 width) */}
            <div className="lg:col-span-2 space-y-6">
              {/* Course Description Card */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                  <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                    <BookOpen className="w-5 h-5 mr-2 text-purple-600" />
                    Course Description
                  </h2>
                </div>
                <div className="p-6">
                  <p className="text-gray-700 leading-relaxed">
                    {currentCourse?.description || "No description provided for this course."}
                  </p>
                  
                  {currentCourse?.requirements && (
                    <div className="mt-6">
                      <h3 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                        <FileText className="w-4 h-4 mr-1 text-gray-500" />
                        Requirements
                      </h3>
                      <p className="text-gray-600 bg-gray-50 p-4 rounded-lg">
                        {currentCourse.requirements}
                      </p>
                    </div>
                  )}

                  {/* NEW: Course Breakdown Display */}
                  {currentCourse?.courseBreakdown && (
                    <div className="mt-6">
                      <h3 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                        <BookOpen className="w-4 h-4 mr-1 text-gray-500" />
                        Course Breakdown
                      </h3>
                      <p className="text-gray-600 bg-gray-50 p-4 rounded-lg whitespace-pre-line">
                        {currentCourse.courseBreakdown}
                      </p>
                    </div>
                  )}

                  {/* NEW: Additional Notes */}
                  {currentCourse?.notes && (
                    <div className="mt-6">
                      <h3 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                        <FileText className="w-4 h-4 mr-1 text-gray-500" />
                        Additional Notes
                      </h3>
                      <p className="text-gray-600 bg-gray-50 p-4 rounded-lg">
                        {currentCourse.notes}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Instructor Card */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                  <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                    <User className="w-5 h-5 mr-2 text-purple-600" />
                    Instructor Information
                  </h2>
                </div>
                <div className="p-6">
                  {currentCourse?.instructor ? (
                    <div className="flex items-start space-x-4">
                      <div className="h-16 w-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-white font-bold text-xl">
                          {currentCourse.instructor.name?.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-medium text-gray-900">
                          {currentCourse.instructor.name}
                        </h3>
                        <div className="mt-2 space-y-2">
                          <p className="text-sm text-gray-600 flex items-center">
                            <Mail className="w-4 h-4 mr-2 text-gray-400" />
                            {currentCourse.instructor.email}
                          </p>
                          <p className="text-sm text-gray-600 flex items-center">
                            <Shield className="w-4 h-4 mr-2 text-gray-400" />
                            Role: <span className="ml-1 capitalize">{currentCourse.instructor.role}</span>
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-6">
                      <User className="mx-auto h-12 w-12 text-gray-400" />
                      <p className="mt-2 text-gray-500">No instructor assigned</p>
                      {['admin', 'instructor'].includes(user?.role) && (
                        <button
                          onClick={handleEdit}
                          className="mt-4 text-sm text-purple-600 hover:text-purple-700"
                        >
                          Assign Instructor
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Schedule Card */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                  <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                    <Calendar className="w-5 h-5 mr-2 text-purple-600" />
                    Class Schedule
                  </h2>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-blue-50 rounded-lg p-4">
                      <div className="flex items-center">
                        <Calendar className="w-5 h-5 text-blue-600 mr-2" />
                        <span className="text-sm font-medium text-gray-700">Days</span>
                      </div>
                      <p className="mt-2 text-gray-900">
                        {currentCourse?.schedule?.days?.length > 0 
                          ? currentCourse.schedule.days.join(', ')
                          : 'Not scheduled'}
                      </p>
                    </div>
                    <div className="bg-green-50 rounded-lg p-4">
                      <div className="flex items-center">
                        <Clock className="w-5 h-5 text-green-600 mr-2" />
                        <span className="text-sm font-medium text-gray-700">Time</span>
                      </div>
                      <p className="mt-2 text-gray-900">
                        {currentCourse?.schedule?.time || 'Not scheduled'}
                      </p>
                    </div>
                    <div className="bg-purple-50 rounded-lg p-4">
                      <div className="flex items-center">
                        <MapPin className="w-5 h-5 text-purple-600 mr-2" />
                        <span className="text-sm font-medium text-gray-700">Room</span>
                      </div>
                      <p className="mt-2 text-gray-900">
                        {currentCourse?.schedule?.room || 'Not assigned'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - Sidebar (1/3 width) */}
            <div className="space-y-6">
              {/* Course Type Card - UPDATED with CNA */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                    <Building className="w-5 h-5 mr-2 text-purple-600" />
                    Course Type
                  </h3>
                </div>
                <div className="p-6">
                  <div className={`p-4 rounded-lg ${courseTypeConfig.bgColor}`}>
                    <div className="flex items-center space-x-3">
                      <CourseTypeIcon className={`w-8 h-8 ${courseTypeConfig.iconColor}`} />
                      <div>
                        <p className={`text-lg font-bold ${courseTypeConfig.iconColor}`}>
                          {courseTypeConfig.label}
                        </p>
                        <p className="text-sm text-gray-600 mt-1">
                          {currentCourse?.courseType === 'cna' ? 'Healthcare Program' : 'Technical Program'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Course Price Card */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Course Fee</p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">
                      {formatCurrency(currentCourse?.price || 0)}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">per student</p>
                  </div>
                  <div className="p-3 bg-green-100 rounded-lg">
                    <DollarSign className="w-6 h-6 text-green-600" />
                  </div>
                </div>
              </div>

              {/* Workshop/Skills Lab Info - UPDATED with both flags */}
              {(currentCourse?.workshopRequired || currentCourse?.skillsLabRequired) && (
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                  <h4 className="text-sm font-medium text-blue-800 mb-2 flex items-center">
                    <Wrench className="w-4 h-4 mr-2" />
                    Facility Requirements
                  </h4>
                  <div className="space-y-2">
                    {currentCourse?.workshopRequired && (
                      <div className="flex items-center text-sm text-blue-700">
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Workshop Required
                      </div>
                    )}
                    {currentCourse?.skillsLabRequired && (
                      <div className="flex items-center text-sm text-blue-700">
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Skills Lab Required
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Stats Cards */}
              <div className="grid grid-cols-1 gap-4">
                {/* Enrollment Stats */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Enrolled Students</p>
                      <p className="text-3xl font-bold text-gray-900 mt-2">{enrolledCount}</p>
                      <p className="text-xs text-gray-500 mt-1">of {maxStudents} capacity</p>
                    </div>
                    <div className={`p-3 rounded-lg ${enrollmentStatus.color}`}>
                      <EnrollmentStatusIcon className="w-6 h-6" />
                    </div>
                  </div>
                  <div className="mt-4">
                    <div className="flex justify-between text-xs text-gray-600 mb-1">
                      <span>Capacity</span>
                      <span>{enrollmentPercentage}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all duration-500 ${enrollmentStatus.progressColor}`}
                        style={{ width: `${enrollmentPercentage}%` }}
                      ></div>
                    </div>
                  </div>
                </div>

                {/* Available Spots */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Available Spots</p>
                      <p className="text-3xl font-bold text-gray-900 mt-2">{availableSpots}</p>
                      <p className="text-xs text-gray-500 mt-1">spots remaining</p>
                    </div>
                    <div className="p-3 bg-blue-100 rounded-lg">
                      <Users className="w-6 h-6 text-blue-600" />
                    </div>
                  </div>
                  <div className="mt-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${enrollmentStatus.color}`}>
                      {enrollmentStatus.text}
                    </span>
                  </div>
                </div>

                {/* Duration */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Duration</p>
                      <p className="text-3xl font-bold text-gray-900 mt-2">{currentCourse?.duration}</p>
                      <p className="text-xs text-gray-500 mt-1">course length</p>
                    </div>
                    <div className="p-3 bg-purple-100 rounded-lg">
                      <Calendar className="w-6 h-6 text-purple-600" />
                    </div>
                  </div>
                  <div className="mt-4">
                    <span className="text-sm text-gray-600">
                      Intake: {currentCourse?.intakeMonth} {currentCourse?.intakeYear}
                    </span>
                  </div>
                </div>

                {/* Certification */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Certification</p>
                      <p className="text-lg font-bold text-gray-900 mt-2 truncate max-w-[150px]" title={currentCourse?.certification}>
                        {currentCourse?.certification}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">Batch: {currentCourse?.batchNumber}</p>
                    </div>
                    <div className={`p-3 rounded-lg ${certificationConfig.bgColor || 'bg-gray-100'}`}>
                      <CertificationIcon className={`w-6 h-6 ${certificationConfig.color.split(' ')[1] || 'text-gray-600'}`} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Actions Card */}
              {['admin', 'instructor', 'receptionist'].includes(user?.role) && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                    <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                      <Users className="w-5 h-5 mr-2 text-purple-600" />
                      Quick Actions
                    </h3>
                  </div>
                  <div className="p-6 space-y-3">
                    <button
                      onClick={handleManageEnrollments}
                      className="w-full flex items-center justify-center px-4 py-3 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                    >
                      <UserPlus className="w-4 h-4 mr-2" />
                      Manage Enrollments
                    </button>

                    {['admin', 'receptionist'].includes(user?.role) && (
                      <button
                        onClick={handleViewCourseFees}
                        className="w-full flex items-center justify-center px-4 py-3 border border-green-300 rounded-lg text-sm font-medium text-green-700 bg-green-50 hover:bg-green-100 transition-colors"
                      >
                        <DollarSign className="w-4 h-4 mr-2" />
                        View Course Fees
                      </button>
                    )}

                    {['admin', 'instructor'].includes(user?.role) && (
                      <>
                        <button
                          onClick={handleAddGrade}
                          className="w-full flex items-center justify-center px-4 py-3 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                        >
                          <GradeIcon className="w-4 h-4 mr-2" />
                          Add Grade
                        </button>
                        
                        <button
                          onClick={() => setActiveTab('grades')}
                          className="w-full flex items-center justify-center px-4 py-3 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                        >
                          <BarChart3 className="w-4 h-4 mr-2" />
                          View All Grades
                        </button>
                      </>
                    )}

                    <button
                      onClick={handleEdit}
                      className="w-full flex items-center justify-center px-4 py-3 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      Edit Course Details
                    </button>

                    <Link
                      to="/courses"
                      className="w-full flex items-center justify-center px-4 py-3 border border-transparent rounded-lg text-sm font-medium text-white bg-gradient-to-r from-purple-600 to-indigo-700 hover:from-purple-700 hover:to-indigo-800 transition-all"
                    >
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Back to Courses
                    </Link>
                  </div>
                </div>
              )}

              {/* Recent Enrollments Card */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                      <Users className="w-5 h-5 mr-2 text-purple-600" />
                      Recent Enrollments
                    </h3>
                    <button
                      onClick={handleManageEnrollments}
                      className="text-sm text-purple-600 hover:text-purple-700 font-medium flex items-center"
                    >
                      View all
                      <ChevronRight className="w-4 h-4 ml-1" />
                    </button>
                  </div>
                </div>
                <div className="p-6">
                  {enrollmentsLoading ? (
                    <div className="flex justify-center py-4">
                      <Loader className="w-6 h-6 animate-spin text-purple-600" />
                    </div>
                  ) : courseEnrollments?.length > 0 ? (
                    <div className="space-y-4">
                      {courseEnrollments.slice(0, 3).map((enrollment) => (
                        <div key={enrollment._id} className="flex items-center space-x-3">
                          <div className="h-8 w-8 bg-gradient-to-r from-blue-600 to-indigo-700 rounded-full flex items-center justify-center flex-shrink-0">
                            <span className="text-white font-medium text-xs">
                              {enrollment.student?.user?.name?.charAt(0).toUpperCase() || '?'}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {enrollment.student?.user?.name || 'Unknown Student'}
                            </p>
                            <p className="text-xs text-gray-500">
                              Enrolled {formatDate(enrollment.enrollmentDate)}
                            </p>
                          </div>
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                            enrollment.status === 'enrolled' ? 'bg-green-100 text-green-800' :
                            enrollment.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {enrollment.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-6">
                      <Users className="mx-auto h-8 w-8 text-gray-400" />
                      <p className="mt-2 text-sm text-gray-500">No students enrolled yet</p>
                      {['admin', 'instructor', 'receptionist'].includes(user?.role) && (
                        <button
                          onClick={handleManageEnrollments}
                          className="mt-3 text-sm text-purple-600 hover:text-purple-700 font-medium"
                        >
                          Add Students
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* System Info Card */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                    <Clock className="w-5 h-5 mr-2 text-purple-600" />
                    System Information
                  </h3>
                </div>
                <div className="p-6">
                  <dl className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <dt className="text-gray-500">Course ID</dt>
                      <dd className="font-mono text-gray-900" title={currentCourse?._id}>
                        {currentCourse?._id?.substring(0, 8)}...
                      </dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-gray-500">Created</dt>
                      <dd className="text-gray-900">{formatDate(currentCourse?.createdAt)}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-gray-500">Last Updated</dt>
                      <dd className="text-gray-900">{formatDate(currentCourse?.updatedAt)}</dd>
                    </div>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Grades Tab - Keep existing */}
        {activeTab === 'grades' && (
          <div className="space-y-6">
            {/* Grades Header */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                    <GradeIcon className="w-5 h-5 mr-2 text-purple-600" />
                    Course Grades
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Manage and track student grades for this course
                  </p>
                </div>
                <div className="mt-4 sm:mt-0 flex space-x-3">
                  <button
                    onClick={handleAddGrade}
                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg text-sm font-medium text-white bg-gradient-to-r from-purple-600 to-indigo-700 hover:from-purple-700 hover:to-indigo-800 transition-all"
                  >
                    <GradeIcon className="w-4 h-4 mr-2" />
                    Add Grade
                  </button>
                </div>
              </div>
            </div>

            <GradeTable
              grades={courseGrades}
              loading={gradesLoading}
              onEdit={handleEditGrade}
              onDelete={handleDeleteGrade}
              onPublish={handlePublishGrades}
              onExport={handleExportGrades}
              currentUser={user}
              courseId={id}
              showStudentInfo={true}
              showActions={true}
              showFilters={true}
            />
          </div>
        )}

        {activeTab === 'statistics' && (
          <div className="space-y-6">
            <GradeStatistics courseId={id} view="course" />
          </div>
        )}

        {activeTab === 'fees' && (
          <div className="space-y-6">
            {/* Fee Overview Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                    <DollarSign className="w-5 h-5 mr-2 text-green-600" />
                    Course Fee Overview
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Fee collection status for this course
                  </p>
                </div>
                <div className="mt-4 sm:mt-0">
                  <button
                    onClick={handleViewCourseFees}
                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg text-sm font-medium text-white bg-gradient-to-r from-green-600 to-emerald-700 hover:from-green-700 hover:to-emerald-800 transition-all"
                  >
                    <DollarSign className="w-4 h-4 mr-2" />
                    Full Fee Details
                  </button>
                </div>
              </div>
            </div>

            {/* Fee Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <p className="text-sm text-gray-600 mb-2">Course Price</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(currentCourse?.price || 0)}
                </p>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <p className="text-sm text-gray-600 mb-2">Expected Revenue</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(expectedRevenue)}
                </p>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <p className="text-sm text-gray-600 mb-2">Total Collected</p>
                <p className="text-2xl font-bold text-green-600">
                  {formatCurrency(totalCollected)}
                </p>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <p className="text-sm text-gray-600 mb-2">Collection Rate</p>
                <p className="text-2xl font-bold text-purple-600">
                  {collectionRate}%
                </p>
              </div>
            </div>

            {/* Collection Progress Bar */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">
                  Collection Progress
                </span>
                <span className="text-sm font-medium text-gray-900">
                  {formatCurrency(totalCollected)} / {formatCurrency(expectedRevenue)} ({collectionRate}%)
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className={`h-3 rounded-full transition-all duration-500 ${
                    collectionRate >= 100 ? 'bg-green-500' :
                    collectionRate >= 75 ? 'bg-blue-500' :
                    collectionRate >= 50 ? 'bg-yellow-500' :
                    collectionRate >= 25 ? 'bg-orange-500' :
                    'bg-red-500'
                  }`}
                  style={{ width: `${Math.min(100, collectionRate)}%` }}
                />
              </div>
            </div>

            {/* Quick Info */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <div className="flex items-start">
                <DollarSign className="w-5 h-5 text-blue-600 mt-0.5 mr-3" />
                <div>
                  <h4 className="text-sm font-medium text-blue-800">Payment Information</h4>
                  <p className="text-sm text-blue-700 mt-1">
                    View detailed fee breakdown and payment history for each student in this course.
                  </p>
                  <button
                    onClick={handleViewCourseFees}
                    className="mt-2 text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center"
                  >
                    Go to Course Fees
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Grade Entry Modal */}
      <GradeEntryModal
        isOpen={showGradeModal}
        onClose={() => {
          setShowGradeModal(false);
          setEditingGrade(null);
        }}
        onSave={handleSaveGrade}
        grade={editingGrade}
        courseId={id}
        students={courseEnrollments.map(e => e.student)}
        loading={gradesLoading}
      />
    </Layout>
  );
};

export default CourseDetails;