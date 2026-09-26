// src/components/Fees/FeeReports.jsx - COMPLETE FIXED VERSION

import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router';
import {
  ArrowLeft,
  FileText,
  Download,
  Calendar,
  TrendingUp,
  PieChart,
  BarChart3,
  Users,
  DollarSign,
  RefreshCw,
  Filter,
  ChevronDown,
  ChevronUp,
  Printer,
  Mail,
  Loader,
  AlertCircle,
  CheckCircle,
  XCircle,
  CreditCard,
  Wallet,
  Landmark,
  Smartphone,
  X
} from 'lucide-react';
import { usePaymentStore } from '../../stores/paymentStore';
import { useAuthStore } from '../../stores/authStore';
import {
  formatCurrency,
  formatDate,
  getPaymentMethodInfo,
  getPaymentPurposeInfo,
  prepareMethodChartData,
  preparePurposeChartData,
  prepareDailyTrendData,
  prepareMonthlyTrendData
} from '../../utils/feeFormatter';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart as RePieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import ExportButtons from './ExportButtons';
import { outstandingReportExportConfig, feesDashboardExportConfig } from '../../utils/exportConfigs';
import PaymentHistoryTable from './PaymentHistoryTable';
import toast from 'react-hot-toast';

// Chart colors
const CHART_COLORS = {
  mpesa: '#10b981',
  cooperative_bank: '#3b82f6',
  family_bank: '#8b5cf6',
  cash: '#f59e0b',
  bank_transfer: '#06b6d4',
  other: '#6b7280'
};

