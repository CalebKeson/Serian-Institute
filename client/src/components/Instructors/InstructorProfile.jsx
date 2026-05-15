// frontend/src/pages/Instructors/InstructorProfile.jsx
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
  Briefcase,
  GraduationCap,
  Award,
  DollarSign,
  BookOpen,
  TrendingUp,
  PieChart,
  FileText,
  CreditCard,
  Banknote,
  Download,
  Upload,
  Plus,
  Trash2,
  Building
} from 'lucide-react';
import Layout from '../../components/Layout/Layout';
import { useInstructorStore } from '../../stores/instructorStore';
import { useAuthStore } from '../../stores/authStore';
import { useCourseStore } from '../../stores/courseStore';
import { formatSalary, getStatusBadgeColor, getSalaryStatusBadgeColor, getTeachingStatusBadgeColor } from '../../utils/instructorDataFormatter';
import SalaryPaymentModal from '../../components/Instructors/SalaryPaymentModal';
import AssignCourseModal from '../../components/Instructors/AssignCourseModal';
import toast from 'react-hot-toast';

const InstructorProfile = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user } = useAuthStore();
  const { 
    currentInstructor, 
    fetchInstructor, 
    loading: instructorLoading,
    instructorCourses,
    fetchInstructorCourses,
    clearCurrentInstructor 
  } = useInstructorStore();
  const { courses, fetchCourses } = useCourseStore();

  const [activeTab, setActiveTab] = useState('overview');
  const [refreshKey, setRefreshKey] = useState(0);
  const [showSalaryModal, setShowSalaryModal] = useState(false);
  const [showAssignCourseModal, setShowAssignCourseModal] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState(null);

  // Fetch instructor data
  useEffect(() => {
    if (id) {
      loadInstructorData();
    }

    return () => {
      clearCurrentInstructor();
    };
  }, [id]);

  // Fetch courses when needed
  useEffect(() => {
    if (activeTab === 'courses' && id) {
      fetchInstructorCourses(id);
      fetchCourses({ limit: 100, status: 'active' });
    }
  }, [activeTab, id]);

  const loadInstructorData = async () => {
    await fetchInstructor(id);
  };

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
    loadInstructorData();
    if (activeTab === 'courses') {
      fetchInstructorCourses(id);
    }
    toast.success('Data refreshed');
  };

  const handleBack = () => {
    navigate('/instructors');
  };

  const handleEdit = () => {
    navigate(`/instructors/edit/${id}`);
  };

  const handleViewCourse = (courseId) => {
    navigate(`/courses/${courseId}`);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusConfig = (status) => {
    return getStatusBadgeColor(status);
  };

  const getSalaryStatusConfig = (status) => {
    return getSalaryStatusBadgeColor(status);
  };

  const getTeachingStatusConfig = (status) => {
    return getTeachingStatusBadgeColor(status);
  };

  const getGenderLabel = (gender) => {
    const labels = {
      male: 'Male',
      female: 'Female',
      other: 'Other'
    };
    return labels[gender] || 'Not specified';
  };

  const calculateTotalPaid = () => {
    if (!currentInstructor?.salaryPayments) return 0;
    return currentInstructor.salaryPayments.reduce((sum, payment) => sum + payment.amount, 0);
  };

  const calculateWorkloadPercentage = () => {
    if (!currentInstructor) return 0;
    const percentage = (currentInstructor.currentWorkload / currentInstructor.maxWorkload) * 100;
    return Math.min(100, Math.round(percentage));
  };

  const getWorkloadColor = () => {
    const percentage = calculateWorkloadPercentage();
    if (percentage >= 90) return 'text-red-600';
    if (percentage >= 70) return 'text-yellow-600';
    return 'text-green-600';
  };

  if (instructorLoading && !currentInstructor) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </Layout>
    );
  }

  if (!currentInstructor && !instructorLoading) {
    return (
      <Layout>
        <div className="text-center py-12">
          <User className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Instructor not found</h3>
          <p className="mt-1 text-sm text-gray-500">The instructor you're looking for doesn't exist.</p>
          <button
            onClick={handleBack}
            className="mt-4 inline-flex items-center px-4 py-2 border border-transparent rounded-lg text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
          >
            Back to Instructors
          </button>
        </div>
      </Layout>
    );
  }

  const statusConfig = getStatusConfig(currentInstructor.status);
  const salaryStatusConfig = getSalaryStatusConfig(currentInstructor.salaryStatus);
  const teachingStatusConfig = getTeachingStatusConfig(currentInstructor.teachingStatus);
  const totalPaid = calculateTotalPaid();
  const workloadPercentage = calculateWorkloadPercentage();

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
                  Instructor Profile
                </h1>
                <p className="mt-2 text-gray-600">
                  Detailed information about {currentInstructor.user?.name}
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
              
              {user?.role === 'admin' && (
                <>
                  <button
                    onClick={() => setShowSalaryModal(true)}
                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg text-sm font-medium text-white bg-green-600 hover:bg-green-700 transition-all shadow-sm"
                  >
                    <DollarSign className="w-4 h-4 mr-2" />
                    Record Payment
                  </button>
                  
                  <button
                    onClick={handleEdit}
                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 transition-all shadow-sm"
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Edit Profile
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Instructor Quick Info Bar */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex flex-wrap items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="h-16 w-16 bg-gradient-to-r from-blue-600 to-indigo-700 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-xl">
                  {currentInstructor.user?.name?.charAt(0).toUpperCase()}
                </span>
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  {currentInstructor.user?.name}
                </h2>
                <div className="flex items-center space-x-3 mt-1">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusConfig.color}`}>
                    <BadgeCheck className="w-3 h-3 mr-1" />
                    {statusConfig.label}
                  </span>
                  <span className="text-sm text-blue-600 font-medium">
                    {currentInstructor.employeeId}
                  </span>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${teachingStatusConfig.color}`}>
                    {teachingStatusConfig.label}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-6 mt-2 sm:mt-0">
              <div className="text-right">
                <p className="text-xs text-gray-500">Department</p>
                <p className="text-sm font-bold text-gray-900">{currentInstructor.department}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-500">Workload</p>
                <p className={`text-sm font-bold ${getWorkloadColor()}`}>
                  {currentInstructor.currentWorkload || 0}/{currentInstructor.maxWorkload}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-500">Salary Status</p>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${salaryStatusConfig.color}`}>
                  {salaryStatusConfig.label}
                </span>
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
              onClick={() => setActiveTab('qualifications')}
              className={`py-4 px-1 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'qualifications'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <GraduationCap className="w-4 h-4 inline mr-2" />
              Qualifications
            </button>
            <button
              onClick={() => setActiveTab('courses')}
              className={`py-4 px-1 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'courses'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <BookOpen className="w-4 h-4 inline mr-2" />
              Courses ({currentInstructor.currentWorkload || 0})
            </button>
            <button
              onClick={() => setActiveTab('salary')}
              className={`py-4 px-1 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'salary'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <DollarSign className="w-4 h-4 inline mr-2" />
              Salary & Payments
            </button>
            <button
              onClick={() => setActiveTab('documents')}
              className={`py-4 px-1 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'documents'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <FileText className="w-4 h-4 inline mr-2" />
              Documents
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-3 space-y-6">
              {/* Professional Information */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Briefcase className="w-5 h-5 mr-2 text-blue-600" />
                  Professional Information
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">Department</label>
                    <p className="text-gray-900 font-medium">{currentInstructor.department}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">Designation</label>
                    <p className="text-gray-900 font-medium">{currentInstructor.designation || 'Not specified'}</p>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-500 mb-1">Specialization</label>
                    <p className="text-gray-900">{currentInstructor.specialization}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">Hire Date</label>
                    <div className="flex items-center text-gray-900">
                      <Calendar className="w-4 h-4 mr-2 text-blue-500" />
                      {formatDate(currentInstructor.hireDate)}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">Member Since</label>
                    <div className="flex items-center text-gray-900">
                      <Calendar className="w-4 h-4 mr-2 text-blue-500" />
                      {formatDate(currentInstructor.instructorSince)}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">Employment Type</label>
                    <p className="text-gray-900 capitalize">{currentInstructor.employmentType}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">Supervisor</label>
                    <p className="text-gray-900">{currentInstructor.supervisor?.name || 'None assigned'}</p>
                  </div>
                  {currentInstructor.contractEndDate && (
                    <div>
                      <label className="block text-sm font-medium text-gray-500 mb-1">Contract End Date</label>
                      <p className="text-gray-900">{formatDate(currentInstructor.contractEndDate)}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Contact Information */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Mail className="w-5 h-5 mr-2 text-blue-600" />
                  Contact Information
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">Work Email</label>
                    <div className="flex items-center text-gray-900">
                      <Mail className="w-4 h-4 mr-2 text-blue-500" />
                      {currentInstructor.user?.email}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">Personal Email</label>
                    <div className="flex items-center text-gray-900">
                      <Mail className="w-4 h-4 mr-2 text-blue-500" />
                      {currentInstructor.personalEmail || 'Not provided'}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">Phone Number</label>
                    <div className="flex items-center text-gray-900">
                      <Phone className="w-4 h-4 mr-2 text-blue-500" />
                      {currentInstructor.phone}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">Date of Birth</label>
                    <div className="flex items-center text-gray-900">
                      <Calendar className="w-4 h-4 mr-2 text-blue-500" />
                      {formatDate(currentInstructor.dateOfBirth) || 'Not provided'}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">Gender</label>
                    <div className="flex items-center text-gray-900">
                      <User className="w-4 h-4 mr-2 text-blue-500" />
                      {getGenderLabel(currentInstructor.gender)}
                    </div>
                  </div>
                </div>
              </div>

              {/* Address Information */}
              {currentInstructor.address?.street && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <Home className="w-5 h-5 mr-2 text-blue-600" />
                    Address Information
                  </h2>
                  
                  <div className="flex items-start">
                    <MapPin className="w-5 h-5 mr-3 text-blue-500 mt-0.5" />
                    <div>
                      <p className="font-medium text-gray-900">{currentInstructor.address?.street}</p>
                      <p className="text-gray-600">
                        {currentInstructor.address?.city}, {currentInstructor.address?.state} {currentInstructor.address?.zipCode}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Emergency Contact */}
              {currentInstructor.emergencyContact?.name && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <AlertCircle className="w-5 h-5 mr-2 text-blue-600" />
                    Emergency Contact
                  </h2>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-500 mb-1">Contact Name</label>
                      <p className="text-gray-900 font-medium">{currentInstructor.emergencyContact?.name}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-500 mb-1">Relationship</label>
                      <p className="text-gray-900 font-medium">{currentInstructor.emergencyContact?.relationship}</p>
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-500 mb-1">Contact Phone</label>
                      <div className="flex items-center text-gray-900">
                        <Phone className="w-4 h-4 mr-2 text-blue-500" />
                        {currentInstructor.emergencyContact?.phone}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Quick Stats Card */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Instructor Summary
                </h3>
                
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500">Status</span>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusConfig.color}`}>
                      {statusConfig.label}
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500">Teaching Status</span>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${teachingStatusConfig.color}`}>
                      {teachingStatusConfig.label}
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500">Hire Date</span>
                    <span className="text-sm font-medium text-gray-900">
                      {formatDate(currentInstructor.hireDate)}
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500">Years of Service</span>
                    <span className="text-sm font-medium text-gray-900">
                      {currentInstructor.yearsOfService || 0} years
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500">Current Workload</span>
                    <span className={`text-sm font-bold ${getWorkloadColor()}`}>
                      {currentInstructor.currentWorkload || 0}/{currentInstructor.maxWorkload}
                    </span>
                  </div>
                  
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 rounded-full h-2 transition-all duration-300"
                      style={{ width: `${workloadPercentage}%` }}
                    />
                  </div>
                  
                  <div className="flex justify-between items-center pt-2 border-t border-gray-200">
                    <span className="text-sm text-gray-500">Monthly Salary</span>
                    <span className="text-sm font-bold text-gray-900">
                      {formatSalary(currentInstructor.salary, currentInstructor.salaryCurrency)}
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500">Salary Status</span>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${salaryStatusConfig.color}`}>
                      {salaryStatusConfig.label}
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500">Last Updated</span>
                    <span className="text-sm font-medium text-gray-900">
                      {formatDateTime(currentInstructor.updatedAt)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Expertise Areas */}
              {currentInstructor.expertise?.length > 0 && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Areas of Expertise
                  </h3>
                  
                  <div className="flex flex-wrap gap-2">
                    {currentInstructor.expertise.map((skill, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Benefits */}
              {currentInstructor.benefits?.length > 0 && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Benefits
                  </h3>
                  
                  <div className="space-y-2">
                    {currentInstructor.benefits.map((benefit, index) => (
                      <div key={index} className="flex items-center text-sm text-gray-600">
                        <BadgeCheck className="w-4 h-4 mr-2 text-green-500" />
                        {benefit}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Quick Actions */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Quick Actions
                </h3>
                
                <div className="space-y-3">
                  <button
                    onClick={() => setActiveTab('courses')}
                    className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                  >
                    <BookOpen className="w-4 h-4 mr-2" />
                    View Assigned Courses
                  </button>
                  
                  {user?.role === 'admin' && (
                    <>
                      <button
                        onClick={() => setShowSalaryModal(true)}
                        className="w-full flex items-center justify-center px-4 py-2 border border-green-300 rounded-lg text-sm font-medium text-green-700 bg-green-50 hover:bg-green-100 transition-colors"
                      >
                        <DollarSign className="w-4 h-4 mr-2" />
                        Record Payment
                      </button>
                      
                      <button
                        onClick={() => setShowAssignCourseModal(true)}
                        className="w-full flex items-center justify-center px-4 py-2 border border-purple-300 rounded-lg text-sm font-medium text-purple-700 bg-purple-50 hover:bg-purple-100 transition-colors"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Assign Course
                      </button>
                    </>
                  )}
                  
                  <button
                    onClick={handleEdit}
                    className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Edit Profile
                  </button>
                  
                  <button
                    onClick={handleBack}
                    className="w-full flex items-center justify-center px-4 py-2 border border-transparent rounded-lg text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 transition-all"
                  >
                    Back to List
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'qualifications' && (
          <div className="space-y-6">
            {/* Education Qualifications */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <GraduationCap className="w-5 h-5 mr-2 text-blue-600" />
                Educational Qualifications
              </h2>
              
              {currentInstructor.qualifications?.length > 0 ? (
                <div className="space-y-4">
                  {currentInstructor.qualifications.map((qual, index) => (
                    <div key={index} className="border-b border-gray-100 last:border-0 pb-4 last:pb-0">
                      <h3 className="font-medium text-gray-900">{qual.degree}</h3>
                      <p className="text-sm text-gray-600">{qual.institution}</p>
                      <div className="flex items-center space-x-4 mt-1">
                        <span className="text-xs text-gray-500">Year: {qual.year}</span>
                        {qual.grade && <span className="text-xs text-gray-500">Grade: {qual.grade}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">No qualifications recorded</p>
              )}
            </div>

            {/* Professional Certifications */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Award className="w-5 h-5 mr-2 text-blue-600" />
                Professional Certifications
              </h2>
              
              {currentInstructor.certifications?.length > 0 ? (
                <div className="space-y-4">
                  {currentInstructor.certifications.map((cert, index) => (
                    <div key={index} className="border-b border-gray-100 last:border-0 pb-4 last:pb-0">
                      <h3 className="font-medium text-gray-900">{cert.name}</h3>
                      <p className="text-sm text-gray-600">{cert.issuingBody}</p>
                      <div className="flex items-center space-x-4 mt-1">
                        <span className="text-xs text-gray-500">Year: {cert.year}</span>
                        {cert.expiryDate && (
                          <span className="text-xs text-gray-500">
                            Expires: {formatDate(cert.expiryDate)}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">No certifications recorded</p>
              )}
            </div>

            {/* Areas of Expertise */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <TrendingUp className="w-5 h-5 mr-2 text-blue-600" />
                Areas of Expertise
              </h2>
              
              {currentInstructor.expertise?.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {currentInstructor.expertise.map((skill, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">No expertise areas recorded</p>
              )}
            </div>
          </div>
        )}

        {activeTab === 'courses' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                <BookOpen className="w-5 h-5 mr-2 text-blue-600" />
                Assigned Courses
              </h2>
              
              {user?.role === 'admin' && (
                <button
                  onClick={() => setShowAssignCourseModal(true)}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Assign Course
                </button>
              )}
            </div>

            {instructorCourses?.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Course Code</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Course Name</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Intake</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Students</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {instructorCourses.map((course) => (
                      <tr key={course._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {course.courseCode}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {course.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs rounded-full ${
                            course.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                          }`}>
                            {course.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {course.intakeMonth} {course.intakeYear}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {course.enrolledCount || course.enrolledStudents?.length || 0}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <button
                            onClick={() => handleViewCourse(course._id)}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            View Details
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-12">
                <BookOpen className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No courses assigned</h3>
                <p className="mt-1 text-sm text-gray-500">
                  This instructor hasn't been assigned to any courses yet.
                </p>
                {user?.role === 'admin' && (
                  <button
                    onClick={() => setShowAssignCourseModal(true)}
                    className="mt-4 inline-flex items-center px-4 py-2 border border-transparent rounded-lg text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Assign Course
                  </button>
                )}
              </div>
            )}

            {/* Workload Summary */}
            {instructorCourses?.length > 0 && (
              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-700">Workload Usage</span>
                  <span className={`text-sm font-bold ${getWorkloadColor()}`}>
                    {currentInstructor.currentWorkload || 0}/{currentInstructor.maxWorkload} courses
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 rounded-full h-2 transition-all duration-300"
                    style={{ width: `${workloadPercentage}%` }}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  {currentInstructor.maxWorkload - (currentInstructor.currentWorkload || 0)} spots available for additional courses
                </p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'salary' && (
          <div className="space-y-6">
            {/* Salary Summary Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <DollarSign className="w-5 h-5 mr-2 text-blue-600" />
                Salary Summary
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm text-gray-600">Monthly Salary</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {formatSalary(currentInstructor.salary, currentInstructor.salaryCurrency)}
                  </p>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <p className="text-sm text-gray-600">Total Paid</p>
                  <p className="text-2xl font-bold text-green-600">
                    {formatSalary(totalPaid, currentInstructor.salaryCurrency)}
                  </p>
                </div>
                <div className="text-center p-4 bg-orange-50 rounded-lg">
                  <p className="text-sm text-gray-600">Remaining Balance</p>
                  <p className={`text-2xl font-bold ${currentInstructor.salaryBalance > 0 ? 'text-orange-600' : 'text-green-600'}`}>
                    {formatSalary(currentInstructor.salaryBalance, currentInstructor.salaryCurrency)}
                  </p>
                </div>
              </div>
            </div>

            {/* Payment History */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                  <CreditCard className="w-5 h-5 mr-2 text-blue-600" />
                  Payment History
                </h2>
                
                {user?.role === 'admin' && (
                  <button
                    onClick={() => setShowSalaryModal(true)}
                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg text-sm font-medium text-white bg-green-600 hover:bg-green-700"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Record Payment
                  </button>
                )}
              </div>

              {currentInstructor.salaryPayments?.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Payment Date</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">For Month</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Method</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reference</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Notes</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {currentInstructor.salaryPayments.map((payment, index) => (
                        <tr key={index}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatDate(payment.paymentDate)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                            {payment.paidForMonth}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                            {formatSalary(payment.amount, currentInstructor.salaryCurrency)}
                           </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                            {payment.paymentMethod}
                           </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                            {payment.transactionReference || '-'}
                           </td>
                          <td className="px-6 py-4 text-sm text-gray-600">
                            {payment.notes || '-'}
                           </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Banknote className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No payment records</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    No salary payments have been recorded for this instructor.
                  </p>
                  {user?.role === 'admin' && (
                    <button
                      onClick={() => setShowSalaryModal(true)}
                      className="mt-4 inline-flex items-center px-4 py-2 border border-transparent rounded-lg text-sm font-medium text-white bg-green-600 hover:bg-green-700"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Record First Payment
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Bank Account Information */}
            {currentInstructor.bankAccount?.bankName && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Building className="w-5 h-5 mr-2 text-blue-600" />
                  Bank Account Information
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">Bank Name</label>
                    <p className="text-gray-900">{currentInstructor.bankAccount.bankName}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">Account Number</label>
                    <p className="text-gray-900">{currentInstructor.bankAccount.accountNumber}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">Account Name</label>
                    <p className="text-gray-900">{currentInstructor.bankAccount.accountName || currentInstructor.user?.name}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">Branch</label>
                    <p className="text-gray-900">{currentInstructor.bankAccount.branch || 'Not specified'}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'documents' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <FileText className="w-5 h-5 mr-2 text-blue-600" />
              Documents (Coming Soon)
            </h2>
            <div className="text-center py-12">
              <Upload className="mx-auto h-12 w-12 text-gray-400" />
              <p className="mt-2 text-sm text-gray-500">
                Document management feature is under development.
              </p>
              <p className="text-xs text-gray-400 mt-1">
                This will include resume upload, contract documents, and profile images.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      {showSalaryModal && (
        <SalaryPaymentModal
          instructor={currentInstructor}
          onClose={() => setShowSalaryModal(false)}
          onSuccess={() => {
            fetchInstructor(id);
            toast.success('Salary payment recorded successfully!');
          }}
        />
      )}

      {showAssignCourseModal && (
        <AssignCourseModal
          instructor={currentInstructor}
          onClose={() => setShowAssignCourseModal(false)}
          onSuccess={() => {
            fetchInstructorCourses(id);
            fetchInstructor(id);
            toast.success('Course assigned successfully!');
          }}
        />
      )}
    </Layout>
  );
};

export default InstructorProfile;