// src/pages/Dashboard/Dashboard.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import {
  LayoutDashboard,
  Users,
  BookOpen,
  DollarSign,
  TrendingUp,
  Calendar,
  RefreshCw,
  Bell,
  AlertCircle,
  CreditCard,
  UserPlus,
  FileText,
  PieChart,
  BarChart3,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import Layout from '../../components/Layout/Layout';
import { useAuthStore } from '../../stores/authStore';
import { useStudentStore } from '../../stores/studentStore';
import { useCourseStore } from '../../stores/courseStore';
import { usePaymentStore } from '../../stores/paymentStore';
import { useEnrollmentStore } from '../../stores/enrollmentStore';
import { useAttendanceStore } from '../../stores/attendanceStore';
import RevenueChart from '../../components/Dashboard/RevenueChart';
import PaymentMethodsChart from '../../components/Dashboard/PaymentMethodsChart';
import EnrollmentChart from '../../components/Dashboard/EnrollmentChart';
import { formatCurrency } from '../../utils/feeFormatter';
import toast from 'react-hot-toast';

const Dashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { studentCount, fetchStudentCount } = useStudentStore();
  const { courseCount, fetchCourseCount } = useCourseStore();
  const { 
    paymentStats, 
    fetchPaymentStats,
    outstandingReport,
    fetchOutstandingReport,
    loading: paymentLoading 
  } = usePaymentStore();
  const { fetchEnrollmentStats, enrollmentStats } = useEnrollmentStore();
  const { fetchAttendanceStats, attendanceStats } = useAttendanceStore();

  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [dateRange, setDateRange] = useState('month');
  const [dataErrors, setDataErrors] = useState({});
  
  // Chart type states
  const [revenueChartType, setRevenueChartType] = useState('line');
  const [paymentChartType, setPaymentChartType] = useState('pie');
  const [enrollmentChartType, setEnrollmentChartType] = useState('bar');
  
  // Expanded sections
  const [expandedSections, setExpandedSections] = useState({
    revenue: true,
    payments: true,
    enrollment: true,
    attendance: true
  });

  // Load all dashboard data
  useEffect(() => {
    loadDashboardData();
  }, [dateRange]);

  const loadDashboardData = async () => {
    setLoading(true);
    setDataErrors({});
    
    const promises = [
      { name: 'students', fn: fetchStudentCount() },
      { name: 'courses', fn: fetchCourseCount() },
      { name: 'payments', fn: fetchPaymentStats(getDateRangeParams()) },
      { name: 'outstanding', fn: fetchOutstandingReport() },
      { name: 'enrollments', fn: fetchEnrollmentStats() },
      { name: 'attendance', fn: fetchAttendanceStats(null, null, getDateRangeParams().startDate, getDateRangeParams().endDate) }
    ];

    const results = await Promise.allSettled(promises.map(p => p.fn));
    
    const errors = {};
    results.forEach((result, index) => {
      if (result.status === 'rejected') {
        errors[promises[index].name] = true;
        console.warn(`Failed to load ${promises[index].name}:`, result.reason);
      }
    });
    
    setDataErrors(errors);
    setLastUpdated(new Date());
    setLoading(false);

    if (Object.keys(errors).length > 0) {
      toast.error('Some dashboard data failed to load');
    }
  };

  const getDateRangeParams = () => {
    const end = new Date();
    const start = new Date();

    switch (dateRange) {
      case 'today':
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);
        break;
      case 'week':
        start.setDate(end.getDate() - 7);
        break;
      case 'month':
        start.setMonth(end.getMonth() - 1);
        break;
      case 'quarter':
        start.setMonth(end.getMonth() - 3);
        break;
      case 'year':
        start.setFullYear(end.getFullYear() - 1);
        break;
      default:
        start.setMonth(end.getMonth() - 1);
    }

    return {
      startDate: start.toISOString().split('T')[0],
      endDate: end.toISOString().split('T')[0]
    };
  };

  const handleRefresh = () => {
    loadDashboardData();
    toast.success('Dashboard refreshed');
  };

  const handleDateRangeChange = (range) => {
    setDateRange(range);
  };

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // Get stats from stores with fallbacks
  const totalStudents = studentCount || 0;
  const totalCourses = courseCount || 0;
  
  const totalRevenue = paymentStats?.totalStats?.[0]?.totalAmount || 0;
  const totalPayments = paymentStats?.totalStats?.[0]?.totalPayments || 0;
  const averagePayment = paymentStats?.totalStats?.[0]?.averageAmount || 0;
  
  const totalOutstanding = outstandingReport?.summary?.totalOutstanding || 0;
  const studentsWithBalance = outstandingReport?.summary?.totalStudents || 0;
  
  const collectionRate = totalRevenue + totalOutstanding > 0 
    ? Math.round((totalRevenue / (totalRevenue + totalOutstanding)) * 100) 
    : 0;

  const recentPayments = paymentStats?.recentPayments || [];

  // Get enrollment stats with fallbacks
  const activeEnrollments = enrollmentStats?.active || 0;
  const todayEnrollments = enrollmentStats?.today || 0;
  const monthEnrollments = enrollmentStats?.thisMonth || 0;

  // Get attendance stats with fallbacks
  const todayAttendance = attendanceStats || { 
    total: 0, 
    present: 0, 
    absent: 0, 
    late: 0, 
    excused: 0,
    attendanceRate: 0 
  };
  const attendanceRate = attendanceStats?.attendanceRate || 0;

  // Prepare chart data
  const revenueChartData = paymentStats?.byDay?.map(day => ({
    date: new Date(day._id).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    total: day.total,
    count: day.count
  })) || [];

  const paymentMethodData = paymentStats?.byMethod || [];

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                <LayoutDashboard className="w-8 h-8 mr-3 text-blue-600" />
                Dashboard
              </h1>
              <p className="mt-2 text-gray-600">
                Welcome back, {user?.name}! Here's what's happening at Serian Institute.
              </p>
            </div>

            <div className="mt-4 sm:mt-0 flex items-center space-x-3">
              <div className="text-sm text-gray-500">
                Last updated: {lastUpdated.toLocaleTimeString()}
              </div>
              <button
                onClick={handleRefresh}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                title="Refresh"
              >
                <RefreshCw className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Error Banner */}
          {Object.keys(dataErrors).length > 0 && (
            <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <div className="flex items-center">
                <AlertCircle className="w-5 h-5 text-yellow-600 mr-2" />
                <p className="text-sm text-yellow-700">
                  Some data failed to load: {Object.keys(dataErrors).join(', ')}. 
                  Showing available data only.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Date Range Selector */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
            <div className="flex items-center space-x-4">
              <span className="text-sm font-medium text-gray-700">Time Period:</span>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => handleDateRangeChange('today')}
                  className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                    dateRange === 'today'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Today
                </button>
                <button
                  onClick={() => handleDateRangeChange('week')}
                  className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                    dateRange === 'week'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  This Week
                </button>
                <button
                  onClick={() => handleDateRangeChange('month')}
                  className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                    dateRange === 'month'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  This Month
                </button>
                <button
                  onClick={() => handleDateRangeChange('quarter')}
                  className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                    dateRange === 'quarter'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  This Quarter
                </button>
                <button
                  onClick={() => handleDateRangeChange('year')}
                  className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                    dateRange === 'year'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  This Year
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Top Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          {/* Total Students Card */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-all cursor-pointer" onClick={() => navigate('/students')}>
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <span className="text-xs text-gray-400">Total</span>
            </div>
            <p className="text-sm text-gray-600 mb-1">Total Students</p>
            <p className="text-3xl font-bold text-gray-900">{totalStudents}</p>
            <p className="text-xs text-gray-500 mt-2">
              <span className="text-green-600">↑ 12</span> new this month
            </p>
          </div>

          {/* Total Courses Card */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-all cursor-pointer" onClick={() => navigate('/courses')}>
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-purple-100 rounded-lg">
                <BookOpen className="w-6 h-6 text-purple-600" />
              </div>
              <span className="text-xs text-gray-400">Active</span>
            </div>
            <p className="text-sm text-gray-600 mb-1">Total Courses</p>
            <p className="text-3xl font-bold text-gray-900">{totalCourses}</p>
            <p className="text-xs text-gray-500 mt-2">
              <span className="text-green-600">↑ 3</span> new this month
            </p>
          </div>

          {/* Total Revenue Card */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-all cursor-pointer" onClick={() => navigate('/fees')}>
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-green-100 rounded-lg">
                <DollarSign className="w-6 h-6 text-green-600" />
              </div>
              <span className="text-xs text-gray-400 capitalize">{dateRange}</span>
            </div>
            <p className="text-sm text-gray-600 mb-1">Total Revenue</p>
            <p className="text-3xl font-bold text-gray-900">{formatCurrency(totalRevenue)}</p>
            <p className="text-xs text-gray-500 mt-2">
              {totalPayments} payments • Avg {formatCurrency(averagePayment)}
            </p>
          </div>

          {/* Outstanding Balance Card */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-all cursor-pointer" onClick={() => navigate('/fees/reports')}>
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-orange-100 rounded-lg">
                <AlertCircle className="w-6 h-6 text-orange-600" />
              </div>
              <span className="text-xs text-gray-400">Due</span>
            </div>
            <p className="text-sm text-gray-600 mb-1">Outstanding</p>
            <p className="text-3xl font-bold text-orange-600">{formatCurrency(totalOutstanding)}</p>
            <p className="text-xs text-gray-500 mt-2">
              {studentsWithBalance} students • {collectionRate}% collected
            </p>
          </div>
        </div>

        {/* Revenue Chart Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-6">
          <button
            onClick={() => toggleSection('revenue')}
            className="w-full px-6 py-4 flex items-center justify-between bg-gray-50 hover:bg-gray-100 transition-colors"
          >
            <div className="flex items-center space-x-2">
              <TrendingUp className="w-5 h-5 text-blue-600" />
              <span className="font-medium text-gray-900">Revenue Trend</span>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden">
                <button
                  onClick={(e) => { e.stopPropagation(); setRevenueChartType('line'); }}
                  className={`p-1.5 text-xs font-medium transition-colors ${
                    revenueChartType === 'line' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  Line
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); setRevenueChartType('bar'); }}
                  className={`p-1.5 text-xs font-medium transition-colors ${
                    revenueChartType === 'bar' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  Bar
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); setRevenueChartType('area'); }}
                  className={`p-1.5 text-xs font-medium transition-colors ${
                    revenueChartType === 'area' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  Area
                </button>
              </div>
              {expandedSections.revenue ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </div>
          </button>

          {expandedSections.revenue && (
            <div className="p-6">
              <RevenueChart data={revenueChartData} chartType={revenueChartType} />
            </div>
          )}
        </div>

        {/* Payment Methods & Enrollment Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Payment Methods Chart */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <button
              onClick={() => toggleSection('payments')}
              className="w-full px-6 py-4 flex items-center justify-between bg-gray-50 hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-center space-x-2">
                <PieChart className="w-5 h-5 text-green-600" />
                <span className="font-medium text-gray-900">Payment Methods</span>
              </div>
              <div className="flex items-center space-x-4">
                <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden">
                  <button
                    onClick={(e) => { e.stopPropagation(); setPaymentChartType('pie'); }}
                    className={`p-1.5 text-xs font-medium transition-colors ${
                      paymentChartType === 'pie' ? 'bg-green-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    Pie
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); setPaymentChartType('bar'); }}
                    className={`p-1.5 text-xs font-medium transition-colors ${
                      paymentChartType === 'bar' ? 'bg-green-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    Bar
                  </button>
                </div>
                {expandedSections.payments ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
              </div>
            </button>

            {expandedSections.payments && (
              <div className="p-6">
                <PaymentMethodsChart data={paymentMethodData} chartType={paymentChartType} />
              </div>
            )}
          </div>

          {/* Enrollment Chart */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <button
              onClick={() => toggleSection('enrollment')}
              className="w-full px-6 py-4 flex items-center justify-between bg-gray-50 hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-center space-x-2">
                <Users className="w-5 h-5 text-purple-600" />
                <span className="font-medium text-gray-900">Enrollment Status</span>
              </div>
              <div className="flex items-center space-x-4">
                <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden">
                  <button
                    onClick={(e) => { e.stopPropagation(); setEnrollmentChartType('pie'); }}
                    className={`p-1.5 text-xs font-medium transition-colors ${
                      enrollmentChartType === 'pie' ? 'bg-purple-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    Pie
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); setEnrollmentChartType('bar'); }}
                    className={`p-1.5 text-xs font-medium transition-colors ${
                      enrollmentChartType === 'bar' ? 'bg-purple-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    Bar
                  </button>
                </div>
                {expandedSections.enrollment ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
              </div>
            </button>

            {expandedSections.enrollment && (
              <div className="p-6">
                <EnrollmentChart data={enrollmentStats} chartType={enrollmentChartType} />
              </div>
            )}
          </div>
        </div>

        {/* Attendance Stats Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-6">
          <button
            onClick={() => toggleSection('attendance')}
            className="w-full px-6 py-4 flex items-center justify-between bg-gray-50 hover:bg-gray-100 transition-colors"
          >
            <div className="flex items-center space-x-2">
              <Calendar className="w-5 h-5 text-orange-600" />
              <span className="font-medium text-gray-900">Today's Attendance</span>
            </div>
            {expandedSections.attendance ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </button>

          {expandedSections.attendance && (
            <div className="p-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div className="bg-green-50 rounded-lg p-4 text-center">
                  <p className="text-2xl font-bold text-green-600">{todayAttendance.present || 0}</p>
                  <p className="text-xs text-gray-500">Present</p>
                </div>
                <div className="bg-red-50 rounded-lg p-4 text-center">
                  <p className="text-2xl font-bold text-red-600">{todayAttendance.absent || 0}</p>
                  <p className="text-xs text-gray-500">Absent</p>
                </div>
                <div className="bg-yellow-50 rounded-lg p-4 text-center">
                  <p className="text-2xl font-bold text-yellow-600">{todayAttendance.late || 0}</p>
                  <p className="text-xs text-gray-500">Late</p>
                </div>
                <div className="bg-blue-50 rounded-lg p-4 text-center">
                  <p className="text-2xl font-bold text-blue-600">{todayAttendance.excused || 0}</p>
                  <p className="text-xs text-gray-500">Excused</p>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-700">Attendance Rate</span>
                  <span className="text-2xl font-bold text-purple-600">{attendanceRate.toFixed(1)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                  <div
                    className={`h-2 rounded-full ${
                      attendanceRate >= 90 ? 'bg-green-500' :
                      attendanceRate >= 75 ? 'bg-yellow-500' :
                      'bg-red-500'
                    }`}
                    style={{ width: `${Math.min(100, attendanceRate)}%` }}
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Recent Payments */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-6">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <DollarSign className="w-5 h-5 mr-2 text-green-600" />
                Recent Payments
              </h3>
              <button
                onClick={() => navigate('/fees/history')}
                className="text-sm text-green-600 hover:text-green-700"
              >
                View All →
              </button>
            </div>
          </div>
          <div className="p-6">
            {recentPayments.length > 0 ? (
              <div className="space-y-3">
                {recentPayments.slice(0, 5).map((payment, index) => (
                  <div 
                    key={index} 
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                    onClick={() => navigate(`/fees/student/${payment.studentId}`)}
                  >
                    <div>
                      <p className="font-medium text-gray-900">{payment.studentName}</p>
                      <p className="text-sm text-gray-500">{payment.courseCode} • {payment.courseName}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-green-600">{formatCurrency(payment.amount)}</p>
                      <p className="text-xs text-gray-500">{new Date(payment.paymentDate).toLocaleDateString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                No recent payments
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <button
              onClick={() => navigate('/fees/record-payment')}
              className="flex flex-col items-center p-4 bg-white rounded-lg border border-blue-200 hover:border-blue-400 hover:shadow-md transition-all group"
            >
              <CreditCard className="w-6 h-6 text-blue-600 mb-2 group-hover:scale-110 transition-transform" />
              <span className="text-sm font-medium text-gray-700">Record Payment</span>
            </button>

            <button
              onClick={() => navigate('/attendance')}
              className="flex flex-col items-center p-4 bg-white rounded-lg border border-blue-200 hover:border-blue-400 hover:shadow-md transition-all group"
            >
              <Calendar className="w-6 h-6 text-blue-600 mb-2 group-hover:scale-110 transition-transform" />
              <span className="text-sm font-medium text-gray-700">Mark Attendance</span>
            </button>

            <button
              onClick={() => navigate('/students/add')}
              className="flex flex-col items-center p-4 bg-white rounded-lg border border-blue-200 hover:border-blue-400 hover:shadow-md transition-all group"
            >
              <UserPlus className="w-6 h-6 text-blue-600 mb-2 group-hover:scale-110 transition-transform" />
              <span className="text-sm font-medium text-gray-700">Add Student</span>
            </button>

            <button
              onClick={() => navigate('/fees/reports')}
              className="flex flex-col items-center p-4 bg-white rounded-lg border border-blue-200 hover:border-blue-400 hover:shadow-md transition-all group"
            >
              <FileText className="w-6 h-6 text-blue-600 mb-2 group-hover:scale-110 transition-transform" />
              <span className="text-sm font-medium text-gray-700">Generate Report</span>
            </button>
          </div>
        </div>

        {/* Footer Stats */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <p className="text-xs text-gray-500 mb-1">Active Enrollments</p>
            <p className="text-xl font-bold text-gray-900">{activeEnrollments}</p>
          </div>
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <p className="text-xs text-gray-500 mb-1">Today's Enrollments</p>
            <p className="text-xl font-bold text-green-600">{todayEnrollments}</p>
          </div>
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <p className="text-xs text-gray-500 mb-1">This Month's Enrollments</p>
            <p className="text-xl font-bold text-purple-600">{monthEnrollments}</p>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;