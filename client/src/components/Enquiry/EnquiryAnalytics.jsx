// components/Enquiry/EnquiryAnalytics.jsx - MOVED TO COMPONENTS/ENQUIRY

import React, { useState, useEffect } from 'react';
import Layout from '../Layout/Layout';
import { useAnalyticsStore } from '../../stores/analyticsStore';
import { useEnquiryStore } from '../../stores/enquiryStore';
import {
  BarChart3,
  TrendingUp,
  Users,
  Mail,
  Globe,
  Calendar,
  Download,
  RefreshCw,
  Loader,
  ArrowUp,
  ArrowDown,
  Clock,
  CheckCircle,
  AlertCircle,
  Filter,
  ChevronDown,
  ChevronUp,
  Eye,
  MousePointer,
  UserPlus,
  Percent,
  Activity,
  PieChart as PieChartIcon,
  BarChart as BarChartIcon
} from 'lucide-react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
  ComposedChart
} from 'recharts';
import toast from 'react-hot-toast';

// Chart Colors - Google Analytics Inspired
const CHART_COLORS = {
  google: '#4285F4',
  facebook: '#1877F2',
  instagram: '#E4405F',
  linkedin: '#0A66C2',
  tiktok: '#000000',
  twitter: '#1DA1F2',
  referral: '#8B5CF6',
  direct: '#6B7280',
  advertisement: '#F59E0B',
  other: '#9CA3AF'
};

const CHART_PALETTE = ['#4285F4', '#34A853', '#FBBC04', '#EA4335', '#8B5CF6', '#06B6D4', '#EC4899', '#F59E0B', '#6B7280', '#10B981'];

