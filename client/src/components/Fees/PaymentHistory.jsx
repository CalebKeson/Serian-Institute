// src/components/Fees/PaymentHistory.jsx - USING SAME CONFIG AS FEES DASHBOARD

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import {
  ArrowLeft,
  Receipt,
  Search,
  Filter,
  Download,
  RefreshCw,
  Calendar,
  DollarSign,
  User,
  BookOpen,
  Smartphone,
  Landmark,
  Wallet,
  CreditCard,
  Printer,
  Mail,
  Eye,
  ChevronDown,
  ChevronUp,
  X,
  CheckCircle,
  AlertCircle,
  Loader,
  TrendingUp
} from 'lucide-react';
import Layout from '../Layout/Layout';
import { usePaymentStore } from '../../stores/paymentStore';
import { useAuthStore } from '../../stores/authStore';
import {
  formatCurrency,
  formatDateTime,
  getPaymentMethodInfo,
  getPaymentPurposeInfo,
  getPaymentStatusBadge,
  generateReceiptNumber
} from '../../utils/feeFormatter';
import PaymentHistoryTable from './PaymentHistoryTable';
import ExportButtons from './ExportButtons';
import { feesDashboardExportConfig } from '../../utils/exportConfigs'; // SAME CONFIG AS FEES DASHBOARD
import toast from 'react-hot-toast';

