// src/components/Fees/FeeReports.jsx - COMPLETE FIXED VERSION

import React, { useState, useEffect } from 'react';
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
  Smartphone
} from 'lucide-react';
import Layout from '../Layout/Layout';
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
import { feesDashboardExportConfig, outstandingReportExportConfig } from '../../utils/exportConfigs';
import toast from 'react-hot-toast';

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
  const [dateRange, setDateRange] = useState('month');
  const [customStartDate, setCustomStartDate] = useState(
    new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0]
  );
  const [customEndDate, setCustomEndDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [groupBy, setGroupBy] = useState('day');
  const [expandedSections, setExpandedSections] = useState({
    summary: true,
    charts: true,
    details: true
  });
  const [chartType, setChartType] = useState('line');
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
    unpaidStudents: 0
  });

  // Load reports on mount and when filters change
  useEffect(() => {
    loadReports();
  }, [reportType, dateRange, groupBy, customStartDate, customEndDate]);

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

  // FIXED: Update outstanding export summary - properly calculate from outstandingReport data
  useEffect(() => {
    if (outstandingReport?.summary) {
      const summary = outstandingReport.summary;
      
      // Calculate totals from the students array if available
      let calculatedTotalFees = 0;
      let calculatedTotalPaid = 0;
      let calculatedTotalOutstanding = 0;
      
      if (outstandingReport.students && outstandingReport.students.length > 0) {
        calculatedTotalFees = outstandingReport.students.reduce((sum, s) => sum + (s.totalFees || 0), 0);
        calculatedTotalPaid = outstandingReport.students.reduce((sum, s) => sum + (s.totalPaid || 0), 0);
        calculatedTotalOutstanding = outstandingReport.students.reduce((sum, s) => sum + (s.totalBalance || 0), 0);
      } else {
        // Fallback to summary data
        calculatedTotalOutstanding = summary.totalOutstanding || 0;
        calculatedTotalFees = summary.totalFees || 0;
        calculatedTotalPaid = calculatedTotalFees - calculatedTotalOutstanding;
      }
      
      setOutstandingExportSummary({
        totalFees: calculatedTotalFees,
        totalOutstanding: calculatedTotalOutstanding,
        totalPaid: calculatedTotalPaid,
        studentsWithBalance: summary.totalStudents || 0,
        unpaidStudents: summary.unpaidCount || 0
      });
    }
  }, [outstandingReport]);

  const loadReports = async () => {
    const { startDate, endDate } = getDateRange();

    if (reportType === 'collection') {
      await fetchCollectionReport({ startDate, endDate, groupBy });
      await fetchPaymentStats({ startDate, endDate });
      await fetchOutstandingReport();
    } else if (reportType === 'outstanding') {
      await fetchOutstandingReport();
    } else if (reportType === 'method') {
      await fetchPaymentStats({ startDate, endDate });
    } else if (reportType === 'trend') {
      await fetchPaymentStats({ startDate, endDate });
    }
  };

  const getDateRange = () => {
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
        start.setMonth(end.getMonth() - 1);
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

  const handleExport = async (format, options) => {
    const { startDate, endDate } = getDateRange();
    
    let result;
    if (reportType === 'collection') {
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

  // Prepare chart data
  const methodChartData = prepareMethodChartData(paymentStats?.byMethod);
  const purposeChartData = preparePurposeChartData(paymentStats?.byPurpose);
  const dailyTrendData = prepareDailyTrendData(paymentStats?.byDay);
  const monthlyTrendData = prepareMonthlyTrendData(paymentStats?.byMonth);

  // Prepare export data for Collection Report (same as Fees Dashboard)
  const collectionExportData = paymentStats?.recentPayments?.map(payment => ({
    date: new Date(payment.paymentDate).toLocaleDateString(),
    studentName: payment.studentName || 'N/A',
    studentId: payment.studentId || 'N/A',
    course: payment.courseName || 'N/A',
    courseCode: payment.courseCode || 'N/A',
    amount: payment.amount,
    payerName: payment.payerName || 'N/A',
    receiptNumber: payment.receiptNumber || 'N/A',
    reference: payment.transactionId || payment.paymentReference || 'N/A'
  })) || [];

  // FIXED: Prepare export data for Outstanding Report - using studentNumber for SBTC ID
  const outstandingExportData = outstandingReport?.students?.map(student => ({
    studentName: student.studentName || 'N/A',
    studentId: student.studentNumber || student.studentId || 'N/A',  // Use studentNumber for SBTC format
    phone: student.phone || 'N/A',
    course: student.courses?.map(c => `${c.courseName} (${c.courseCode})`).join(', ') || 'N/A',
    totalFees: student.totalFees || 0,
    totalPaid: student.totalPaid || 0,
    balance: student.totalBalance || 0,
    progress: `${student.paymentPercentage || 0}%`
  })) || [];

  // Get chart colors
  const COLORS = {
    mpesa: '#10b981',
    cooperative_bank: '#3b82f6',
    family_bank: '#8b5cf6',
    cash: '#f59e0b',
    other: '#6b7280'
  };

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

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-96">
          <div className="text-center">
            <Loader className="w-12 h-12 animate-spin text-green-600 mx-auto mb-4" />
            <p className="text-gray-600">Loading report data...</p>
          </div>
        </div>
      </Layout>
    );
  }

  // Get current config based on report type
  const currentConfig = reportType === 'outstanding' ? outstandingReportExportConfig : feesDashboardExportConfig;
  const currentExportData = reportType === 'outstanding' ? outstandingExportData : collectionExportData;
  const currentExportSummary = reportType === 'outstanding' ? outstandingExportSummary : exportSummary;

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
                includeDateRange={reportType !== 'outstanding'}
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
                onChange={(e) => setReportType(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              >
                <option value="collection">Collection Report</option>
                <option value="outstanding">Outstanding Report</option>
                <option value="method">Payment Method Analysis</option>
                <option value="trend">Trend Analysis</option>
              </select>
            </div>

            {reportType !== 'outstanding' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date Range
                </label>
                <select
                  value={dateRange}
                  onChange={(e) => setDateRange(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                >
                  <option value="today">Today</option>
                  <option value="week">Last 7 Days</option>
                  <option value="month">Last 30 Days</option>
                  <option value="quarter">Last 3 Months</option>
                  <option value="year">Last Year</option>
                  <option value="custom">Custom Range</option>
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
                <div>
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

        {/* Summary Section - Outstanding Report - FIXED CALCULATIONS */}
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
                  <div className="bg-gradient-to-br from-red-50 to-pink-50 rounded-lg p-4">
                    <p className="text-sm text-red-600 mb-1">Unpaid Students</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {outstandingExportSummary.unpaidStudents}
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
                  <div className="bg-green-50 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-green-700">Fully Paid</span>
                      <span className="text-lg font-bold text-green-700">
                        {outstandingReport.summary.paidCount || 0}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Charts Section - SIDE BY SIDE LAYOUT */}
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
                {/* Chart Type Selector */}
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

                {/* SIDE BY SIDE LAYOUT: 1/3 Analytics Charts, 2/3 Daily Trend */}
                <div className="flex flex-col lg:flex-row gap-6">
                  {/* LEFT COLUMN - Analytics Charts (1/3 width) */}
                  <div className="lg:w-1/3 space-y-6">
                    {/* Payment Methods Chart */}
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
                                <Cell key={`cell-${index}`} fill={COLORS[entry.method] || '#6b7280'} />
                              ))}
                            </Pie>
                            <Tooltip content={<CustomTooltip />} />
                            <Legend />
                          </RePieChart>
                        </ResponsiveContainer>
                      </div>
                    )}

                    {/* Payment Purposes Chart */}
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

                  {/* RIGHT COLUMN - Daily/Weekly/Monthly Trend Chart (2/3 width) */}
                  {(reportType === 'trend' || reportType === 'collection') && dailyTrendData.length > 0 && (
                    <div className="lg:w-2/3 h-96">
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
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Details Section - Collection Report Table */}
        {reportType === 'collection' && collectionReport?.details && collectionReport.details.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <button
              onClick={() => toggleSection('details')}
              className="w-full px-6 py-4 flex items-center justify-between bg-gray-50 hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-center space-x-2">
                <FileText className="w-5 h-5 text-green-600" />
                <span className="font-medium text-gray-900">Collection Breakdown</span>
              </div>
              {expandedSections.details ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </button>

            {expandedSections.details && (
              <div className="p-6">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Period</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Total Collected</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Payment Count</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Average Payment</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {collectionReport.details.map((item, index) => (
                        <tr key={index} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {item.period}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium text-green-600">
                            {formatCurrency(item.total)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-600">
                            {item.count}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-600">
                            {formatCurrency(item.total / item.count)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Details Section - Outstanding Report Table - FIXED with SBTC Student ID */}
        {reportType === 'outstanding' && outstandingReport?.students && outstandingReport.students.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <button
              onClick={() => toggleSection('details')}
              className="w-full px-6 py-4 flex items-center justify-between bg-gray-50 hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-center space-x-2">
                <Users className="w-5 h-5 text-orange-600" />
                <span className="font-medium text-gray-900">Outstanding Students</span>
              </div>
              {expandedSections.details ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </button>

            {expandedSections.details && (
              <div className="p-6">
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
                      {outstandingReport.students.map((student, index) => (
                        <tr key={index} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {student.studentName}
                          </td>
                          {/* FIXED: Using studentNumber for SBTC format ID */}
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
              </div>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default FeeReports;