// src/components/Attendance/AttendanceCharts.jsx
import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  PieChart,
  TrendingUp,
  Download,
  RefreshCw
} from 'lucide-react';
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
  ResponsiveContainer
} from 'recharts';
import { useAttendanceStore } from '../../stores/attendanceStore';
import toast from 'react-hot-toast';

const COLORS = {
  present: '#10b981',
  absent: '#ef4444',
  late: '#f59e0b',
  excused: '#3b82f6'
};

const AttendanceCharts = ({
  courseId,
  studentId,
  view = 'course'
}) => {
  const {
    chartData,
    chartLoading,
    fetchCourseChartData,
    fetchStudentChartData,
    attendanceStats, // Add this dependency
    loading
  } = useAttendanceStore();

  const [dateRange, setDateRange] = useState('30days');
  const [customStartDate, setCustomStartDate] = useState(
    new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0]
  );
  const [customEndDate, setCustomEndDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [refreshKey, setRefreshKey] = useState(0); // Add refresh key for manual refresh

  // Fetch chart data when params change OR when attendanceStats updates
  useEffect(() => {
    loadChartData();
  }, [dateRange, customStartDate, customEndDate, courseId, studentId, view, refreshKey, attendanceStats?.total]); // Add attendanceStats.total as dependency

  const getDateRange = () => {
    const endDate = new Date(customEndDate);
    let startDate;

    if (dateRange === 'custom') {
      startDate = new Date(customStartDate);
    } else {
      const days = dateRange === '7days' ? 7 : dateRange === '30days' ? 30 : 90;
      startDate = new Date(endDate);
      startDate.setDate(endDate.getDate() - days);
    }

    return {
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0]
    };
  };

  const loadChartData = async () => {
    const { startDate, endDate } = getDateRange();

    if (view === 'course' && courseId) {
      await fetchCourseChartData(courseId, startDate, endDate);
    } else if (view === 'student' && studentId) {
      await fetchStudentChartData(studentId, startDate, endDate);
    }
  };

  const handleExportChartData = () => {
    const data = view === 'course' ? chartData.dailyTrend : chartData.studentChartData;
    
    if (!data || data.length === 0) {
      toast.error('No data to export');
      return;
    }

    const headers = ['Date', 'Present', 'Absent', 'Late', 'Excused'];
    const csvData = data.map(day => [
      day.date,
      day.present || 0,
      day.absent || 0,
      day.late || 0,
      day.excused || 0
    ]);

    const csvContent = [headers, ...csvData]
      .map(row => row.join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `attendance_${view}_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);

    toast.success('Chart data exported successfully!');
  };

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1); // Increment refresh key to force reload
    toast.success('Charts refreshed');
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="text-sm font-medium text-gray-900 mb-2">{label}</p>
          {payload.map((entry, index) => (
            <div key={index} className="flex items-center justify-between text-xs mb-1">
              <span style={{ color: entry.color }}>{entry.name}:</span>
              <span className="font-medium ml-4">{entry.value}</span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  // Prepare data for status distribution pie chart
  const getStatusDistribution = () => {
    if (view === 'course' && chartData.statusDistribution && chartData.statusDistribution.length > 0) {
      return chartData.statusDistribution;
    }

    // Calculate from attendanceStats if available
    if (attendanceStats && Object.keys(attendanceStats).length > 0) {
      return [
        { name: 'Present', value: attendanceStats.present || 0, color: COLORS.present },
        { name: 'Absent', value: attendanceStats.absent || 0, color: COLORS.absent },
        { name: 'Late', value: attendanceStats.late || 0, color: COLORS.late },
        { name: 'Excused', value: attendanceStats.excused || 0, color: COLORS.excused }
      ].filter(item => item.value > 0);
    }

    return [];
  };

  // Prepare data for weekly comparison
  const getWeeklyComparison = () => {
    return chartData.weeklyComparison || [];
  };

  // Prepare data for daily trend
  const getDailyTrend = () => {
    if (view === 'course') {
      return chartData.dailyTrend || [];
    }
    return chartData.studentChartData || [];
  };

  const statusDistribution = getStatusDistribution();
  const weeklyComparison = getWeeklyComparison();
  const dailyTrend = getDailyTrend();

  if (chartLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
        <div className="flex items-center space-x-2">
          <BarChart3 className="w-5 h-5 text-purple-600" />
          <h3 className="text-lg font-semibold text-gray-900">
            {view === 'course' ? 'Course Attendance Analytics' : 'Student Attendance Analytics'}
          </h3>
        </div>

        <div className="flex items-center space-x-3">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white"
          >
            <option value="7days">Last 7 Days</option>
            <option value="30days">Last 30 Days</option>
            <option value="90days">Last 90 Days</option>
            <option value="custom">Custom Range</option>
          </select>

          {dateRange === 'custom' && (
            <div className="flex items-center space-x-2">
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              />
              <span className="text-gray-500">to</span>
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              />
            </div>
          )}

          <button
            onClick={handleRefresh}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          <button
            onClick={handleExportChartData}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            title="Export Data"
          >
            <Download className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      {attendanceStats && Object.keys(attendanceStats).length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <p className="text-sm text-gray-600">Total Records</p>
            <p className="text-2xl font-bold text-gray-900">{attendanceStats.total || 0}</p>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <p className="text-sm text-gray-600">Present</p>
            <p className="text-2xl font-bold text-green-600">{attendanceStats.present || 0}</p>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <p className="text-sm text-gray-600">Absent</p>
            <p className="text-2xl font-bold text-red-600">{attendanceStats.absent || 0}</p>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <p className="text-sm text-gray-600">Late</p>
            <p className="text-2xl font-bold text-yellow-600">{attendanceStats.late || 0}</p>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <p className="text-sm text-gray-600">Attendance Rate</p>
            <p className="text-2xl font-bold text-purple-600">
              {attendanceStats.attendanceRate?.toFixed(1) || 0}%
            </p>
          </div>
        </div>
      )}

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Trend Line Chart */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h4 className="text-sm font-medium text-gray-700 mb-4 flex items-center">
            <TrendingUp className="w-4 h-4 mr-2 text-purple-600" />
            Daily Attendance Trend
          </h4>
          <div className="h-80">
            {dailyTrend.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={dailyTrend.slice(-30)} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fontSize: 12 }}
                    tickFormatter={(value) => {
                      const date = new Date(value);
                      return `${date.getMonth()+1}/${date.getDate()}`;
                    }}
                  />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="present" 
                    name="Present" 
                    stroke={COLORS.present} 
                    strokeWidth={2}
                    dot={{ r: 3 }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="absent" 
                    name="Absent" 
                    stroke={COLORS.absent} 
                    strokeWidth={2}
                    dot={{ r: 3 }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="late" 
                    name="Late" 
                    stroke={COLORS.late} 
                    strokeWidth={2}
                    dot={{ r: 3 }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="excused" 
                    name="Excused" 
                    stroke={COLORS.excused} 
                    strokeWidth={2}
                    dot={{ r: 3 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-500">
                No trend data available
              </div>
            )}
          </div>
        </div>

        {/* Status Distribution Pie Chart */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h4 className="text-sm font-medium text-gray-700 mb-4 flex items-center">
            <PieChart className="w-4 h-4 mr-2 text-purple-600" />
            Status Distribution
          </h4>
          <div className="h-80">
            {statusDistribution.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <RePieChart>
                  <Pie
                    data={statusDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    labelLine={{ stroke: '#9ca3af', strokeWidth: 1 }}
                  >
                    {statusDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </RePieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-500">
                No distribution data available
              </div>
            )}
          </div>
        </div>

        {/* Weekly Comparison Bar Chart */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 lg:col-span-2">
          <h4 className="text-sm font-medium text-gray-700 mb-4 flex items-center">
            <BarChart3 className="w-4 h-4 mr-2 text-purple-600" />
            Weekly Comparison
          </h4>
          <div className="h-80">
            {weeklyComparison.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weeklyComparison} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="week" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="present" name="Present" fill={COLORS.present} />
                  <Bar dataKey="absent" name="Absent" fill={COLORS.absent} />
                  <Bar dataKey="late" name="Late" fill={COLORS.late} />
                  <Bar dataKey="excused" name="Excused" fill={COLORS.excused} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-500">
                No weekly data available
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Insights Section */}
      {attendanceStats && Object.keys(attendanceStats).length > 0 && (
        <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl border border-purple-200 p-6">
          <h4 className="text-sm font-medium text-purple-800 mb-3">📊 Key Insights</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-lg p-4 border border-purple-100">
              <p className="text-xs text-gray-500 mb-1">Average Attendance</p>
              <p className="text-2xl font-bold text-purple-600">
                {attendanceStats.attendanceRate?.toFixed(1) || 0}%
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {attendanceStats.attendanceRate >= 85 ? '🎉 Excellent' : 
                 attendanceStats.attendanceRate >= 75 ? '📈 Good' : 
                 '⚠️ Needs Improvement'}
              </p>
            </div>
            <div className="bg-white rounded-lg p-4 border border-purple-100">
              <p className="text-xs text-gray-500 mb-1">Most Common Status</p>
              <p className="text-2xl font-bold text-purple-600">
                {attendanceStats.present > attendanceStats.absent ? 'Present' : 'Absent'}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {Math.max(
                  attendanceStats.present || 0,
                  attendanceStats.absent || 0,
                  attendanceStats.late || 0,
                  attendanceStats.excused || 0
                )} records
              </p>
            </div>
            <div className="bg-white rounded-lg p-4 border border-purple-100">
              <p className="text-xs text-gray-500 mb-1">Total Days</p>
              <p className="text-2xl font-bold text-purple-600">
                {dailyTrend.length}
              </p>
              <p className="text-xs text-gray-500 mt-1">in selected period</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AttendanceCharts;