const FeeReports = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const {
    paymentStats,
    outstandingReport,
    collectionReport,
    loading,
    fetchPaymentStats,
    fetchOutstandingReport,
    fetchCollectionReport,
    exportPayments
  } = usePaymentStore();

  const [reportType, setReportType] = useState('collection');
  const [dateRange, setDateRange] = useState('all');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [groupBy, setGroupBy] = useState('day');
  const [expandedSections, setExpandedSections] = useState({
    summary: true,
    charts: true,
    details: true,
    payments: true
  });
  const [chartType, setChartType] = useState('line');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [exportSummary, setExportSummary] = useState({
    totalFees: 0,
    totalCollected: 0,
    outstandingBalance: 0,
    totalPayments: 0,
    collectionRate: 0
  });
  const [outstandingExportSummary, setOutstandingExportSummary] = useState({
    totalFees: 0,
    totalOutstanding: 0,
    totalPaid: 0,
    studentsWithBalance: 0,
    unpaidStudents: 0,
    fullyPaidStudents: 0
  });

  // Load reports on mount - only load outstanding report by default
  useEffect(() => {
    loadReports();
  }, []);

  // Update export summaries when data loads
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

  // Update outstanding export summary
  useEffect(() => {
    if (outstandingReport?.summary) {
      const summary = outstandingReport.summary;
      const studentsWithBalance = outstandingReport.students?.filter(s => s.totalBalance > 0) || [];
      const fullyPaidStudents = outstandingReport.students?.filter(s => s.totalBalance === 0) || [];
      
      setOutstandingExportSummary({
        totalFees: summary.totalFees || 0,
        totalOutstanding: summary.totalOutstanding || 0,
        totalPaid: summary.totalPaid || 0,
        studentsWithBalance: studentsWithBalance.length,
        unpaidStudents: summary.unpaidCount || 0,
        fullyPaidStudents: fullyPaidStudents.length
      });
    }
  }, [outstandingReport]);

  const loadReports = async () => {
    try {
      // Always fetch outstanding report - it doesn't need date params
      await fetchOutstandingReport();

      // For collection report, only fetch if we have valid date range
      if (reportType === 'collection') {
        const { startDate, endDate } = getDateRangeParams();
        
        // Only fetch collection report if we have valid dates or custom range
        if (dateRange === 'custom' && startDate && endDate) {
          await fetchCollectionReport({ startDate, endDate, groupBy });
          await fetchPaymentStats({ startDate, endDate });
        } else if (dateRange !== 'all' && dateRange !== 'custom') {
          // Predefined date range (today, week, month, etc.)
          await fetchCollectionReport({ startDate, endDate, groupBy });
          await fetchPaymentStats({ startDate, endDate });
        } else {
          // 'all' date range - fetch all payment stats without date filter
          await fetchPaymentStats({});
        }
      } else if (reportType === 'outstanding') {
        // Already fetched above
      } else if (reportType === 'method' || reportType === 'trend') {
        const { startDate, endDate } = getDateRangeParams();
        if (dateRange === 'custom' && startDate && endDate) {
          await fetchPaymentStats({ startDate, endDate });
        } else if (dateRange !== 'all' && dateRange !== 'custom') {
          await fetchPaymentStats({ startDate, endDate });
        } else {
          await fetchPaymentStats({});
        }
      }
    } catch (error) {
      console.error('Error loading reports:', error);
      // Don't show toast for "all" date range
      if (dateRange !== 'all') {
        toast.error('Failed to load report data');
      }
    }
  };

  const getDateRangeParams = () => {
    // For 'all' date range, return empty - we'll handle it differently
    if (dateRange === 'all') {
      return { startDate: '', endDate: '' };
    }

    if (dateRange === 'custom') {
      return {
        startDate: customStartDate,
        endDate: customEndDate
      };
    }

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
        return { startDate: '', endDate: '' };
    }

    return {
      startDate: start.toISOString().split('T')[0],
      endDate: end.toISOString().split('T')[0]
    };
  };

  const handleRefresh = () => {
    loadReports();
    toast.success('Reports refreshed');
  };

  const handleReportTypeChange = (type) => {
    setReportType(type);
    if (type === 'outstanding') {
      setDateRange('all');
      setCustomStartDate('');
      setCustomEndDate('');
    }
    loadReports();
  };

  const handleDateRangeChange = (range) => {
    setDateRange(range);
    if (range === 'all') {
      setCustomStartDate('');
      setCustomEndDate('');
      setShowDatePicker(false);
      // Reload with all data
      loadReports();
    } else if (range === 'custom') {
      setShowDatePicker(true);
    } else {
      setShowDatePicker(false);
      loadReports();
    }
  };

  const handleCustomDateApply = () => {
    setShowDatePicker(false);
    if (customStartDate && customEndDate) {
      loadReports();
    } else {
      toast.warning('Please select both start and end dates');
    }
  };

  const handleCustomDateClear = () => {
    setCustomStartDate('');
    setCustomEndDate('');
    setDateRange('all');
    setShowDatePicker(false);
    loadReports();
  };

  const handleExport = async (format, options) => {
    const { startDate, endDate } = getDateRangeParams();
    
    let result;
    if (reportType === 'collection') {
      // Only export collection report if we have valid dates
      if (dateRange === 'all') {
        toast.info('Please select a date range to export collection report');
        return { success: false };
      }
      result = await exportPayments({ 
        startDate, 
        endDate, 
        format,
        type: 'collection'
      });
    } else if (reportType === 'outstanding') {
      result = await exportPayments({ 
        format,
        type: 'outstanding'
      });
    } else {
      result = await exportPayments({ 
        startDate, 
        endDate, 
        format,
        type: reportType
      });
    }

    if (result?.success) {
      toast.success(`Report exported as ${format.toUpperCase()}`);
    }
    return result;
  };

  const handlePrint = () => {
    window.print();
  };

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // Prepare chart data with proper colors
  const prepareMethodChartDataWithColors = (data) => {
    if (!data || !Array.isArray(data)) return [];
    return data.map(item => ({
      name: item.methodDisplay || item.method,
      value: item.total,
      method: item.method,
      color: CHART_COLORS[item.method] || '#6b7280'
    }));
  };

  const methodChartData = prepareMethodChartDataWithColors(paymentStats?.byMethod);
  const purposeChartData = preparePurposeChartData(paymentStats?.byPurpose);
  const dailyTrendData = prepareDailyTrendData(paymentStats?.byDay);
  const monthlyTrendData = prepareMonthlyTrendData(paymentStats?.byMonth);

  // Get recent payments from paymentStats
  const recentPayments = paymentStats?.recentPayments || [];

  // Prepare export data for Collection Report
  const collectionExportData = recentPayments.map(payment => ({
    date: new Date(payment.paymentDate).toLocaleDateString(),
    studentName: payment.studentName || payment.student?.user?.name || 'N/A',
    studentId: payment.studentId || payment.student?.studentId || 'N/A',
    course: payment.courseName || payment.course?.name || 'N/A',
    courseCode: payment.courseCode || payment.course?.courseCode || 'N/A',
    amount: payment.amount,
    payerName: payment.payerName || 'N/A',
    receiptNumber: payment.receiptNumber || 'N/A',
    reference: payment.transactionId || payment.paymentReference || 'N/A'
  })) || [];

  // Prepare export data for Outstanding Report
  const outstandingExportData = outstandingReport?.students
    ?.filter(student => student.totalBalance > 0)
    .map(student => ({
      studentName: student.studentName || 'N/A',
      studentId: student.studentNumber || student.studentId || 'N/A',
      phone: student.phone || 'N/A',
      course: student.courses?.map(c => `${c.courseName} (${c.courseCode})`).join(', ') || 'N/A',
      totalFees: student.totalFees || 0,
      totalPaid: student.totalPaid || 0,
      balance: student.totalBalance || 0,
      progress: `${student.paymentPercentage || 0}%`
    })) || [];

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="text-sm font-medium text-gray-900 mb-2">{label}</p>
          {payload.map((entry, index) => (
            <div key={index} className="flex items-center justify-between text-xs mb-1">
              <span style={{ color: entry.color }}>{entry.name}:</span>
              <span className="font-medium ml-4">{formatCurrency(entry.value)}</span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  const dateRangeOptions = [
    { value: 'all', label: 'All Time (Stats Only)' },
    { value: 'today', label: 'Today' },
    { value: 'week', label: 'Last 7 Days' },
    { value: 'month', label: 'Last 30 Days' },
    { value: 'quarter', label: 'Last 3 Months' },
    { value: 'year', label: 'Last Year' },
    { value: 'custom', label: 'Custom Range' }
  ];

  const reportTypes = [
    { id: 'collection', label: 'Collection Report' },
    { id: 'outstanding', label: 'Outstanding Report' },
    { id: 'method', label: 'Payment Method Analysis' },
    { id: 'trend', label: 'Trend Analysis' }
  ];

  // Calculate outstanding stats correctly
  const outstandingStudents = outstandingReport?.students?.filter(s => s.totalBalance > 0) || [];
  const fullyPaidStudents = outstandingReport?.students?.filter(s => s.totalBalance === 0) || [];

  if (loading) {
    return (
      <>
        <div className="flex items-center justify-center min-h-96">
          <div className="text-center">
            <Loader className="w-12 h-12 animate-spin text-green-600 mx-auto mb-4" />
            <p className="text-gray-600">Loading report data...</p>
          </div>
        </div>
      </>
    );
  }

  const currentConfig = reportType === 'outstanding' ? outstandingReportExportConfig : feesDashboardExportConfig;
  const currentExportData = reportType === 'outstanding' ? outstandingExportData : collectionExportData;
  const currentExportSummary = reportType === 'outstanding' ? outstandingExportSummary : exportSummary;

  return (
    <>
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
                  <FileText className="w-8 h-8 mr-3 text-green-600" />
                  Fee Reports
                </h1>
                <p className="mt-2 text-gray-600">
                  Generate and analyze fee collection reports
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

              <button
                onClick={handlePrint}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
              >
                <Printer className="w-4 h-4 mr-2" />
                Print
              </button>

              <ExportButtons
                data={currentExportData}
                config={currentConfig}
                filename={reportType === 'outstanding' ? 'outstanding_report' : 'collection_report'}
                formats={['csv', 'excel', 'pdf', 'print', 'email']}
                includeDateRange={reportType !== 'outstanding' && dateRange !== 'all'}
                buttonStyle="default"
                buttonText="Export Report"
                customSummaryData={currentExportSummary}
              />
            </div>
          </div>
        </div>

        {/* Report Controls */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Report Type
              </label>
              <select
                value={reportType}
                onChange={(e) => handleReportTypeChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              >
                {reportTypes.map(type => (
                  <option key={type.id} value={type.id}>{type.label}</option>
                ))}
              </select>
            </div>

            {reportType !== 'outstanding' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date Range
                </label>
                <select
                  value={dateRange}
                  onChange={(e) => handleDateRangeChange(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                >
                  {dateRangeOptions.map(option => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>
            )}

            {dateRange === 'custom' && reportType !== 'outstanding' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={customStartDate}
                    onChange={(e) => setCustomStartDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  />
                </div>
                <div className="flex items-end space-x-2">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      End Date
                    </label>
                    <input
                      type="date"
                      value={customEndDate}
                      onChange={(e) => setCustomEndDate(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    />
                  </div>
                  <button
                    onClick={handleCustomDateApply}
                    className="px-3 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors whitespace-nowrap"
                  >
                    Apply
                  </button>
                  <button
                    onClick={handleCustomDateClear}
                    className="px-3 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors whitespace-nowrap"
                  >
                    Clear
                  </button>
                </div>
              </>
            )}

            {reportType === 'collection' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Group By
                </label>
                <select
                  value={groupBy}
                  onChange={(e) => setGroupBy(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                >
                  <option value="day">Day</option>
                  <option value="week">Week</option>
                  <option value="month">Month</option>
                </select>
              </div>
            )}
          </div>

          {dateRange === 'all' && reportType !== 'outstanding' && (
            <div className="mt-3 p-2 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-700 flex items-center">
                <AlertCircle className="w-4 h-4 mr-2" />
                Showing <strong>summary statistics</strong> only. Select a date range to see detailed collection data.
              </p>
            </div>
          )}
        </div>

        {/* Summary Section - Collection Report */}
        {reportType === 'collection' && paymentStats?.totalStats?.[0] && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-6">
            <button
              onClick={() => toggleSection('summary')}
              className="w-full px-6 py-4 flex items-center justify-between bg-gray-50 hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-center space-x-2">
                <DollarSign className="w-5 h-5 text-green-600" />
                <span className="font-medium text-gray-900">Collection Summary</span>
              </div>
              {expandedSections.summary ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </button>

            {expandedSections.summary && (
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
                  <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-lg p-4">
                    <p className="text-sm text-purple-600 mb-1">Total Fees</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {formatCurrency(exportSummary.totalFees)}
                    </p>
                  </div>
                  <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-4">
                    <p className="text-sm text-green-600 mb-1">Total Collected</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {formatCurrency(exportSummary.totalCollected)}
                    </p>
                  </div>
                  <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-lg p-4">
                    <p className="text-sm text-orange-600 mb-1">Outstanding Balance</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {formatCurrency(exportSummary.outstandingBalance)}
                    </p>
                  </div>
                  <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-lg p-4">
                    <p className="text-sm text-blue-600 mb-1">Total Payments</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {exportSummary.totalPayments}
                    </p>
                  </div>
                  <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg p-4">
                    <p className="text-sm text-purple-600 mb-1">Collection Rate</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {Math.round(exportSummary.collectionRate)}%
                    </p>
                  </div>
                </div>

                <div className="mt-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">Collection Progress</span>
                    <span className="text-sm font-medium text-gray-900">
                      {formatCurrency(exportSummary.totalCollected)} / {formatCurrency(exportSummary.totalFees)} ({Math.round(exportSummary.collectionRate)}%)
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className="h-3 rounded-full bg-gradient-to-r from-green-500 to-emerald-500 transition-all duration-500"
                      style={{ width: `${Math.min(100, exportSummary.collectionRate)}%` }}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Summary Section - Outstanding Report */}
        {reportType === 'outstanding' && outstandingReport?.summary && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-6">
            <button
              onClick={() => toggleSection('summary')}
              className="w-full px-6 py-4 flex items-center justify-between bg-gray-50 hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-center space-x-2">
                <AlertCircle className="w-5 h-5 text-orange-600" />
                <span className="font-medium text-gray-900">Outstanding Summary</span>
              </div>
              {expandedSections.summary ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </button>

            {expandedSections.summary && (
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
                  <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-lg p-4">
                    <p className="text-sm text-purple-600 mb-1">Total Fees</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {formatCurrency(outstandingExportSummary.totalFees)}
                    </p>
                  </div>
                  <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-4">
                    <p className="text-sm text-green-600 mb-1">Total Paid</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {formatCurrency(outstandingExportSummary.totalPaid)}
                    </p>
                  </div>
                  <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-lg p-4">
                    <p className="text-sm text-orange-600 mb-1">Total Outstanding</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {formatCurrency(outstandingExportSummary.totalOutstanding)}
                    </p>
                  </div>
                  <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-lg p-4">
                    <p className="text-sm text-yellow-600 mb-1">Students with Balance</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {outstandingExportSummary.studentsWithBalance}
                    </p>
                  </div>
                  <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-4">
                    <p className="text-sm text-green-600 mb-1">Fully Paid</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {outstandingExportSummary.fullyPaidStudents}
                    </p>
                  </div>
                </div>

                <div className="mt-6 grid grid-cols-2 gap-4">
                  <div className="bg-yellow-50 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-yellow-700">Partial Payments</span>
                      <span className="text-lg font-bold text-yellow-700">
                        {outstandingReport.summary.partialCount || 0}
                      </span>
                    </div>
                  </div>
                  <div className="bg-red-50 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-red-700">Unpaid</span>
                      <span className="text-lg font-bold text-red-700">
                        {outstandingReport.summary.unpaidCount || 0}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Charts Section */}
        {(reportType === 'collection' || reportType === 'method' || reportType === 'trend') && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-6">
            <button
              onClick={() => toggleSection('charts')}
              className="w-full px-6 py-4 flex items-center justify-between bg-gray-50 hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-center space-x-2">
                <BarChart3 className="w-5 h-5 text-green-600" />
                <span className="font-medium text-gray-900">Analytics Charts</span>
              </div>
              {expandedSections.charts ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </button>

            {expandedSections.charts && (
              <div className="p-6">
                <div className="flex space-x-2 mb-6">
                  <button
                    onClick={() => setChartType('line')}
                    className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                      chartType === 'line'
                        ? 'bg-green-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Line Chart
                  </button>
                  <button
                    onClick={() => setChartType('bar')}
                    className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                      chartType === 'bar'
                        ? 'bg-green-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Bar Chart
                  </button>
                  <button
                    onClick={() => setChartType('area')}
                    className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                      chartType === 'area'
                        ? 'bg-green-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Area Chart
                  </button>
                </div>

                <div className="flex flex-col lg:flex-row gap-6">
                  <div className="lg:w-1/3 space-y-6">
                    {methodChartData.length > 0 && (
                      <div className="h-80">
                        <h4 className="text-sm font-medium text-gray-700 mb-4 flex items-center">
                          <PieChart className="w-4 h-4 mr-2 text-green-600" />
                          Payment Methods
                        </h4>
                        <ResponsiveContainer width="100%" height="100%">
                          <RePieChart>
                            <Pie
                              data={methodChartData}
                              cx="50%"
                              cy="50%"
                              innerRadius={60}
                              outerRadius={100}
                              paddingAngle={2}
                              dataKey="value"
                              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                            >
                              {methodChartData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color || CHART_COLORS[entry.method] || '#6b7280'} />
                              ))}
                            </Pie>
                            <Tooltip content={<CustomTooltip />} />
                            <Legend />
                          </RePieChart>
                        </ResponsiveContainer>
                      </div>
                    )}

                    {purposeChartData.length > 0 && (
                      <div className="h-80">
                        <h4 className="text-sm font-medium text-gray-700 mb-4 flex items-center">
                          <BarChart3 className="w-4 h-4 mr-2 text-green-600" />
                          Payment Purposes
                        </h4>
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={purposeChartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                            <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                            <YAxis tick={{ fontSize: 12 }} />
                            <Tooltip content={<CustomTooltip />} />
                            <Bar dataKey="value" fill="#10b981" radius={[4, 4, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    )}
                  </div>

                  <div className="lg:w-2/3 h-96">
                    {(reportType === 'trend' || reportType === 'collection') && dailyTrendData.length > 0 && (
                      <>
                        <h4 className="text-sm font-medium text-gray-700 mb-4 flex items-center">
                          <TrendingUp className="w-4 h-4 mr-2 text-green-600" />
                          {groupBy === 'day' ? 'Daily' : groupBy === 'week' ? 'Weekly' : 'Monthly'} Collection Trend
                        </h4>
                        <ResponsiveContainer width="100%" height="100%">
                          {chartType === 'line' && (
                            <LineChart data={dailyTrendData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                              <XAxis dataKey="formattedDate" tick={{ fontSize: 12 }} />
                              <YAxis tick={{ fontSize: 12 }} />
                              <Tooltip content={<CustomTooltip />} />
                              <Legend />
                              <Line type="monotone" dataKey="total" name="Amount" stroke="#10b981" strokeWidth={2} />
                            </LineChart>
                          )}
                          {chartType === 'bar' && (
                            <BarChart data={dailyTrendData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                              <XAxis dataKey="formattedDate" tick={{ fontSize: 12 }} />
                              <YAxis tick={{ fontSize: 12 }} />
                              <Tooltip content={<CustomTooltip />} />
                              <Bar dataKey="total" name="Amount" fill="#10b981" radius={[4, 4, 0, 0]} />
                            </BarChart>
                          )}
                          {chartType === 'area' && (
                            <AreaChart data={dailyTrendData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                              <XAxis dataKey="formattedDate" tick={{ fontSize: 12 }} />
                              <YAxis tick={{ fontSize: 12 }} />
                              <Tooltip content={<CustomTooltip />} />
                              <Area type="monotone" dataKey="total" name="Amount" stroke="#10b981" fill="#10b981" fillOpacity={0.3} />
                            </AreaChart>
                          )}
                        </ResponsiveContainer>
                      </>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Payments List - Below Charts */}
        {reportType === 'collection' && recentPayments.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-6">
            <button
              onClick={() => toggleSection('payments')}
              className="w-full px-6 py-4 flex items-center justify-between bg-gray-50 hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-center space-x-2">
                <FileText className="w-5 h-5 text-green-600" />
                <span className="font-medium text-gray-900">Payment Records</span>
                <span className="ml-2 text-sm text-gray-500">({recentPayments.length} records)</span>
              </div>
              {expandedSections.payments ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </button>

            {expandedSections.payments && (
              <div className="p-6">
                <PaymentHistoryTable
                  payments={recentPayments}
                  loading={loading}
                  showActions={false}
                  showCourseInfo={true}
                  showStudentInfo={true}
                />
              </div>
            )}
          </div>
        )}

        {/* Outstanding Students Table */}
        {reportType === 'outstanding' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <button
              onClick={() => toggleSection('details')}
              className="w-full px-6 py-4 flex items-center justify-between bg-gray-50 hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-center space-x-2">
                <Users className="w-5 h-5 text-orange-600" />
                <span className="font-medium text-gray-900">Outstanding Students</span>
                <span className="ml-2 text-sm text-gray-500">({outstandingStudents.length} with balance)</span>
              </div>
              {expandedSections.details ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </button>

            {expandedSections.details && (
              <div className="p-6">
                {outstandingStudents.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student Name</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student ID</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Course(s)</th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Total Fees</th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Paid</th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Balance</th>
                          <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Progress</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {outstandingStudents.map((student, index) => (
                          <tr key={index} className="hover:bg-gray-50 transition-colors">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {student.studentName}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-blue-600 font-semibold">
                              {student.studentNumber || student.studentId || 'N/A'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                              {student.phone || 'N/A'}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-600 max-w-xs">
                              {student.courses?.map(c => `${c.courseName} (${c.courseCode})`).join(', ') || 'N/A'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium text-gray-900">
                              {formatCurrency(student.totalFees)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium text-green-600">
                              {formatCurrency(student.totalPaid)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-bold text-orange-600">
                              {formatCurrency(student.totalBalance)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center justify-center space-x-2">
                                <span className={`text-sm font-medium ${
                                  student.paymentPercentage >= 75 ? 'text-green-600' :
                                  student.paymentPercentage >= 50 ? 'text-yellow-600' :
                                  'text-red-600'
                                }`}>
                                  {student.paymentPercentage}%
                                </span>
                                <div className="w-16 bg-gray-200 rounded-full h-1.5">
                                  <div
                                    className={`h-1.5 rounded-full ${
                                      student.paymentPercentage >= 75 ? 'bg-green-500' :
                                      student.paymentPercentage >= 50 ? 'bg-yellow-500' :
                                      'bg-red-500'
                                    }`}
                                    style={{ width: `${Math.min(100, student.paymentPercentage)}%` }}
                                  />
                                </div>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <CheckCircle className="mx-auto h-12 w-12 text-green-500 mb-3" />
                    <p className="text-gray-600 text-lg font-medium">All students are fully paid!</p>
                    <p className="text-gray-500 text-sm mt-1">No outstanding balances to display.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
        
        {/* Fully Paid Students Info */}
        {reportType === 'outstanding' && fullyPaidStudents.length > 0 && (
          <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span className="text-sm text-green-700">
                  <strong>{fullyPaidStudents.length}</strong> student{fullyPaidStudents.length > 1 ? 's' : ''} fully paid
                </span>
              </div>
              <span className="text-xs text-green-600">
                These students have cleared all their fees
              </span>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default FeeReports;