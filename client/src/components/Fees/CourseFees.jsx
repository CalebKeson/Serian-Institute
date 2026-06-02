// src/components/Fees/CourseFees.jsx - COMPLETE FIXED VERSION

import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router';
import {
  ArrowLeft,
  BookOpen,
  DollarSign,
  Users,
  CreditCard,
  Download,
  RefreshCw,
  TrendingUp,
  PieChart,
  Calendar,
  Award,
  CheckCircle,
  XCircle,
  AlertCircle,
  User,
  Mail,
  Search,
  Filter,
  ChevronDown,
  ChevronUp,
  Loader,
  Hash
} from 'lucide-react';
import Layout from '../Layout/Layout';
import { usePaymentStore } from '../../stores/paymentStore';
import { useCourseStore } from '../../stores/courseStore';
import { useAuthStore } from '../../stores/authStore';
import {
  formatCurrency,
  calculateProgress,
  getProgressColor,
  getFeeStatusBadge
} from '../../utils/feeFormatter';
import ExportButtons from './ExportButtons';
import { courseFeesExportConfig } from '../../utils/exportConfigs';
import toast from 'react-hot-toast';

const CourseFees = () => {
  const navigate = useNavigate();
  const { courseId } = useParams();
  const { user } = useAuthStore();
  const { currentCourse, fetchCourse, loading: courseLoading } = useCourseStore();
  const {
    coursePaymentSummary,
    courseStudentsPaymentStatus,
    loading: paymentLoading,
    fetchCoursePaymentSummary,
    fetchCourseStudentsPaymentStatus
  } = usePaymentStore();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [sortField, setSortField] = useState('balance');
  const [sortDirection, setSortDirection] = useState('desc');
  const [studentsList, setStudentsList] = useState([]);

  // Log API responses for debugging
  useEffect(() => {
    console.log('Current Course:', currentCourse);
    console.log('Course Payment Summary:', coursePaymentSummary);
    console.log('Course Students Payment Status:', courseStudentsPaymentStatus);
  }, [currentCourse, coursePaymentSummary, courseStudentsPaymentStatus]);

  // Load course data on mount
  useEffect(() => {
    if (courseId) {
      loadCourseData();
    }
  }, [courseId]);

  // Process students list - MATCHING ACTUAL API RESPONSE STRUCTURE
  useEffect(() => {
    let studentsData = null;
    
    if (courseStudentsPaymentStatus?.students) {
      studentsData = courseStudentsPaymentStatus.students;
    } else if (Array.isArray(courseStudentsPaymentStatus)) {
      studentsData = courseStudentsPaymentStatus;
    }
    
    if (studentsData && studentsData.length > 0) {
      console.log('Students data found:', studentsData);
      
      // Create a map of student details from currentCourse.enrolledStudents
      const studentDetailsMap = {};
      if (currentCourse?.enrolledStudents) {
        currentCourse.enrolledStudents.forEach(enrolled => {
          studentDetailsMap[enrolled._id] = {
            studentNumber: enrolled.studentId, // SBTC format ID
          };
        });
      }
      
      // Transform the data - the API uses 'payment' object
      const transformedStudents = studentsData.map(student => {
        const details = studentDetailsMap[student.studentId] || {};
        const paymentData = student.payment || {};
        
        return {
          studentId: student.studentId,
          studentName: student.studentName,
          studentEmail: student.studentEmail,
          studentNumber: details.studentNumber || student.studentNumber || student.studentId,
          admissionNumber: student.admissionNumber,
          payment: {
            coursePrice: paymentData.coursePrice || 0,
            totalPaid: paymentData.totalPaid || 0,
            balance: paymentData.balance || 0,
            percentage: paymentData.percentage || 0,
            status: paymentData.status || 'unpaid'
          }
        };
      });
      
      setStudentsList(transformedStudents);
    } else {
      console.log('No students data found in:', courseStudentsPaymentStatus);
      setStudentsList([]);
    }
  }, [courseStudentsPaymentStatus, currentCourse]);

  const loadCourseData = async () => {
    try {
      await Promise.all([
        fetchCourse(courseId),
        fetchCoursePaymentSummary(courseId),
        fetchCourseStudentsPaymentStatus(courseId)
      ]);
    } catch (error) {
      console.error('Error loading course data:', error);
      toast.error('Failed to load course data');
    }
  };

  const handleRefresh = () => {
    loadCourseData();
    toast.success('Data refreshed');
  };

  const handleBack = () => {
    navigate('/fees');
  };

  const handleViewStudent = (studentId) => {
    navigate(`/fees/student/${studentId}`);
  };

  const handleRecordPayment = (student = null) => {
    const params = new URLSearchParams();
    params.append('courseId', courseId);
    if (student) {
      params.append('studentId', student.studentId);
    }
    navigate(`/fees/record-payment?${params.toString()}`);
  };

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  // Filter and sort students
  const getFilteredStudents = () => {
    let students = [...studentsList];
    
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      students = students.filter(student => 
        (student.studentName?.toLowerCase().includes(searchLower) ||
         student.studentNumber?.toLowerCase().includes(searchLower) ||
         student.studentEmail?.toLowerCase().includes(searchLower) ||
         student.admissionNumber?.toLowerCase().includes(searchLower))
      );
    }

    if (statusFilter) {
      students = students.filter(student => 
        student.payment?.status === statusFilter
      );
    }

    students.sort((a, b) => {
      let aVal, bVal;
      
      switch (sortField) {
        case 'studentName':
          aVal = a.studentName || '';
          bVal = b.studentName || '';
          break;
        case 'studentNumber':
          aVal = a.studentNumber || a.studentId || '';
          bVal = b.studentNumber || b.studentId || '';
          break;
        case 'balance':
          aVal = a.payment?.balance || 0;
          bVal = b.payment?.balance || 0;
          break;
        case 'percentage':
          aVal = a.payment?.percentage || 0;
          bVal = b.payment?.percentage || 0;
          break;
        case 'status':
          aVal = a.payment?.status || '';
          bVal = b.payment?.status || '';
          break;
        default:
          aVal = a.payment?.balance || 0;
          bVal = b.payment?.balance || 0;
      }
      
      if (sortDirection === 'asc') {
        return aVal > bVal ? 1 : -1;
      } else {
        return aVal < bVal ? 1 : -1;
      }
    });
    
    return students;
  };

  const filteredStudents = getFilteredStudents();
  
  // Get summary data from coursePaymentSummary
  const totalExpected = coursePaymentSummary?.totalFees || 0;
  const totalCollected = coursePaymentSummary?.totalPaid || 0;
  const outstandingBalance = coursePaymentSummary?.totalBalance || 0;
  const collectionRate = coursePaymentSummary?.collectionRate || 0;
  const enrolledStudents = coursePaymentSummary?.totalStudents || 0;

  const stats = {
    totalStudents: filteredStudents.length,
    paidCount: filteredStudents.filter(s => s.payment?.status === 'paid').length,
    partialCount: filteredStudents.filter(s => s.payment?.status === 'partial').length,
    unpaidCount: filteredStudents.filter(s => s.payment?.status === 'unpaid').length,
    totalCollected: totalCollected,
    totalExpected: totalExpected,
    outstandingBalance: outstandingBalance,
    collectionRate: collectionRate,
    enrolledStudents: enrolledStudents
  };

  // Prepare export data
  const exportData = studentsList.map(student => ({
    studentName: student.studentName || 'N/A',
    studentNumber: student.studentNumber || student.studentId || 'N/A',
    admissionNumber: student.admissionNumber || 'Not assigned',
    totalFees: student.payment?.coursePrice || 0,
    amountPaid: student.payment?.totalPaid || 0,
    balance: student.payment?.balance || 0,
    paymentPercentage: `${Math.round(student.payment?.percentage || 0)}%`
  }));

  const dynamicConfig = {
    ...courseFeesExportConfig,
    title: `${currentCourse?.name || 'Course'} - Fee Report`,
    filename: `${currentCourse?.courseCode || 'course'}_fee_report`,
    summaryFields: courseFeesExportConfig.summaryFields.map(field => {
      if (field.value === 'courseName') return { ...field, value: currentCourse?.name || 'N/A' };
      if (field.value === 'courseCode') return { ...field, value: currentCourse?.courseCode || 'N/A' };
      if (field.value === 'expectedRevenue') return { ...field, value: totalExpected };
      if (field.value === 'totalCollected') return { ...field, value: totalCollected };
      if (field.value === 'outstandingBalance') return { ...field, value: outstandingBalance };
      if (field.value === 'collectionRate') return { ...field, value: collectionRate };
      if (field.value === 'coursePrice') return { ...field, value: currentCourse?.price || 0 };
      if (field.value === 'enrolledStudents') return { ...field, value: enrolledStudents };
      return field;
    })
  };

  if (courseLoading || !currentCourse) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
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
                  <BookOpen className="w-8 h-8 mr-3 text-green-600" />
                  Course Fee Management
                </h1>
                <p className="mt-2 text-gray-600">
                  {currentCourse.courseCode} - {currentCourse.name}
                </p>
              </div>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={handleRefresh}
                disabled={paymentLoading}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 transition-colors"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${paymentLoading ? 'animate-spin' : ''}`} />
                Refresh
              </button>

              <ExportButtons
                data={exportData}
                config={dynamicConfig}
                filename={`${currentCourse.courseCode}_fee_report`}
                formats={['csv', 'excel', 'pdf', 'print', 'email']}
                includeDateRange={false}
                buttonStyle="default"
                buttonText="Export Report"
              />

              <button
                onClick={() => handleRecordPayment()}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg text-sm font-medium text-white bg-gradient-to-r from-green-600 to-emerald-700 hover:from-green-700 hover:to-emerald-800 transition-all shadow-sm hover:shadow-md"
              >
                <CreditCard className="w-4 h-4 mr-2" />
                Record Payment
              </button>
            </div>
          </div>
        </div>

        {/* Course Info Card */}
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200 p-6 mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                {currentCourse.name}
              </h2>
              <div className="flex items-center space-x-4 mt-2">
                <span className="text-sm text-gray-600">
                  Code: {currentCourse.courseCode}
                </span>
                <span className="text-sm text-gray-600">
                  Duration: {currentCourse.duration}
                </span>
                <span className="text-sm text-gray-600">
                  Intake: {currentCourse.intakeMonth} {currentCourse.intakeYear}
                </span>
              </div>
            </div>
            <div className="mt-4 md:mt-0 flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm text-gray-600">Course Price</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(currentCourse.price || 0)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600">Enrolled Students</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.enrolledStudents} / {currentCourse.maxStudents}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Financial Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <p className="text-sm text-gray-600 mb-2">Expected Revenue</p>
            <p className="text-2xl font-bold text-gray-900">
              {formatCurrency(stats.totalExpected)}
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <p className="text-sm text-gray-600 mb-2">Total Collected</p>
            <p className="text-2xl font-bold text-green-600">
              {formatCurrency(stats.totalCollected)}
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <p className="text-sm text-gray-600 mb-2">Outstanding Balance</p>
            <p className={`text-2xl font-bold ${
              stats.outstandingBalance === 0 ? 'text-green-600' : 'text-orange-600'
            }`}>
              {formatCurrency(stats.outstandingBalance)}
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <p className="text-sm text-gray-600 mb-2">Collection Rate</p>
            <p className="text-2xl font-bold text-purple-600">
              {Math.round(stats.collectionRate)}%
            </p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">
              Collection Progress
            </span>
            <span className="text-sm font-medium text-gray-900">
              {formatCurrency(stats.totalCollected)} / {formatCurrency(stats.totalExpected)} ({Math.round(stats.collectionRate)}%)
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className={`h-3 rounded-full transition-all duration-500 ${
                stats.collectionRate >= 100 ? 'bg-green-500' :
                stats.collectionRate >= 75 ? 'bg-blue-500' :
                stats.collectionRate >= 50 ? 'bg-yellow-500' :
                stats.collectionRate >= 25 ? 'bg-orange-500' :
                'bg-red-500'
              }`}
              style={{ width: `${Math.min(100, stats.collectionRate)}%` }}
            />
          </div>
        </div>

        {/* Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-green-50 rounded-lg border border-green-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-700">Fully Paid</p>
                <p className="text-2xl font-bold text-green-700">{stats.paidCount}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
          </div>

          <div className="bg-yellow-50 rounded-lg border border-yellow-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-yellow-700">Partial Payment</p>
                <p className="text-2xl font-bold text-yellow-700">{stats.partialCount}</p>
              </div>
              <AlertCircle className="w-8 h-8 text-yellow-500" />
            </div>
          </div>

          <div className="bg-red-50 rounded-lg border border-red-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-red-700">Unpaid</p>
                <p className="text-2xl font-bold text-red-700">{stats.unpaidCount}</p>
              </div>
              <XCircle className="w-8 h-8 text-red-500" />
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by student name, number, or admission number..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              />
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`inline-flex items-center px-4 py-2 border rounded-lg text-sm font-medium transition-colors ${
                  statusFilter
                    ? 'bg-green-100 border-green-300 text-green-700'
                    : 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50'
                }`}
              >
                <Filter className="w-4 h-4 mr-2" />
                Filter
                {statusFilter && <span className="ml-2 w-2 h-2 bg-green-600 rounded-full"></span>}
              </button>
            </div>
          </div>

          {/* Filter Options */}
          {showFilters && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Payment Status
              </label>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setStatusFilter('')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    statusFilter === ''
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setStatusFilter('paid')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    statusFilter === 'paid'
                      ? 'bg-green-600 text-white'
                      : 'bg-green-100 text-green-700 hover:bg-green-200'
                  }`}
                >
                  Fully Paid
                </button>
                <button
                  onClick={() => setStatusFilter('partial')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    statusFilter === 'partial'
                      ? 'bg-yellow-600 text-white'
                      : 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                  }`}
                >
                  Partial Payment
                </button>
                <button
                  onClick={() => setStatusFilter('unpaid')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    statusFilter === 'unpaid'
                      ? 'bg-red-600 text-white'
                      : 'bg-red-100 text-red-700 hover:bg-red-200'
                  }`}
                >
                  Unpaid
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Students Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th
                    scope="col"
                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:text-gray-700"
                    onClick={() => handleSort('studentName')}
                  >
                    <div className="flex items-center space-x-1">
                      <User className="w-3 h-3" />
                      <span>Student</span>
                      {sortField === 'studentName' && (
                        sortDirection === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
                      )}
                    </div>
                  </th>
                  <th
                    scope="col"
                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:text-gray-700"
                    onClick={() => handleSort('studentNumber')}
                  >
                    <div className="flex items-center space-x-1">
                      <Hash className="w-3 h-3" />
                      <span>Student Number</span>
                      {sortField === 'studentNumber' && (
                        sortDirection === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
                      )}
                    </div>
                  </th>
                  <th
                    scope="col"
                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Admission Number
                  </th>
                  <th
                    scope="col"
                    className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:text-gray-700"
                    onClick={() => handleSort('balance')}
                  >
                    <div className="flex items-center justify-end space-x-1">
                      <span>Balance</span>
                      {sortField === 'balance' && (
                        sortDirection === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
                      )}
                    </div>
                  </th>
                  <th
                    scope="col"
                    className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:text-gray-700"
                    onClick={() => handleSort('percentage')}
                  >
                    <div className="flex items-center justify-center space-x-1">
                      <span>Progress</span>
                      {sortField === 'percentage' && (
                        sortDirection === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
                      )}
                    </div>
                  </th>
                  <th
                    scope="col"
                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:text-gray-700"
                    onClick={() => handleSort('status')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Status</span>
                      {sortField === 'status' && (
                        sortDirection === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
                      )}
                    </div>
                  </th>
                  <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredStudents.length > 0 ? (
                  filteredStudents.map((student) => (
                    <tr key={student.studentId} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="h-9 w-9 bg-gradient-to-r from-green-600 to-emerald-700 rounded-full flex items-center justify-center">
                            <span className="text-white font-medium text-sm">
                              {student.studentName?.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div className="ml-3">
                            <div className="text-sm font-medium text-gray-900">
                              {student.studentName}
                            </div>
                            <div className="text-xs text-gray-500">
                              {student.studentEmail}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <code className="text-xs font-mono font-medium text-blue-700 bg-blue-50 px-2 py-1 rounded">
                          {student.studentNumber || 'Not assigned'}
                        </code>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <code className="text-xs font-mono font-medium text-purple-700 bg-purple-50 px-2 py-1 rounded">
                          {student.admissionNumber || 'Not assigned'}
                        </code>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-right">
                        <span className={`text-sm font-bold ${
                          student.payment?.balance === 0 ? 'text-green-600' : 'text-orange-600'
                        }`}>
                          {formatCurrency(student.payment?.balance || 0)}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center justify-center space-x-2">
                          <span className={`text-sm font-medium ${
                            (student.payment?.percentage || 0) >= 75 ? 'text-green-600' :
                            (student.payment?.percentage || 0) >= 50 ? 'text-yellow-600' :
                            'text-red-600'
                          }`}>
                            {Math.round(student.payment?.percentage || 0)}%
                          </span>
                          <div className="w-16 bg-gray-200 rounded-full h-1.5">
                            <div
                              className={`h-1.5 rounded-full ${
                                (student.payment?.percentage || 0) >= 75 ? 'bg-green-500' :
                                (student.payment?.percentage || 0) >= 50 ? 'bg-yellow-500' :
                                'bg-red-500'
                              }`}
                              style={{ width: `${Math.min(100, student.payment?.percentage || 0)}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                          student.payment?.status === 'paid' ? 'bg-green-100 text-green-800' :
                          student.payment?.status === 'partial' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {student.payment?.status === 'paid' ? '✅ Fully Paid' :
                           student.payment?.status === 'partial' ? '⚠️ Partial' : '❌ Unpaid'}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end space-x-2">
                          <button
                            onClick={() => handleViewStudent(student.studentId)}
                            className="text-blue-600 hover:text-blue-900 transition-colors p-1 rounded"
                            title="View Student Fees"
                          >
                            <DollarSign className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleRecordPayment(student)}
                            className="text-green-600 hover:text-green-900 transition-colors p-1 rounded"
                            title="Record Payment"
                          >
                            <CreditCard className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" className="px-4 py-12 text-center text-gray-500">
                      <Users className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                      <p className="text-lg font-medium text-gray-900 mb-2">No students found</p>
                      <p className="text-sm">
                        {searchTerm || statusFilter
                          ? 'Try adjusting your search or filters'
                          : 'No students are enrolled in this course'}
                      </p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Table Footer */}
          {filteredStudents.length > 0 && (
            <div className="px-4 py-3 bg-gray-50 border-t border-gray-200">
              <div className="flex items-center justify-between text-sm text-gray-500">
                <span>
                  Showing {filteredStudents.length} of {studentsList.length} students
                </span>
                <div className="flex items-center space-x-4">
                  <span className="flex items-center">
                    <span className="w-2 h-2 rounded-full bg-green-500 mr-1"></span>
                    Fully Paid: {stats.paidCount}
                  </span>
                  <span className="flex items-center">
                    <span className="w-2 h-2 rounded-full bg-yellow-500 mr-1"></span>
                    Partial: {stats.partialCount}
                  </span>
                  <span className="flex items-center">
                    <span className="w-2 h-2 rounded-full bg-red-500 mr-1"></span>
                    Unpaid: {stats.unpaidCount}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Loading indicator */}
        {paymentLoading && (
          <div className="mt-6 flex justify-center">
            <Loader className="w-6 h-6 animate-spin text-green-600" />
          </div>
        )}
      </div>
    </Layout>
  );
};

export default CourseFees;