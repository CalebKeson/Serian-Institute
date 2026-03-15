// src/pages/Students/StudentProfile.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router';
import { 
  ArrowLeft,
  User,
  Mail,
  Phone,
  Calendar,
  Home,
  MapPin,
  AlertCircle,
  Edit,
  BadgeCheck,
  XCircle,
  Clock,
  Shield,
  BookOpen,
  GraduationCap,
  BarChart3,
  TrendingUp,
  PieChart,
  Award as GradeIcon,
  DollarSign // ADD THIS IMPORT
} from 'lucide-react';
import Layout from '../../components/Layout/Layout';
import { useStudentStore } from '../../stores/studentStore';
import { useAuthStore } from '../../stores/authStore';
import { useEnrollmentStore } from '../../stores/enrollmentStore';
import { useGradeStore } from '../../stores/gradeStore';
import EnrollmentTable from '../../components/Enrollment/EnrollmentTable';
import StudentAttendanceSummary from '../../components/Attendance/StudentAttendanceSummary';
import GradeTable from '../../components/Grades/GradeTable';
import GradeStatistics from '../../components/Grades/GradeStatistics';
import { formatCurrency } from '../../utils/feeFormatter'; // ADD THIS IMPORT
import toast from 'react-hot-toast';

const StudentProfile = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user } = useAuthStore();
  const { 
    currentStudent, 
    fetchStudent, 
    loading: studentLoading,
    clearCurrentStudent 
  } = useStudentStore();

  const {
    studentEnrollments,
    loading: enrollmentsLoading,
    fetchStudentEnrollments,
    clearEnrollments
  } = useEnrollmentStore();

  const {
    studentGrades,
    loading: gradesLoading,
    fetchStudentGrades,
    clearGrades
  } = useGradeStore();

  const [activeTab, setActiveTab] = useState('overview');
  const [refreshKey, setRefreshKey] = useState(0);
  const [totalFees, setTotalFees] = useState(0); // ADD THIS STATE
  const [outstandingBalance, setOutstandingBalance] = useState(0); // ADD THIS STATE

  // Fetch student and enrollment data
  useEffect(() => {
    if (id) {
      loadStudentData();
    }

    return () => {
      clearCurrentStudent();
      clearEnrollments();
      clearGrades();
    };
  }, [id]);

  // Calculate fee totals from enrollments
  useEffect(() => {
    if (studentEnrollments.length > 0) {
      // This would ideally come from the fee store
      // For now, we'll use placeholder or fetch from payment store
      const total = studentEnrollments.reduce((sum, e) => sum + (e.course?.price || 0), 0);
      setTotalFees(total);
      setOutstandingBalance(total * 0.3); // Placeholder - replace with actual data
    }
  }, [studentEnrollments]);

  // Fetch grades when switching to grades tab
  useEffect(() => {
    if (activeTab === 'grades' && id) {
      fetchStudentGrades(id);
    }
  }, [activeTab, id]);

  const loadStudentData = async () => {
    await Promise.all([
      fetchStudent(id),
      fetchStudentEnrollments(id)
    ]);
  };

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
    loadStudentData();
    if (activeTab === 'grades') {
      fetchStudentGrades(id);
    }
    toast.success('Data refreshed');
  };

  const handleBack = () => {
    navigate('/students');
  };

  const handleEdit = () => {
    navigate(`/students/edit/${id}`);
  };

  const handleViewFees = () => { // ADD THIS FUNCTION
    navigate(`/fees/student/${id}`);
  };

  const handleViewCourse = (courseId) => {
    navigate(`/courses/${courseId}`);
  };

  const handleViewGradeDetails = (grade) => {
    toast.info(`Viewing details for ${grade.assessmentName}`);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatDateTime = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusConfig = (status) => {
    const configs = {
      active: { color: 'bg-green-100 text-green-800', icon: BadgeCheck, label: 'Active' },
      inactive: { color: 'bg-gray-100 text-gray-800', icon: XCircle, label: 'Inactive' },
      suspended: { color: 'bg-red-100 text-red-800', icon: XCircle, label: 'Suspended' },
      graduated: { color: 'bg-purple-100 text-purple-800', icon: BadgeCheck, label: 'Graduated' }
    };
    return configs[status] || configs.inactive;
  };

  const getGenderLabel = (gender) => {
    const labels = {
      male: 'Male',
      female: 'Female',
      other: 'Other'
    };
    return labels[gender] || 'Not specified';
  };

  const getEnrollmentStats = () => {
    const enrolled = studentEnrollments.filter(e => e.status === 'enrolled').length;
    const completed = studentEnrollments.filter(e => e.status === 'completed').length;
    const dropped = studentEnrollments.filter(e => e.status === 'dropped').length;
    
    return { enrolled, completed, dropped, total: studentEnrollments.length };
  };

  const calculateGPA = () => {
    if (!studentGrades || studentGrades.length === 0) return '0.00';
    
    let totalPoints = 0;
    let totalCredits = 0;
    
    studentGrades.forEach(grade => {
      if (grade.letterGrade && grade.weight) {
        const points = {
          'A+': 4.0, 'A': 4.0, 'A-': 3.7,
          'B+': 3.3, 'B': 3.0, 'B-': 2.7,
          'C+': 2.3, 'C': 2.0, 'C-': 1.7,
          'D+': 1.3, 'D': 1.0, 'D-': 0.7,
          'F': 0.0
        }[grade.letterGrade] || 0;
        
        totalPoints += points * grade.weight;
        totalCredits += grade.weight;
      }
    });
    
    return totalCredits > 0 ? (totalPoints / totalCredits).toFixed(2) : '0.00';
  };

  if (studentLoading && !currentStudent) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </Layout>
    );
  }

  if (!currentStudent && !studentLoading) {
    return (
      <Layout>
        <div className="text-center py-12">
          <User className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Student not found</h3>
          <p className="mt-1 text-sm text-gray-500">The student you're looking for doesn't exist.</p>
          <button
            onClick={handleBack}
            className="mt-4 inline-flex items-center px-4 py-2 border border-transparent rounded-lg text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
          >
            Back to Students
          </button>
        </div>
      </Layout>
    );
  }

  const statusConfig = getStatusConfig(currentStudent.status);
  const stats = getEnrollmentStats();
  const gpa = calculateGPA();

  return (
    <Layout>
      <div className="max-w-7xl mx-auto">
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
                  <User className="w-8 h-8 mr-3 text-blue-600" />
                  Student Profile
                </h1>
                <p className="mt-2 text-gray-600">
                  Detailed information about {currentStudent.user?.name}
                </p>
              </div>
            </div>
            
            <div className="mt-4 lg:mt-0 flex space-x-3">
              <button
                onClick={handleRefresh}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
              >
                <Clock className="w-4 h-4 mr-2" />
                Refresh
              </button>
              
              {['admin', 'receptionist'].includes(user?.role) && (
                <button
                  onClick={handleViewFees}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-green-700 bg-green-50 hover:bg-green-100 transition-colors"
                >
                  <DollarSign className="w-4 h-4 mr-2" />
                  View Fees
                </button>
              )}
              
              {user?.role === 'admin' && (
                <button
                  onClick={handleEdit}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 transition-all shadow-sm hover:shadow-md"
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Edit Profile
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Student Quick Info Bar - UPDATED with Fee Info */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex flex-wrap items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="h-12 w-12 bg-gradient-to-r from-blue-600 to-indigo-700 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-lg">
                  {currentStudent.user?.name?.charAt(0).toUpperCase()}
                </span>
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  {currentStudent.user?.name}
                </h2>
                <div className="flex items-center space-x-3 mt-1">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusConfig.color}`}>
                    <statusConfig.icon className="w-3 h-3 mr-1" />
                    {statusConfig.label}
                  </span>
                  <span className="text-sm text-blue-600 font-medium">
                    {currentStudent.studentId}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-6 mt-2 sm:mt-0">
              <div className="text-right">
                <p className="text-xs text-gray-500">GPA</p>
                <p className="text-xl font-bold text-purple-600">{gpa}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-500">Courses</p>
                <p className="text-xl font-bold text-blue-600">{stats.enrolled}</p>
              </div>
              {/* ADDED: Fee Summary */}
              <div className="text-right">
                <p className="text-xs text-gray-500">Outstanding</p>
                <p className={`text-xl font-bold ${outstandingBalance > 0 ? 'text-orange-600' : 'text-green-600'}`}>
                  {formatCurrency(outstandingBalance)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs Navigation */}
        <div className="mb-6 border-b border-gray-200">
          <nav className="flex -mb-px space-x-8">
            <button
              onClick={() => setActiveTab('overview')}
              className={`py-4 px-1 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'overview'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <User className="w-4 h-4 inline mr-2" />
              Overview
            </button>
            <button
              onClick={() => setActiveTab('enrollments')}
              className={`py-4 px-1 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'enrollments'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <BookOpen className="w-4 h-4 inline mr-2" />
              Enrollments ({stats.total})
            </button>
            <button
              onClick={() => setActiveTab('attendance')}
              className={`py-4 px-1 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'attendance'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <BarChart3 className="w-4 h-4 inline mr-2" />
              Attendance Summary
            </button>
            <button
              onClick={() => setActiveTab('grades')}
              className={`py-4 px-1 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'grades'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <GradeIcon className="w-4 h-4 inline mr-2" />
              Grades
            </button>
            <button
              onClick={() => setActiveTab('analytics')}
              className={`py-4 px-1 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'analytics'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <TrendingUp className="w-4 h-4 inline mr-2" />
              Analytics
            </button>
          </nav>
        </div>

        {/* Tab Content - Keep existing tab content but update Quick Actions Card */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Main Content - Keep existing */}
            <div className="lg:col-span-3 space-y-6">
              {/* ... existing overview content ... */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <User className="w-5 h-5 mr-2 text-blue-600" />
                  Student Information
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Profile Header */}
                  <div className="md:col-span-2 flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                    <div className="h-16 w-16 bg-gradient-to-r from-blue-600 to-indigo-700 rounded-full flex items-center justify-center">
                      <span className="text-white font-bold text-xl">
                        {currentStudent.user?.name?.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">
                        {currentStudent.user?.name}
                      </h3>
                      <div className="flex items-center space-x-4 mt-1">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${statusConfig.color}`}>
                          <statusConfig.icon className="w-4 h-4 mr-1" />
                          {statusConfig.label}
                        </span>
                        <span className="text-sm text-blue-600 font-medium bg-blue-50 px-3 py-1 rounded-full">
                          {currentStudent.studentId}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Basic Information */}
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">
                      Email Address
                    </label>
                    <div className="flex items-center text-gray-900">
                      <Mail className="w-4 h-4 mr-2 text-blue-500" />
                      {currentStudent.user?.email}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">
                      Phone Number
                    </label>
                    <div className="flex items-center text-gray-900">
                      <Phone className="w-4 h-4 mr-2 text-blue-500" />
                      {currentStudent.phone}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">
                      Date of Birth
                    </label>
                    <div className="flex items-center text-gray-900">
                      <Calendar className="w-4 h-4 mr-2 text-blue-500" />
                      {formatDate(currentStudent.dateOfBirth)}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">
                      Gender
                    </label>
                    <div className="flex items-center text-gray-900">
                      <User className="w-4 h-4 mr-2 text-blue-500" />
                      {getGenderLabel(currentStudent.gender)}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">
                      Enrollment Date
                    </label>
                    <div className="flex items-center text-gray-900">
                      <Clock className="w-4 h-4 mr-2 text-blue-500" />
                      {formatDate(currentStudent.enrollmentDate)}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">
                      Account Created
                    </label>
                    <div className="flex items-center text-gray-900">
                      <Shield className="w-4 h-4 mr-2 text-blue-500" />
                      {formatDateTime(currentStudent.createdAt)}
                    </div>
                  </div>
                </div>
              </div>

              {/* Address Information */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Home className="w-5 h-5 mr-2 text-blue-600" />
                  Address Information
                </h3>
                
                <div className="space-y-4">
                  <div className="flex items-start">
                    <MapPin className="w-5 h-5 mr-3 text-blue-500 mt-0.5" />
                    <div>
                      <p className="font-medium text-gray-900">{currentStudent.address?.street}</p>
                      <p className="text-gray-600">
                        {currentStudent.address?.city}, {currentStudent.address?.state} {currentStudent.address?.zipCode}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Emergency Contact */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <AlertCircle className="w-5 h-5 mr-2 text-blue-600" />
                  Emergency Contact
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">
                      Contact Name
                    </label>
                    <p className="text-gray-900 font-medium">
                      {currentStudent.emergencyContact?.name}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">
                      Relationship
                    </label>
                    <p className="text-gray-900 font-medium">
                      {currentStudent.emergencyContact?.relationship}
                    </p>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-500 mb-1">
                      Contact Phone
                    </label>
                    <div className="flex items-center text-gray-900">
                      <Phone className="w-4 h-4 mr-2 text-blue-500" />
                      {currentStudent.emergencyContact?.phone}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Sidebar - UPDATED with Fee Actions */}
            <div className="space-y-6">
              {/* Quick Stats Card */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Student Summary
                </h3>
                
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500">Status</span>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusConfig.color}`}>
                      {statusConfig.label}
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500">Student Since</span>
                    <span className="text-sm font-medium text-gray-900">
                      {formatDate(currentStudent.enrollmentDate)}
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500">Enrollment Length</span>
                    <span className="text-sm font-medium text-gray-900">
                      {Math.floor((new Date() - new Date(currentStudent.enrollmentDate)) / (1000 * 60 * 60 * 24))} days
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500">Current Courses</span>
                    <span className="text-sm font-medium text-gray-900">{stats.enrolled}</span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500">Completed Courses</span>
                    <span className="text-sm font-medium text-gray-900">{stats.completed}</span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500">GPA</span>
                    <span className="text-sm font-medium text-purple-600">{gpa}</span>
                  </div>

                  {/* ADDED: Fee Summary in Sidebar */}
                  <div className="flex justify-between items-center pt-2 border-t border-gray-200">
                    <span className="text-sm text-gray-500">Total Fees</span>
                    <span className="text-sm font-medium text-gray-900">{formatCurrency(totalFees)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500">Outstanding</span>
                    <span className={`text-sm font-bold ${outstandingBalance > 0 ? 'text-orange-600' : 'text-green-600'}`}>
                      {formatCurrency(outstandingBalance)}
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500">Last Updated</span>
                    <span className="text-sm font-medium text-gray-900">
                      {formatDateTime(currentStudent.updatedAt)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Quick Actions Card - UPDATED with Fee Button */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Quick Actions
                </h3>
                
                <div className="space-y-3">
                  <button
                    onClick={() => setActiveTab('attendance')}
                    className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                  >
                    <BarChart3 className="w-4 h-4 mr-2" />
                    View Attendance
                  </button>
                  
                  <button
                    onClick={() => setActiveTab('grades')}
                    className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                  >
                    <GradeIcon className="w-4 h-4 mr-2" />
                    View Grades
                  </button>

                  {/* ADDED: View Fees Button */}
                  {['admin', 'receptionist'].includes(user?.role) && (
                    <button
                      onClick={handleViewFees}
                      className="w-full flex items-center justify-center px-4 py-2 border border-green-300 rounded-lg text-sm font-medium text-green-700 bg-green-50 hover:bg-green-100 transition-colors"
                    >
                      <DollarSign className="w-4 h-4 mr-2" />
                      View Fees
                    </button>
                  )}
                  
                  <button
                    onClick={handleEdit}
                    className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Edit Profile
                  </button>
                  
                  <Link
                    to="/students"
                    className="w-full flex items-center justify-center px-4 py-2 border border-transparent rounded-lg text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 transition-all"
                  >
                    Back to List
                  </Link>
                </div>
              </div>

              {/* System Information Card */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  System Information
                </h3>
                
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Student ID</span>
                    <span className="font-medium text-gray-900">{currentStudent.studentId}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-gray-500">Database ID</span>
                    <span className="font-medium text-gray-900 truncate ml-2" title={currentStudent._id}>
                      {currentStudent._id.substring(0, 8)}...
                    </span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-gray-500">User ID</span>
                    <span className="font-medium text-gray-900 truncate ml-2" title={currentStudent.user?._id}>
                      {currentStudent.user?._id?.substring(0, 8)}...
                    </span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-gray-500">Created</span>
                    <span className="font-medium text-gray-900">
                      {formatDate(currentStudent.createdAt)}
                    </span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-gray-500">Last Updated</span>
                    <span className="font-medium text-gray-900">
                      {formatDate(currentStudent.updatedAt)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Rest of the tabs remain the same */}
        {activeTab === 'enrollments' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Course Enrollments</h3>
              <div className="flex items-center space-x-4">
                <div className="flex space-x-2">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    <BookOpen className="w-3 h-3 mr-1" />
                    {stats.enrolled} Current
                  </span>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    <GraduationCap className="w-3 h-3 mr-1" />
                    {stats.completed} Completed
                  </span>
                </div>
              </div>
            </div>

            <EnrollmentTable
              enrollments={studentEnrollments}
              loading={enrollmentsLoading}
              currentUser={user}
              view="student"
              onViewCourse={handleViewCourse}
            />

            {studentEnrollments.length === 0 && !enrollmentsLoading && (
              <div className="text-center py-8">
                <BookOpen className="mx-auto h-12 w-12 text-gray-400" />
                <h4 className="mt-2 text-sm font-medium text-gray-900">No course enrollments</h4>
                <p className="mt-1 text-sm text-gray-500">
                  This student is not enrolled in any courses yet.
                </p>
                {user?.role === 'admin' && (
                  <Link
                    to="/courses"
                    className="mt-4 inline-flex items-center px-4 py-2 border border-transparent rounded-lg text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                  >
                    <BookOpen className="w-4 h-4 mr-2" />
                    Browse Courses
                  </Link>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === 'attendance' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <StudentAttendanceSummary 
              key={refreshKey}
              studentId={id} 
            />
          </div>
        )}

        {activeTab === 'grades' && (
          <div className="space-y-6">
            {/* Grades Overview Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                  <GradeIcon className="w-5 h-5 mr-2 text-blue-600" />
                  Student Grades
                </h3>
                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <p className="text-xs text-gray-500">Overall GPA</p>
                    <p className="text-2xl font-bold text-purple-600">{gpa}</p>
                  </div>
                </div>
              </div>

              <GradeTable
                grades={studentGrades}
                loading={gradesLoading}
                onView={handleViewGradeDetails}
                currentUser={user}
                showStudentInfo={false}
                showActions={user?.role !== 'student'}
                showFilters={true}
              />

              {studentGrades.length === 0 && !gradesLoading && (
                <div className="text-center py-12">
                  <GradeIcon className="mx-auto h-12 w-12 text-gray-400" />
                  <h4 className="mt-2 text-sm font-medium text-gray-900">No grades available</h4>
                  <p className="mt-1 text-sm text-gray-500">
                    This student hasn't received any grades yet.
                  </p>
                </div>
              )}
            </div>

            {studentGrades.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <TrendingUp className="w-5 h-5 mr-2 text-blue-600" />
                  Performance Analytics
                </h3>
                <GradeStatistics studentId={id} view="student" />
              </div>
            )}
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
              <TrendingUp className="w-5 h-5 mr-2 text-blue-600" />
              Advanced Analytics (Coming Soon)
            </h3>
            <div className="text-center py-12">
              <PieChart className="mx-auto h-12 w-12 text-gray-400" />
              <p className="mt-2 text-sm text-gray-500">
                Advanced analytics features are under development.
              </p>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default StudentProfile;