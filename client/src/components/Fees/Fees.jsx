// src/components/Fees/Fees.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import {
  DollarSign,
  TrendingUp,
  Users,
  CreditCard,
  Calendar,
  RefreshCw,
  Search,
  Filter,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  Wallet,
  Landmark,
  Smartphone,
  AlertCircle,
  Download
} from 'lucide-react';
import Layout from '../Layout/Layout';
import { usePaymentStore } from '../../stores/paymentStore';
import { useAuthStore } from '../../stores/authStore';
import { formatCurrency, getPaymentMethodInfo } from '../../utils/feeFormatter';
import FeeStatsCards from './FeeStatsCards';
import PaymentMethodChart from './PaymentMethodChart';
import OutstandingTable from './OutstandingTable';
import ExportButtons from './ExportButtons';
import toast from 'react-hot-toast';

const Fees = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const {
    payments,
    paymentStats,
    outstandingReport,
    loading,
    fetchPayments,
    fetchPaymentStats,
    fetchOutstandingReport,
    exportPayments
  } = usePaymentStore();

  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [dateRange, setDateRange] = useState('month');
  const [filters, setFilters] = useState({
    paymentMethod: '',
    paymentFor: '',
    status: 'completed'
  });

  // Load initial data
  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    await Promise.all([
      fetchPayments({ limit: 5 }),
      fetchPaymentStats(getDateRangeParams()),
      fetchOutstandingReport()
    ]);
  };

  const getDateRangeParams = () => {
    const end = new Date();
    const start = new Date();

    switch (dateRange) {
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

  const handleExport = async (format, options) => {
    const params = getDateRangeParams();
    const result = await exportPayments({
      ...params,
      format
    });
    if (result.success) {
      toast.success(`Dashboard exported as ${format.toUpperCase()}`);
    }
    return result;
  };

  const handleViewAllPayments = () => {
    navigate('/fees/history');
  };

  const handleViewStudentFees = (studentId) => {
    navigate(`/fees/student/${studentId}`);
  };

  const handleViewCourseFees = (courseId) => {
    navigate(`/fees/course/${courseId}`);
  };

  // FIXED: Navigate to record payment page
  const handleRecordPayment = () => {
    navigate('/fees/record-payment');
  };

  const getPaymentMethodIcon = (method) => {
    const icons = {
      mpesa: Smartphone,
      cooperative_bank: Landmark,
      family_bank: Landmark,
      cash: Wallet,
      other: CreditCard
    };
    const Icon = icons[method] || CreditCard;
    return <Icon className="w-4 h-4" />;
  };

  const stats = paymentStats?.totalStats?.[0] || {
    totalAmount: 0,
    totalPayments: 0,
    averageAmount: 0
  };

  const recentPayments = paymentStats?.recentPayments || [];

  return (
    <Layout>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                <DollarSign className="w-8 h-8 mr-3 text-green-600" />
                Fees & Payments Dashboard
              </h1>
              <p className="mt-2 text-gray-600">
                Manage all fee collections, payments, and outstanding balances
              </p>
            </div>

            <div className="mt-4 sm:mt-0 flex space-x-3">
              <button
                onClick={handleRefresh}
                disabled={loading}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 transition-colors"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </button>

              <ExportButtons
                data={recentPayments}
                filename="fee_dashboard"
                formats={['csv', 'excel', 'pdf', 'print', 'email']}
                onExport={handleExport}
                includeDateRange={true}
                includeFilters={true}
                customHeaders={['Date', 'Student', 'Course', 'Amount', 'Method', 'Status']}
                customFormatter={(payment, format) => {
                  if (format === 'csv') {
                    return [
                      new Date(payment.paymentDate).toLocaleDateString(),
                      payment.studentName,
                      `${payment.courseCode} - ${payment.courseName}`,
                      payment.amount,
                      payment.paymentMethodDisplay,
                      payment.status
                    ];
                  }
                  return payment;
                }}
                buttonStyle="default"
                buttonText="Export"
              />

              <button
                onClick={handleRecordPayment}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg text-sm font-medium text-white bg-gradient-to-r from-green-600 to-emerald-700 hover:from-green-700 hover:to-emerald-800 transition-all shadow-sm hover:shadow-md"
              >
                <Plus className="w-4 h-4 mr-2" />
                Record Payment
              </button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <FeeStatsCards 
          stats={stats}
          outstandingTotal={outstandingReport?.summary?.totalOutstanding || 0}
          outstandingCount={outstandingReport?.summary?.totalStudents || 0}
          dateRange={dateRange}
          onDateRangeChange={setDateRange}
        />

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
          {/* Left Column - Charts (2/3 width) */}
          <div className="lg:col-span-2 space-y-6">
            {/* Payment Method Chart */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Payment Methods
                </h3>
                <button
                  onClick={() => navigate('/fees/reports')}
                  className="text-sm text-green-600 hover:text-green-700"
                >
                  View Details →
                </button>
              </div>
              <PaymentMethodChart data={paymentStats?.byMethod || []} />
            </div>

            {/* Recent Payments */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                    <CreditCard className="w-5 h-5 mr-2 text-green-600" />
                    Recent Payments
                  </h3>
                  <button
                    onClick={handleViewAllPayments}
                    className="text-sm text-green-600 hover:text-green-700"
                  >
                    View All
                  </button>
                </div>
              </div>

              <div className="divide-y divide-gray-200">
                {recentPayments.length > 0 ? (
                  recentPayments.map((payment, index) => {
                    const methodInfo = getPaymentMethodInfo(payment.paymentMethod);
                    return (
                      <div key={index} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className={`p-2 rounded-lg ${methodInfo.bgColor}`}>
                              {getPaymentMethodIcon(payment.paymentMethod)}
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-900">
                                {payment.studentName}
                              </p>
                              <p className="text-xs text-gray-500">
                                {payment.courseCode} • {payment.courseName}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-bold text-gray-900">
                              {formatCurrency(payment.amount)}
                            </p>
                            <p className="text-xs text-gray-500">
                              {new Date(payment.paymentDate).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="px-6 py-8 text-center text-gray-500">
                    No recent payments
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column - Outstanding (1/3 width) */}
          <div className="space-y-6">
            {/* Outstanding Summary Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <AlertCircle className="w-5 h-5 mr-2 text-orange-500" />
                Outstanding Balances
              </h3>

              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Total Outstanding</span>
                  <span className="text-xl font-bold text-orange-600">
                    {formatCurrency(outstandingReport?.summary?.totalOutstanding || 0)}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Students with Balance</span>
                  <span className="text-lg font-semibold text-gray-900">
                    {outstandingReport?.summary?.totalStudents || 0}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Average Outstanding</span>
                  <span className="text-lg font-semibold text-gray-900">
                    {formatCurrency(outstandingReport?.summary?.averageOutstanding || 0)}
                  </span>
                </div>

                <div className="pt-4 border-t border-gray-200">
                  <button
                    onClick={() => navigate('/fees/reports')}
                    className="w-full px-4 py-2 bg-orange-600 text-white text-sm font-medium rounded-lg hover:bg-orange-700 transition-colors"
                  >
                    View Outstanding Report
                  </button>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200 p-6">
              <h3 className="text-sm font-medium text-green-800 mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <button
                  onClick={handleRecordPayment}
                  className="w-full flex items-center justify-center px-4 py-2 bg-white border border-green-300 rounded-lg text-sm font-medium text-green-700 hover:bg-green-50 transition-colors"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Record New Payment
                </button>

                <button
                  onClick={() => navigate('/fees/reports')}
                  className="w-full flex items-center justify-center px-4 py-2 bg-white border border-green-300 rounded-lg text-sm font-medium text-green-700 hover:bg-green-50 transition-colors"
                >
                  <TrendingUp className="w-4 h-4 mr-2" />
                  Generate Report
                </button>
              </div>
            </div>

            {/* Payment Method Summary */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-sm font-medium text-gray-700 mb-3">Today's Collections</h3>
              <div className="space-y-2">
                {paymentStats?.byMethod?.slice(0, 3).map((method, index) => {
                  const methodInfo = getPaymentMethodInfo(method.method);
                  return (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className={`w-2 h-2 rounded-full bg-${methodInfo.color}-500`}></div>
                        <span className="text-sm text-gray-600">{methodInfo.label}</span>
                      </div>
                      <span className="text-sm font-medium text-gray-900">
                        {formatCurrency(method.total)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Outstanding Table */}
        <div className="mt-6">
          <OutstandingTable 
            students={outstandingReport?.students || []}
            loading={loading}
            onViewStudent={handleViewStudentFees}
            onViewCourse={handleViewCourseFees}
            onRecordPayment={(student) => {
              // Navigate to record payment with student pre-selected
              const params = new URLSearchParams();
              params.append('studentId', student.studentId);
              navigate(`/fees/record-payment?${params.toString()}`);
            }}
          />
        </div>
      </div>
    </Layout>
  );
};

export default Fees;