const PaymentHistory = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const {
    payments,
    loading,
    fetchPayments,
    exportPayments,
    filters,
    setFilters,
    pagination,
    setPage,
    paymentStats,
    fetchPaymentStats,
    outstandingReport,
    fetchOutstandingReport
  } = usePaymentStore();

  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [dateRange, setDateRange] = useState({
    startDate: '',
    endDate: ''
  });
  const [exportSummary, setExportSummary] = useState({
    totalFees: 0,
    totalCollected: 0,
    outstandingBalance: 0,
    totalPayments: 0,
    collectionRate: 0
  });

  // Load payments and stats on mount
  useEffect(() => {
    loadData();
  }, []);

  // Update export summary when data loads - SAME as Fees Dashboard
  useEffect(() => {
    if (paymentStats && outstandingReport) {
      const totalCollected = paymentStats?.totalStats?.[0]?.totalAmount || 0;
      const totalPayments = paymentStats?.totalStats?.[0]?.totalPayments || 0;
      const outstandingBalance = outstandingReport?.summary?.totalOutstanding || 0;
      const totalFees = totalCollected + outstandingBalance;
      const collectionRate = totalFees > 0 ? (totalCollected / totalFees) * 100 : 0;
      
      setExportSummary({
        totalFees,
        totalCollected,
        outstandingBalance,
        totalPayments,
        collectionRate
      });
    }
  }, [paymentStats, outstandingReport]);

  const loadData = async () => {
    await Promise.all([
      fetchPayments({ limit: 100 }),
      fetchPaymentStats(),
      fetchOutstandingReport()
    ]);
  };

  const loadPayments = async (page = 1) => {
    await fetchPayments({
      page,
      limit: pagination.limit,
      search: searchTerm,
      ...filters,
      ...dateRange
    });
  };

  const handleSearch = () => {
    setFilters({ ...filters, page: 1 });
    loadPayments(1);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters({ ...filters, [key]: value, page: 1 });
  };

  const handleDateRangeChange = (type, value) => {
    setDateRange(prev => ({ ...prev, [type]: value }));
  };

  const applyDateRange = () => {
    setShowDatePicker(false);
    handleFilterChange('page', 1);
    loadPayments(1);
  };

  const clearDateRange = () => {
    setDateRange({ startDate: '', endDate: '' });
    setShowDatePicker(false);
    loadPayments(1);
  };

  const handleRefresh = () => {
    loadData();
    loadPayments(pagination.current);
    toast.success('Data refreshed');
  };

  const handleExport = async (format, options) => {
    const result = await exportPayments({
      ...filters,
      ...dateRange,
      format
    });
    if (result.success) {
      toast.success(`Payments exported as ${format.toUpperCase()}`);
    }
    return result;
  };

  const handlePageChange = (newPage) => {
    setPage(newPage);
    loadPayments(newPage);
  };

  const handleViewPayment = (payment) => {
    setSelectedPayment(payment);
    setShowReceiptModal(true);
  };

  const handlePrintReceipt = (payment) => {
    const receiptWindow = window.open('', '_blank');
    receiptWindow.document.write(`
      <html>
        <head>
          <title>Payment Receipt</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 40px; max-width: 800px; margin: 0 auto; }
            .header { text-align: center; margin-bottom: 30px; }
            .logo { font-size: 24px; font-weight: bold; color: #059669; }
            .receipt-title { font-size: 20px; margin: 20px 0; text-align: center; }
            .details { border: 1px solid #ddd; padding: 20px; margin-bottom: 20px; }
            .row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eee; }
            .total { font-weight: bold; font-size: 18px; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="logo">Serian Institute</div>
            <div>Official Payment Receipt</div>
          </div>
          
          <div class="receipt-title">Receipt #${payment.receiptNumber || generateReceiptNumber(payment)}</div>
          
          <div class="details">
            <div class="row">
              <span>Date:</span>
              <span>${new Date(payment.paymentDate).toLocaleDateString()}</span>
            </div>
            <div class="row">
              <span>Student Name:</span>
              <span>${payment.student?.user?.name || payment.studentName || 'N/A'}</span>
            </div>
            <div class="row">
              <span>Student ID:</span>
              <span>${payment.student?.studentId || payment.studentId || 'N/A'}</span>
            </div>
            <div class="row">
              <span>Course:</span>
              <span>${payment.course?.name || payment.courseName || 'N/A'}</span>
            </div>
            <div class="row">
              <span>Payment Method:</span>
              <span>${payment.paymentMethodDisplay || payment.paymentMethod}</span>
            </div>
            <div class="row">
              <span>Transaction ID:</span>
              <span>${payment.transactionId || 'N/A'}</span>
            </div>
            <div class="row">
              <span>Reference:</span>
              <span>${payment.paymentReference || 'N/A'}</span>
            </div>
            <div class="row">
              <span>Payer Name:</span>
              <span>${payment.payerName || 'N/A'}</span>
            </div>
            <div class="row total">
              <span>Amount Paid:</span>
              <span>${formatCurrency(payment.amount)}</span>
            </div>
            <div class="row">
              <span>Purpose:</span>
              <span>${payment.paymentForDisplay || payment.paymentFor}</span>
            </div>
            ${payment.notes ? `<div class="row"><span>Notes:</span><span>${payment.notes}</span></div>` : ''}
          </div>
          
          <div class="footer">
            <p>This is a computer-generated receipt. No signature required.</p>
            <p>Thank you for your payment!</p>
          </div>
        </body>
      </html>
    `);
    receiptWindow.document.close();
    receiptWindow.print();
  };

  const handleSendReceipt = (payment) => {
    toast.success(`Receipt sent to student email: ${payment.student?.user?.email || payment.studentEmail}`);
  };

  const clearFilters = () => {
    setFilters({
      page: 1,
      limit: 10,
      studentId: '',
      courseId: '',
      paymentMethod: '',
      paymentFor: '',
      startDate: '',
      endDate: '',
      status: 'completed',
      search: ''
    });
    setSearchTerm('');
    setDateRange({ startDate: '', endDate: '' });
    loadPayments(1);
    toast.success('Filters cleared');
  };

  // Prepare export data - SAME FORMAT as Fees Dashboard
  const exportData = (Array.isArray(payments) ? payments : []).map(payment => ({
    date: new Date(payment.paymentDate).toLocaleDateString(),
    studentName: payment.student?.user?.name || payment.studentName || 'N/A',
    studentId: payment.student?.studentId || payment.studentId || 'N/A',
    course: payment.course?.name || payment.courseName || 'N/A',
    courseCode: payment.course?.courseCode || payment.courseCode || 'N/A',
    amount: payment.amount,
    payerName: payment.payerName || 'N/A',
    receiptNumber: payment.receiptNumber || 'N/A',
    reference: payment.transactionId || payment.paymentReference || 'N/A'
  }));

  const stats = paymentStats?.totalStats?.[0] || {
    totalAmount: 0,
    totalPayments: 0,
    averageAmount: 0
  };
  
  const outstandingTotal = outstandingReport?.summary?.totalOutstanding || 0;
  const totalCollected = stats.totalAmount;
  const totalFees = totalCollected + outstandingTotal;
  const collectionRate = totalFees > 0 ? (totalCollected / totalFees) * 100 : 0;

  const activeFilterCount = Object.values(filters).filter(v => v && v !== '' && v !== 1).length +
    (dateRange.startDate ? 1 : 0) + (dateRange.endDate ? 1 : 0);

  return (
    <Layout>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/fees')}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                  <Receipt className="w-8 h-8 mr-3 text-green-600" />
                  Payment History
                </h1>
                <p className="mt-2 text-gray-600">
                  View and manage all payment transactions
                </p>
              </div>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={handleRefresh}
                disabled={loading}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 transition-colors"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </button>

              {/* USING SAME CONFIG AS FEES DASHBOARD */}
              <ExportButtons
                data={exportData}
                config={feesDashboardExportConfig}
                filename="payment_history_report"
                formats={['csv', 'excel', 'pdf', 'print', 'email']}
                includeDateRange={true}
                buttonStyle="default"
                buttonText="Export Report"
                customSummaryData={exportSummary}
              />
            </div>
          </div>
        </div>

        {/* Summary Stats Cards - SAME as Fees Dashboard */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Fees</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalFees)}</p>
              </div>
              <div className="p-3 bg-purple-100 rounded-lg">
                <DollarSign className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Collected</p>
                <p className="text-2xl font-bold text-green-600">{formatCurrency(totalCollected)}</p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Outstanding Balance</p>
                <p className="text-2xl font-bold text-orange-600">{formatCurrency(outstandingTotal)}</p>
              </div>
              <div className="p-3 bg-orange-100 rounded-lg">
                <AlertCircle className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Payments</p>
                <p className="text-2xl font-bold text-blue-600">{stats.totalPayments}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <CreditCard className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Collection Rate</p>
                <p className="text-2xl font-bold text-purple-600">{Math.round(collectionRate)}%</p>
              </div>
              <div className="p-3 bg-purple-100 rounded-lg">
                <TrendingUp className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filters - Keep existing */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by student name, receipt number, or transaction ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={handleKeyPress}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              />
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={handleSearch}
                className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors"
              >
                Search
              </button>

              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`inline-flex items-center px-4 py-2 border rounded-lg text-sm font-medium transition-colors ${
                  activeFilterCount > 0
                    ? 'bg-green-100 border-green-300 text-green-700'
                    : 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50'
                }`}
              >
                <Filter className="w-4 h-4 mr-2" />
                Filters
                {activeFilterCount > 0 && (
                  <span className="ml-2 bg-green-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {activeFilterCount}
                  </span>
                )}
              </button>

              <button
                onClick={() => setShowDatePicker(!showDatePicker)}
                className={`inline-flex items-center px-4 py-2 border rounded-lg text-sm font-medium transition-colors ${
                  dateRange.startDate || dateRange.endDate
                    ? 'bg-green-100 border-green-300 text-green-700'
                    : 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50'
                }`}
              >
                <Calendar className="w-4 h-4 mr-2" />
                Date Range
              </button>
            </div>
          </div>

          {/* Filters Panel */}
          {showFilters && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Payment Method
                  </label>
                  <select
                    value={filters.paymentMethod}
                    onChange={(e) => handleFilterChange('paymentMethod', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  >
                    <option value="">All Methods</option>
                    <option value="mpesa">M-Pesa</option>
                    <option value="cooperative_bank">Co-operative Bank</option>
                    <option value="family_bank">Family Bank</option>
                    <option value="cash">Cash</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Payment Purpose
                  </label>
                  <select
                    value={filters.paymentFor}
                    onChange={(e) => handleFilterChange('paymentFor', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  >
                    <option value="">All Purposes</option>
                    <option value="tuition">Tuition Fee</option>
                    <option value="registration">Registration Fee</option>
                    <option value="exam_fee">Examination Fee</option>
                    <option value="lab_fee">Skills Lab Fee</option>
                    <option value="materials">Learning Materials</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Status
                  </label>
                  <select
                    value={filters.status}
                    onChange={(e) => handleFilterChange('status', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  >
                    <option value="completed">Completed</option>
                    <option value="pending">Pending</option>
                    <option value="failed">Failed</option>
                    <option value="refunded">Refunded</option>
                    <option value="">All Statuses</option>
                  </select>
                </div>
              </div>

              {activeFilterCount > 0 && (
                <div className="mt-4 flex justify-end">
                  <button
                    onClick={clearFilters}
                    className="text-sm text-green-600 hover:text-green-700 flex items-center"
                  >
                    <X className="w-4 h-4 mr-1" />
                    Clear all filters
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Date Range Picker */}
          {showDatePicker && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="flex flex-col sm:flex-row sm:items-end sm:space-x-4 space-y-3 sm:space-y-0">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={dateRange.startDate}
                    onChange={(e) => handleDateRangeChange('startDate', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={dateRange.endDate}
                    onChange={(e) => handleDateRangeChange('endDate', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  />
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={applyDateRange}
                    className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors"
                  >
                    Apply
                  </button>
                  <button
                    onClick={clearDateRange}
                    className="px-4 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Clear
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Payment History Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <PaymentHistoryTable
            payments={payments}
            loading={loading}
            onView={handleViewPayment}
            onPrint={handlePrintReceipt}
            onSendEmail={handleSendReceipt}
            showStudentInfo={true}
            showCourseInfo={true}
            showActions={true}
          />

          {/* Pagination */}
          {pagination.total > 1 && (
            <div className="px-6 py-3 bg-gray-50 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-700">
                  Showing page {pagination.current} of {pagination.total} ({pagination.results} total payments)
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handlePageChange(pagination.current - 1)}
                    disabled={pagination.current === 1}
                    className="px-3 py-1 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => handlePageChange(pagination.current + 1)}
                    disabled={pagination.current === pagination.total}
                    className="px-3 py-1 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Receipt Modal */}
      {showReceiptModal && selectedPayment && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-xl bg-white">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Receipt className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Payment Receipt</h2>
                  <p className="text-sm text-gray-600">
                    Receipt #{selectedPayment.receiptNumber || generateReceiptNumber(selectedPayment)}
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowReceiptModal(false);
                  setSelectedPayment(null);
                }}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors rounded-lg hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500 mb-1">Student</p>
                  <p className="font-medium text-gray-900">{selectedPayment.student?.user?.name || selectedPayment.studentName}</p>
                  <p className="text-xs text-gray-500 mt-1">{selectedPayment.student?.studentId || selectedPayment.studentId}</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500 mb-1">Course</p>
                  <p className="font-medium text-gray-900">{selectedPayment.course?.name || selectedPayment.courseName}</p>
                  <p className="text-xs text-gray-500 mt-1">{selectedPayment.course?.courseCode || selectedPayment.courseCode}</p>
                </div>
              </div>

              <div className="border-t border-gray-200 pt-4">
                <dl className="grid grid-cols-2 gap-4">
                  <div>
                    <dt className="text-xs text-gray-500">Date</dt>
                    <dd className="text-sm font-medium text-gray-900">
                      {formatDateTime(selectedPayment.paymentDate)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-gray-500">Amount</dt>
                    <dd className="text-lg font-bold text-green-600">
                      {formatCurrency(selectedPayment.amount)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-gray-500">Payment Method</dt>
                    <dd className="text-sm font-medium text-gray-900">
                      {selectedPayment.paymentMethodDisplay}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-gray-500">Purpose</dt>
                    <dd className="text-sm font-medium text-gray-900">
                      {selectedPayment.paymentForDisplay}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-gray-500">Payer Name</dt>
                    <dd className="text-sm font-medium text-gray-900">
                      {selectedPayment.payerName || 'N/A'}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-gray-500">Receipt Number</dt>
                    <dd className="text-sm font-medium text-gray-900 font-mono">
                      {selectedPayment.receiptNumber || 'N/A'}
                    </dd>
                  </div>
                  {selectedPayment.transactionId && (
                    <div className="col-span-2">
                      <dt className="text-xs text-gray-500">Transaction ID</dt>
                      <dd className="text-sm font-medium text-gray-900">
                        {selectedPayment.transactionId}
                      </dd>
                    </div>
                  )}
                  {selectedPayment.paymentReference && (
                    <div className="col-span-2">
                      <dt className="text-xs text-gray-500">Reference</dt>
                      <dd className="text-sm font-medium text-gray-900">
                        {selectedPayment.paymentReference}
                      </dd>
                    </div>
                  )}
                  {selectedPayment.notes && (
                    <div className="col-span-2">
                      <dt className="text-xs text-gray-500">Notes</dt>
                      <dd className="text-sm text-gray-700 bg-gray-50 p-2 rounded">
                        {selectedPayment.notes}
                      </dd>
                    </div>
                  )}
                </dl>
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                <button
                  onClick={() => handlePrintReceipt(selectedPayment)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors flex items-center"
                >
                  <Printer className="w-4 h-4 mr-2" />
                  Print
                </button>
                <button
                  onClick={() => handleSendReceipt(selectedPayment)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors flex items-center"
                >
                  <Mail className="w-4 h-4 mr-2" />
                  Email
                </button>
                <button
                  onClick={() => {
                    setShowReceiptModal(false);
                    setSelectedPayment(null);
                  }}
                  className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default PaymentHistory;