const EnquiryAnalytics = () => {
  const {
    analyticsSummary,
    sourceBreakdown,
    conversionReport,
    topSources,
    dailyTrends,
    loading,
    dateRange,
    fetchAllAnalytics,
    fetchSourceBreakdown,
    fetchConversionReport,
    setDateRangePreset,
    setDateRange
  } = useAnalyticsStore();

  const { fetchStats } = useEnquiryStore();

  const [activeTab, setActiveTab] = useState('overview');
  const [chartView, setChartView] = useState('pie');
  const [timePreset, setTimePreset] = useState('30d');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Time presets
  const timePresets = [
    { value: '7d', label: 'Last 7 days' },
    { value: '30d', label: 'Last 30 days' },
    { value: '90d', label: 'Last 90 days' },
    { value: 'year', label: 'Last year' }
  ];

  useEffect(() => {
    loadAnalyticsData();
  }, [dateRange]);

  const loadAnalyticsData = async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([
        fetchAllAnalytics(),
        fetchSourceBreakdown(),
        fetchConversionReport(),
        fetchStats()
      ]);
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleRefresh = () => {
    loadAnalyticsData();
    toast.success('Analytics refreshed');
  };

  const handleTimePresetChange = (preset) => {
    setTimePreset(preset);
    setDateRangePreset(preset);
    setShowDatePicker(false);
  };

  const handleCustomDateApply = () => {
    if (customStartDate && customEndDate) {
      setDateRange(customStartDate, customEndDate);
      setShowDatePicker(false);
      setTimePreset('custom');
    } else {
      toast.error('Please select both start and end dates');
    }
  };

  // Format data for charts
  const sourceData = sourceBreakdown?.sources || [];
  const conversionData = conversionReport?.bySource || [];
  const summaryData = analyticsSummary?.summary || {};
  const dailyTrendData = analyticsSummary?.dailyTrends || [];

  // Prepare pie chart data
  const pieChartData = sourceData.map(item => ({
    name: item.sourceDisplay || item.source,
    value: item.enquiries || item.count || 0,
    source: item.source,
    percentage: item.enquiryPercentage || 0
  })).filter(item => item.value > 0);

  // Prepare bar chart data
  const barChartData = sourceData.map(item => ({
    name: item.sourceDisplay || item.source,
    enquiries: item.enquiries || 0,
    pageViews: item.pageViews || 0,
    conversionRate: item.enquiryPercentage || 0
  }));

  // Prepare daily trends data
  const trendData = dailyTrendData.map(item => ({
    date: item.date || item._id,
    views: item.views || item.count || 0,
    uniqueVisitors: item.uniqueVisitors || 0
  }));

  // Calculate totals
  const totalEnquiries = summaryData.totalEnquiries || sourceData.reduce((sum, s) => sum + (s.enquiries || 0), 0);
  const totalPageViews = summaryData.totalPageViews || sourceData.reduce((sum, s) => sum + (s.pageViews || 0), 0);
  const conversionRate = summaryData.conversionRate || 0;
  const uniqueVisitors = summaryData.uniqueVisitors || 0;

  // Find top source
  const topSource = sourceData.length > 0 ? sourceData[0] : null;

  if (loading && !analyticsSummary) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-96">
          <div className="text-center">
            <Loader className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
            <p className="text-gray-600">Loading analytics...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                <BarChart3 className="w-6 h-6 mr-2 text-blue-600" />
                Enquiry Analytics
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                Track enquiry performance, traffic sources, and conversion metrics
              </p>
            </div>
            <div className="flex items-center space-x-3">
              {/* Date Range Picker */}
              <div className="relative">
                <button
                  onClick={() => setShowDatePicker(!showDatePicker)}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  <Calendar className="w-4 h-4 mr-2" />
                  {timePreset === 'custom' ? 'Custom Range' : timePresets.find(p => p.value === timePreset)?.label || 'Last 30 days'}
                  <ChevronDown className="w-4 h-4 ml-2" />
                </button>

                {showDatePicker && (
                  <div className="absolute right-0 mt-2 w-72 bg-white rounded-lg shadow-lg border border-gray-200 z-50 p-4">
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-2">
                        {timePresets.map((preset) => (
                          <button
                            key={preset.value}
                            onClick={() => handleTimePresetChange(preset.value)}
                            className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                              timePreset === preset.value
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                          >
                            {preset.label}
                          </button>
                        ))}
                      </div>
                      <div className="border-t border-gray-200 pt-3">
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-xs text-gray-500 mb-1">Start</label>
                            <input
                              type="date"
                              value={customStartDate}
                              onChange={(e) => setCustomStartDate(e.target.value)}
                              className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-sm"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-gray-500 mb-1">End</label>
                            <input
                              type="date"
                              value={customEndDate}
                              onChange={(e) => setCustomEndDate(e.target.value)}
                              className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-sm"
                            />
                          </div>
                        </div>
                        <button
                          onClick={handleCustomDateApply}
                          className="w-full mt-2 px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
                        >
                          Apply Custom Range
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <button
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                Refresh
              </button>

              <button
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                <Download className="w-4 h-4 mr-2" />
                Export
              </button>
            </div>
          </div>
        </div>

        {/* KPI Cards - Google Analytics Style */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Total Enquiries</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{totalEnquiries}</p>
                <p className="text-xs text-gray-400 mt-1">vs previous period</p>
              </div>
              <div className="p-3 bg-blue-50 rounded-lg">
                <Mail className="w-5 h-5 text-blue-600" />
              </div>
            </div>
            <div className="mt-2 flex items-center">
              <span className="text-xs font-medium text-green-600 flex items-center">
                <ArrowUp className="w-3 h-3 mr-1" />
                12.5%
              </span>
              <span className="text-xs text-gray-400 ml-2">from last period</span>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Conversion Rate</p>
                <p className="text-2xl font-bold text-green-600 mt-1">{conversionRate}%</p>
                <p className="text-xs text-gray-400 mt-1">visitors → enquiries</p>
              </div>
              <div className="p-3 bg-green-50 rounded-lg">
                <Percent className="w-5 h-5 text-green-600" />
              </div>
            </div>
            <div className="mt-2 flex items-center">
              <span className="text-xs font-medium text-green-600 flex items-center">
                <ArrowUp className="w-3 h-3 mr-1" />
                3.2%
              </span>
              <span className="text-xs text-gray-400 ml-2">from last period</span>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Unique Visitors</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{uniqueVisitors}</p>
                <p className="text-xs text-gray-400 mt-1">to enquiry page</p>
              </div>
              <div className="p-3 bg-purple-50 rounded-lg">
                <Users className="w-5 h-5 text-purple-600" />
              </div>
            </div>
            <div className="mt-2 flex items-center">
              <span className="text-xs font-medium text-green-600 flex items-center">
                <ArrowUp className="w-3 h-3 mr-1" />
                8.7%
              </span>
              <span className="text-xs text-gray-400 ml-2">from last period</span>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Top Source</p>
                <p className="text-xl font-bold text-gray-900 mt-1 truncate">
                  {topSource ? (topSource.sourceDisplay || topSource.source) : 'N/A'}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  {topSource ? `${topSource.enquiries || 0} enquiries` : 'No data'}
                </p>
              </div>
              <div className="p-3 bg-orange-50 rounded-lg">
                <Globe className="w-5 h-5 text-orange-600" />
              </div>
            </div>
            <div className="mt-2 flex items-center">
              <span className="text-xs font-medium text-green-600 flex items-center">
                <ArrowUp className="w-3 h-3 mr-1" />
                {topSource ? `${topSource.enquiryPercentage || 0}%` : '0%'}
              </span>
              <span className="text-xs text-gray-400 ml-2">conversion rate</span>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="flex -mb-px space-x-6">
            <button
              onClick={() => setActiveTab('overview')}
              className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'overview'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <PieChartIcon className="w-4 h-4 inline mr-2" />
              Overview
            </button>
            <button
              onClick={() => setActiveTab('sources')}
              className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'sources'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <BarChartIcon className="w-4 h-4 inline mr-2" />
              Traffic Sources
            </button>
            <button
              onClick={() => setActiveTab('conversion')}
              className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'conversion'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <TrendingUp className="w-4 h-4 inline mr-2" />
              Conversion
            </button>
            <button
              onClick={() => setActiveTab('trends')}
              className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'trends'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Activity className="w-4 h-4 inline mr-2" />
              Trends
            </button>
          </nav>
        </div>

        {/* ============ OVERVIEW TAB ============ */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Source Breakdown Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Pie Chart */}
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold text-gray-700">Source Distribution</h3>
                  <div className="flex space-x-1">
                    <button
                      onClick={() => setChartView('pie')}
                      className={`p-1.5 rounded transition-colors ${
                        chartView === 'pie' ? 'bg-blue-100 text-blue-600' : 'text-gray-400 hover:text-gray-600'
                      }`}
                    >
                      <PieChartIcon className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setChartView('bar')}
                      className={`p-1.5 rounded transition-colors ${
                        chartView === 'bar' ? 'bg-blue-100 text-blue-600' : 'text-gray-400 hover:text-gray-600'
                      }`}
                    >
                      <BarChartIcon className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div className="h-72">
                  {pieChartData.length === 0 ? (
                    <div className="flex items-center justify-center h-full text-gray-400 text-sm">No data available</div>
                  ) : chartView === 'pie' ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={pieChartData}
                          cx="50%"
                          cy="45%"
                          innerRadius={60}
                          outerRadius={90}
                          dataKey="value"
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        >
                          {pieChartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={CHART_COLORS[entry.source] || CHART_PALETTE[index % CHART_PALETTE.length]} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={{ fontSize: '12px' }} />
                        <Legend verticalAlign="bottom" height={36} />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={barChartData} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis type="number" />
                        <YAxis type="category" dataKey="name" width={80} tick={{ fontSize: 11 }} />
                        <Tooltip contentStyle={{ fontSize: '12px' }} />
                        <Bar dataKey="enquiries" name="Enquiries" fill="#4285F4" radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>

              {/* Top Sources Table */}
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="text-sm font-semibold text-gray-700 mb-4">Top Traffic Sources</h3>
                <div className="space-y-3">
                  {sourceData.slice(0, 5).map((source, index) => {
                    const percentage = sourceData.length > 0 ? Math.round((source.enquiries / totalEnquiries) * 100) : 0;
                    return (
                      <div key={index}>
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center">
                            <span className="w-2 h-2 rounded-full mr-2" style={{
                              backgroundColor: CHART_COLORS[source.source] || CHART_PALETTE[index % CHART_PALETTE.length]
                            }} />
                            <span className="text-gray-700">{source.sourceDisplay || source.source}</span>
                          </div>
                          <div className="flex items-center space-x-3">
                            <span className="text-gray-500">{source.enquiries || 0}</span>
                            <span className="text-xs font-medium text-gray-400 w-10 text-right">{percentage}%</span>
                          </div>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-1 mt-1">
                          <div
                            className="h-1 rounded-full transition-all duration-500"
                            style={{
                              width: `${percentage}%`,
                              backgroundColor: CHART_COLORS[source.source] || CHART_PALETTE[index % CHART_PALETTE.length]
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                  {sourceData.length === 0 && (
                    <div className="text-center text-gray-400 text-sm py-4">No source data available</div>
                  )}
                </div>
              </div>
            </div>

            {/* Quick Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white rounded-lg border border-gray-200 p-4 text-center">
                <p className="text-2xl font-bold text-blue-600">{totalEnquiries}</p>
                <p className="text-xs text-gray-500">Total Enquiries</p>
              </div>
              <div className="bg-white rounded-lg border border-gray-200 p-4 text-center">
                <p className="text-2xl font-bold text-green-600">{totalPageViews}</p>
                <p className="text-xs text-gray-500">Page Views</p>
              </div>
              <div className="bg-white rounded-lg border border-gray-200 p-4 text-center">
                <p className="text-2xl font-bold text-purple-600">{conversionRate}%</p>
                <p className="text-xs text-gray-500">Conversion Rate</p>
              </div>
              <div className="bg-white rounded-lg border border-gray-200 p-4 text-center">
                <p className="text-2xl font-bold text-orange-600">{uniqueVisitors}</p>
                <p className="text-xs text-gray-500">Unique Visitors</p>
              </div>
            </div>
          </div>
        )}

        {/* ============ TRAFFIC SOURCES TAB ============ */}
        {activeTab === 'sources' && (
          <div className="space-y-6">
            {/* Full Source Breakdown Chart */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-sm font-semibold text-gray-700 mb-4">Source Breakdown</h3>
              <div className="h-80">
                {barChartData.length === 0 ? (
                  <div className="flex items-center justify-center h-full text-gray-400 text-sm">No data available</div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={barChartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip contentStyle={{ fontSize: '12px' }} />
                      <Legend verticalAlign="top" height={36} />
                      <Bar dataKey="pageViews" name="Page Views" fill="#6B7280" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="enquiries" name="Enquiries" fill="#4285F4" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* Full Source Table */}
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <div className="px-6 py-3 border-b border-gray-200 bg-gray-50">
                <h3 className="text-sm font-semibold text-gray-700">All Traffic Sources</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-2 text-left text-xs font-medium text-gray-500 uppercase">Source</th>
                      <th className="px-6 py-2 text-right text-xs font-medium text-gray-500 uppercase">Visitors</th>
                      <th className="px-6 py-2 text-right text-xs font-medium text-gray-500 uppercase">Enquiries</th>
                      <th className="px-6 py-2 text-center text-xs font-medium text-gray-500 uppercase">Conversion</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {sourceData.map((source, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-6 py-3 font-medium text-gray-900">
                          <span className="inline-flex items-center">
                            <span className="w-2 h-2 rounded-full mr-2" style={{
                              backgroundColor: CHART_COLORS[source.source] || CHART_PALETTE[index % CHART_PALETTE.length]
                            }} />
                            {source.sourceDisplay || source.source}
                          </span>
                        </td>
                        <td className="px-6 py-3 text-right text-gray-600">{source.pageViews || 0}</td>
                        <td className="px-6 py-3 text-right text-gray-600">{source.enquiries || 0}</td>
                        <td className="px-6 py-3 text-center">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                            (source.enquiryPercentage || 0) >= 50 ? 'bg-green-100 text-green-800' :
                            (source.enquiryPercentage || 0) >= 25 ? 'bg-yellow-100 text-yellow-800' :
                            'bg-gray-100 text-gray-600'
                          }`}>
                            {source.enquiryPercentage || 0}%
                          </span>
                        </td>
                      </tr>
                    ))}
                    {sourceData.length === 0 && (
                      <tr>
                        <td colSpan="4" className="px-6 py-8 text-center text-gray-400">No data available</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ============ CONVERSION TAB ============ */}
        {activeTab === 'conversion' && (
          <div className="space-y-6">
            {/* Conversion Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white rounded-lg border border-gray-200 p-4 text-center">
                <p className="text-2xl font-bold text-green-600">{conversionRate}%</p>
                <p className="text-xs text-gray-500">Overall Conversion Rate</p>
              </div>
              <div className="bg-white rounded-lg border border-gray-200 p-4 text-center">
                <p className="text-2xl font-bold text-blue-600">
                  {totalEnquiries > 0 ? Math.round((sourceData.filter(s => s.enquiries > 0).length / sourceData.length) * 100) : 0}%
                </p>
                <p className="text-xs text-gray-500">Source Engagement Rate</p>
              </div>
              <div className="bg-white rounded-lg border border-gray-200 p-4 text-center">
                <p className="text-2xl font-bold text-purple-600">
                  {conversionData.length > 0 ? conversionData[0]?.source || 'N/A' : 'N/A'}
                </p>
                <p className="text-xs text-gray-500">Top Converting Source</p>
              </div>
            </div>

            {/* Conversion by Source Chart */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-sm font-semibold text-gray-700 mb-4">Conversion Rate by Source</h3>
              <div className="h-80">
                {conversionData.length === 0 ? (
                  <div className="flex items-center justify-center h-full text-gray-400 text-sm">No data available</div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={conversionData} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis type="number" domain={[0, 100]} tickFormatter={(value) => `${value}%`} />
                      <YAxis type="category" dataKey="source" width={100} tick={{ fontSize: 11 }} />
                      <Tooltip contentStyle={{ fontSize: '12px' }} />
                      <Bar dataKey="conversionRate" name="Conversion Rate %" fill="#10B981" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* Conversion Details Table */}
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <div className="px-6 py-3 border-b border-gray-200 bg-gray-50">
                <h3 className="text-sm font-semibold text-gray-700">Conversion Details by Source</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-2 text-left text-xs font-medium text-gray-500 uppercase">Source</th>
                      <th className="px-6 py-2 text-right text-xs font-medium text-gray-500 uppercase">Visitors</th>
                      <th className="px-6 py-2 text-right text-xs font-medium text-gray-500 uppercase">Converted</th>
                      <th className="px-6 py-2 text-center text-xs font-medium text-gray-500 uppercase">Rate</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {conversionData.map((item, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-6 py-3 font-medium text-gray-900">{item.sourceDisplay || item.source}</td>
                        <td className="px-6 py-3 text-right text-gray-600">{item.totalVisitors || 0}</td>
                        <td className="px-6 py-3 text-right text-gray-600">{item.convertedVisitors || 0}</td>
                        <td className="px-6 py-3 text-center">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                            (item.conversionRate || 0) >= 50 ? 'bg-green-100 text-green-800' :
                            (item.conversionRate || 0) >= 25 ? 'bg-yellow-100 text-yellow-800' :
                            'bg-gray-100 text-gray-600'
                          }`}>
                            {item.conversionRate || 0}%
                          </span>
                        </td>
                      </tr>
                    ))}
                    {conversionData.length === 0 && (
                      <tr>
                        <td colSpan="4" className="px-6 py-8 text-center text-gray-400">No data available</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ============ TRENDS TAB ============ */}
        {activeTab === 'trends' && (
          <div className="space-y-6">
            {/* Daily Trends Chart */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-sm font-semibold text-gray-700 mb-4">Daily Trends</h3>
              <div className="h-80">
                {trendData.length === 0 ? (
                  <div className="flex items-center justify-center h-full text-gray-400 text-sm">No data available</div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={trendData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip contentStyle={{ fontSize: '12px' }} />
                      <Legend verticalAlign="top" height={36} />
                      <Area type="monotone" dataKey="views" name="Views" fill="#4285F4" stroke="#4285F4" fillOpacity={0.3} />
                      <Line type="monotone" dataKey="uniqueVisitors" name="Unique Visitors" stroke="#34A853" strokeWidth={2} dot={{ r: 2 }} />
                    </ComposedChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* Trend Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white rounded-lg border border-gray-200 p-4 text-center">
                <p className="text-xl font-bold text-blue-600">{trendData.reduce((sum, d) => sum + d.views, 0)}</p>
                <p className="text-xs text-gray-500">Total Views</p>
              </div>
              <div className="bg-white rounded-lg border border-gray-200 p-4 text-center">
                <p className="text-xl font-bold text-green-600">{trendData.reduce((sum, d) => sum + d.uniqueVisitors, 0)}</p>
                <p className="text-xs text-gray-500">Unique Visitors</p>
              </div>
              <div className="bg-white rounded-lg border border-gray-200 p-4 text-center">
                <p className="text-xl font-bold text-purple-600">
                  {trendData.length > 0 ? Math.round(trendData.reduce((sum, d) => sum + d.views, 0) / trendData.length) : 0}
                </p>
                <p className="text-xs text-gray-500">Avg Daily Views</p>
              </div>
              <div className="bg-white rounded-lg border border-gray-200 p-4 text-center">
                <p className="text-xl font-bold text-orange-600">
                  {trendData.length > 0 ? Math.round(trendData.reduce((sum, d) => sum + d.uniqueVisitors, 0) / trendData.length) : 0}
                </p>
                <p className="text-xs text-gray-500">Avg Daily Visitors</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default EnquiryAnalytics;