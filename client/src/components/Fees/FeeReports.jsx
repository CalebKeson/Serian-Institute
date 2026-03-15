// src/components/Fees/FeeReports.jsx
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
  XCircle
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
import toast from 'react-hot-toast';

const COLORS = {
  mpesa: '#10b981',
  cooperative_bank: '#3b82f6',
  family_bank: '#8b5cf6',
  cash: '#f59e0b',
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
    details: false
  });
  const [chartType, setChartType] = useState('line');

  // Load reports on mount and when filters change
  useEffect(() => {
    loadReports();
  }, [reportType, dateRange, groupBy, customStartDate, customEndDate]);

  const loadReports = async () => {
    const { startDate, endDate } = getDateRange();

    if (reportType === 'collection') {
      await fetchCollectionReport({ startDate, endDate, groupBy });
      await fetchPaymentStats({ startDate, endDate });
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

  // Prepare export data based on report type
  const getExportData = () => {
    if (reportType === 'collection') {
      return collectionReport?.details?.map(item => ({
        period: item.period,
        total: item.total,
        count: item.count,
        ...item.methodBreakdown
      })) || [];
    } else if (reportType === 'outstanding') {
      return outstandingReport?.students?.map(student => ({
        studentName: student.studentName,
        studentId: student.studentId,
        email: student.email,
        phone: student.phone,
        totalFees: student.totalFees,
        totalPaid: student.totalPaid,
        totalBalance: student.totalBalance,
        paymentPercentage: `${student.paymentPercentage}%`,
        courses: student.courses?.map(c => `${c.courseName} (${c.courseCode}): ${formatCurrency(c.balance)}`).join('; ') || ''
      })) || [];
    } else {
      return dailyTrendData.map(day => ({
        date: day.formattedDate,
        total: day.total,
        count: day.count
      }));
    }
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
                data={getExportData()}
                filename={`fee_report_${reportType}`}
                formats={['csv', 'excel', 'pdf', 'print', 'email']}
                onExport={handleExport}
                includeDateRange={reportType !== 'outstanding'}
                includeFilters={true}
                buttonStyle="default"
                buttonText="Export Report"
              />
            </div>
          </div>
        </div>

        {/* Report Controls */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Report Type */}
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

            {/* Date Range */}
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

            {/* Custom Date Range */}
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

            {/* Group By (for collection report) */}
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

        {/* Report Content */}
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader className="w-8 h-8 animate-spin text-green-600" />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Summary Section */}
            {reportType === 'collection' && paymentStats?.totalStats?.[0] && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
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
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                      <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-4">
                        <p className="text-sm text-green-600 mb-1">Total Collected</p>
                        <p className="text-2xl font-bold text-gray-900">
                          {formatCurrency(paymentStats.totalStats[0].totalAmount)}
                        </p>
                      </div>
                      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-4">
                        <p className="text-sm text-blue-600 mb-1">Total Payments</p>
                        <p className="text-2xl font-bold text-gray-900">
                          {paymentStats.totalStats[0].totalPayments}
                        </p>
                      </div>
                      <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg p-4">
                        <p className="text-sm text-purple-600 mb-1">Average Payment</p>
                        <p className="text-2xl font-bold text-gray-900">
                          {formatCurrency(paymentStats.totalStats[0].averageAmount)}
                        </p>
                      </div>
                      <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-lg p-4">
                        <p className="text-sm text-orange-600 mb-1">Largest Payment</p>
                        <p className="text-2xl font-bold text-gray-900">
                          {formatCurrency(paymentStats.totalStats[0].maxAmount)}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Outstanding Summary */}
            {reportType === 'outstanding' && outstandingReport?.summary && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
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
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                      <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-lg p-4">
                        <p className="text-sm text-orange-600 mb-1">Total Outstanding</p>
                        <p className="text-2xl font-bold text-gray-900">
                          {formatCurrency(outstandingReport.summary.totalOutstanding)}
                        </p>
                      </div>
                      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-4">
                        <p className="text-sm text-blue-600 mb-1">Students with Balance</p>
                        <p className="text-2xl font-bold text-gray-900">
                          {outstandingReport.summary.totalStudents}
                        </p>
                      </div>
                      <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg p-4">
                        <p className="text-sm text-purple-600 mb-1">Average Outstanding</p>
                        <p className="text-2xl font-bold text-gray-900">
                          {formatCurrency(outstandingReport.summary.averageOutstanding)}
                        </p>
                      </div>
                      <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-4">
                        <p className="text-sm text-green-600 mb-1">Fully Paid</p>
                        <p className="text-2xl font-bold text-gray-900">
                          {outstandingReport.summary.totalStudents - 
                           (outstandingReport.summary.unpaidCount + outstandingReport.summary.partialCount)}
                        </p>
                      </div>
                    </div>

                    <div className="mt-6 grid grid-cols-2 gap-4">
                      <div className="p-4 bg-yellow-50 rounded-lg">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-yellow-700">Partial Payments</span>
                          <span className="text-lg font-bold text-yellow-700">
                            {outstandingReport.summary.partialCount}
                          </span>
                        </div>
                      </div>
                      <div className="p-4 bg-red-50 rounded-lg">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-red-700">Unpaid</span>
                          <span className="text-lg font-bold text-red-700">
                            {outstandingReport.summary.unpaidCount}
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
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
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

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* Payment Methods Chart */}
                      {methodChartData.length > 0 && (
                        <div className="h-80">
                          <h4 className="text-sm font-medium text-gray-700 mb-4">Payment Methods</h4>
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
                          <h4 className="text-sm font-medium text-gray-700 mb-4">Payment Purposes</h4>
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

                      {/* Daily Trend Chart */}
                      {dailyTrendData.length > 0 && (
                        <div className="lg:col-span-2 h-80">
                          <h4 className="text-sm font-medium text-gray-700 mb-4">Daily Collection Trend</h4>
                          <ResponsiveContainer width="100%" height="100%">
                            {chartType === 'line' && (
                              <LineChart data={dailyTrendData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                <XAxis dataKey="formattedDate" tick={{ fontSize: 12 }} />
                                <YAxis tick={{ fontSize: 12 }} />
                                <Tooltip content={<CustomTooltip />} />
                                <Legend />
                                <Line type="monotone" dataKey="total" name="Total" stroke="#10b981" strokeWidth={2} />
                              </LineChart>
                            )}
                            {chartType === 'bar' && (
                              <BarChart data={dailyTrendData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                <XAxis dataKey="formattedDate" tick={{ fontSize: 12 }} />
                                <YAxis tick={{ fontSize: 12 }} />
                                <Tooltip content={<CustomTooltip />} />
                                <Bar dataKey="total" name="Total" fill="#10b981" radius={[4, 4, 0, 0]} />
                              </BarChart>
                            )}
                            {chartType === 'area' && (
                              <AreaChart data={dailyTrendData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                <XAxis dataKey="formattedDate" tick={{ fontSize: 12 }} />
                                <YAxis tick={{ fontSize: 12 }} />
                                <Tooltip content={<CustomTooltip />} />
                                <Area type="monotone" dataKey="total" name="Total" stroke="#10b981" fill="#10b981" fillOpacity={0.3} />
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

            {/* Details Section */}
            {reportType === 'collection' && collectionReport?.details && collectionReport.details.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <button
                  onClick={() => toggleSection('details')}
                  className="w-full px-6 py-4 flex items-center justify-between bg-gray-50 hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center space-x-2">
                    <FileText className="w-5 h-5 text-green-600" />
                    <span className="font-medium text-gray-900">Detailed Breakdown</span>
                  </div>
                  {expandedSections.details ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                </button>

                {expandedSections.details && (
                  <div className="p-6">
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Period
                            </th>
                            <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Total
                            </th>
                            <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Count
                            </th>
                            <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Average
                            </th>
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

            {/* Outstanding Students Table */}
            {reportType === 'outstanding' && outstandingReport?.students && outstandingReport.students.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900">Outstanding Students</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Student
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Contact
                        </th>
                        <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Total Fees
                        </th>
                        <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Paid
                        </th>
                        <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Balance
                        </th>
                        <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Progress
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {outstandingReport.students.map((student, index) => (
                        <tr key={index} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="h-10 w-10 bg-gradient-to-r from-orange-600 to-red-700 rounded-full flex items-center justify-center">
                                <span className="text-white font-medium text-sm">
                                  {student.studentName?.charAt(0).toUpperCase()}
                                </span>
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900">
                                  {student.studentName}
                                </div>
                                <div className="text-xs text-gray-500">
                                  {student.studentId}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{student.email}</div>
                            <div className="text-sm text-gray-500">{student.phone}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium text-gray-900">
                            {formatCurrency(student.totalFees)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium text-green-600">
                            {formatCurrency(student.totalPaid)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-bold text-orange-600">
                            {formatCurrency(student.totalBalance)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right">
                            <div className="flex items-center justify-end space-x-2">
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