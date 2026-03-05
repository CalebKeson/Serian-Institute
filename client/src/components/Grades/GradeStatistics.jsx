// src/components/Grades/GradeStatistics.jsx
import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  PieChart,
  TrendingUp,
  Users,
  Award,
  Percent,
  Download,
  Calendar,
  Filter,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  CheckCircle,
  XCircle,
  Clock
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
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import { useGradeStore } from '../../stores/gradeStore';
import { gradeAPI } from '../../services/gradeAPI';
import toast from 'react-hot-toast';

const COLORS = {
  'A': '#10b981',
  'B': '#3b82f6',
  'C': '#f59e0b',
  'D': '#f97316',
  'F': '#ef4444',
  'pass': '#10b981',
  'fail': '#ef4444'
};

const GradeStatistics = ({ courseId, studentId, view = 'course' }) => {
  const {
    gradeStatistics,
    fetchGradeStatistics,
    loading
  } = useGradeStore();

  const [dateRange, setDateRange] = useState('term');
  const [selectedTerm, setSelectedTerm] = useState('');
  const [selectedYear, setSelectedYear] = useState('');
  const [chartType, setChartType] = useState('distribution');
  const [expandedSection, setExpandedSection] = useState('overview');
  const [showDetails, setShowDetails] = useState(false);
  const [hasData, setHasData] = useState(false);

  // Terms and academic years
  const terms = gradeAPI.getTerms();
  const academicYears = gradeAPI.getAcademicYears();

  // Load statistics on mount and when filters change
  useEffect(() => {
    if ((courseId || studentId) && (courseId !== 'undefined' && studentId !== 'undefined')) {
      loadStatistics();
    }
  }, [courseId, studentId, selectedTerm, selectedYear]);

  const loadStatistics = async () => {
    if (!courseId && !studentId) return;
    
    const params = {};
    if (selectedTerm) params.term = selectedTerm;
    if (selectedYear) params.academicYear = selectedYear;
    
    const result = await fetchGradeStatistics(courseId || studentId, params);
    if (result?.success && result.data) {
      setHasData(true);
    }
  };

  const { overview = {}, distribution = [], byAssessmentType = [], topStudents = [] } = gradeStatistics;

  // Prepare data for grade distribution chart
  const distributionData = distribution.map(item => ({
    name: item.grade || item._id,
    value: item.count,
    color: COLORS[item.grade?.[0]] || '#6b7280'
  })).filter(item => item.value > 0);

  // Prepare data for assessment type performance
  const assessmentData = byAssessmentType.map(item => ({
    name: item._id,
    average: Math.round(item.averagePercentage * 10) / 10,
    count: item.count,
    highest: item.highestScore,
    lowest: item.lowestScore
  }));

  // Prepare data for trend chart (mock data for now - replace with real data from API)
  const trendData = [
    { name: 'Week 1', average: 85, classAvg: 82 },
    { name: 'Week 2', average: 87, classAvg: 83 },
    { name: 'Week 3', average: 82, classAvg: 81 },
    { name: 'Week 4', average: 89, classAvg: 84 },
    { name: 'Week 5', average: 86, classAvg: 83 },
    { name: 'Week 6', average: 84, classAvg: 82 }
  ];

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="text-sm font-medium text-gray-900 mb-2">{label}</p>
          {payload.map((entry, index) => (
            <div key={index} className="flex items-center justify-between text-xs mb-1">
              <span style={{ color: entry.color }}>{entry.name}:</span>
              <span className="font-medium ml-4">{entry.value}%</span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  const handleExportStats = () => {
    // Create CSV data
    const headers = ['Metric', 'Value'];
    const data = [
      ['Average Score', overview.averageScore],
      ['Average Percentage', `${overview.averagePercentage}%`],
      ['Highest Score', overview.highestScore],
      ['Lowest Score', overview.lowestScore],
      ['Total Assessments', overview.totalAssessments],
      ['Total Students', overview.totalStudents]
    ];

    const csvContent = [headers, ...data]
      .map(row => row.join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `grade_statistics_${courseId || studentId}_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);

    toast.success('Statistics exported successfully!');
  };

  // Don't render if no valid ID
  if ((view === 'course' && !courseId) || (view === 'student' && !studentId)) {
    return null;
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 animate-pulse">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
              <div className="h-8 bg-gray-200 rounded w-3/4"></div>
            </div>
          ))}
        </div>
        <div className="h-80 bg-gray-100 rounded-xl animate-pulse"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
          <div className="flex items-center space-x-2">
            <BarChart3 className="w-5 h-5 text-purple-600" />
            <h3 className="text-lg font-semibold text-gray-900">
              {view === 'course' ? 'Course Grade Analytics' : 'Student Performance Analytics'}
            </h3>
          </div>

          <div className="flex items-center space-x-3">
            <select
              value={selectedTerm}
              onChange={(e) => setSelectedTerm(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white"
            >
              <option value="">All Terms</option>
              {terms.map(term => (
                <option key={term.value} value={term.value}>{term.label}</option>
              ))}
            </select>

            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white"
            >
              <option value="">All Years</option>
              {academicYears.map(year => (
                <option key={year.value} value={year.value}>{year.label}</option>
              ))}
            </select>

            <button
              onClick={handleExportStats}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              title="Export Statistics"
            >
              <Download className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Percent className="w-5 h-5 text-blue-600" />
            </div>
            <span className="text-xs text-gray-400">Average</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {overview.averagePercentage?.toFixed(1) || 0}%
          </p>
          <p className="text-sm text-gray-500 mt-1">Average Percentage</p>
          <div className="mt-2 w-full bg-gray-200 rounded-full h-1.5">
            <div
              className="h-1.5 rounded-full bg-blue-500"
              style={{ width: `${Math.min(100, overview.averagePercentage || 0)}%` }}
            />
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <div className="p-2 bg-green-100 rounded-lg">
              <Award className="w-5 h-5 text-green-600" />
            </div>
            <span className="text-xs text-gray-400">Highest</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {overview.highestScore || 0}
          </p>
          <p className="text-sm text-gray-500 mt-1">Highest Score</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <div className="p-2 bg-red-100 rounded-lg">
              <TrendingUp className="w-5 h-5 text-red-600" />
            </div>
            <span className="text-xs text-gray-400">Lowest</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {overview.lowestScore || 0}
          </p>
          <p className="text-sm text-gray-500 mt-1">Lowest Score</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Users className="w-5 h-5 text-purple-600" />
            </div>
            <span className="text-xs text-gray-400">Total</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {overview.totalAssessments || 0}
          </p>
          <p className="text-sm text-gray-500 mt-1">Assessments</p>
        </div>
      </div>

      {/* Chart Type Selector */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => setChartType('distribution')}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              chartType === 'distribution'
                ? 'bg-purple-600 text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <PieChart className="w-4 h-4 inline mr-2" />
            Grade Distribution
          </button>
          <button
            onClick={() => setChartType('assessment')}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              chartType === 'assessment'
                ? 'bg-purple-600 text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <BarChart3 className="w-4 h-4 inline mr-2" />
            Assessment Performance
          </button>
          <button
            onClick={() => setChartType('trend')}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              chartType === 'trend'
                ? 'bg-purple-600 text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <TrendingUp className="w-4 h-4 inline mr-2" />
            Performance Trend
          </button>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Main Chart */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 lg:col-span-2">
          <h4 className="text-sm font-medium text-gray-700 mb-4">
            {chartType === 'distribution' && 'Grade Distribution'}
            {chartType === 'assessment' && 'Assessment Type Performance'}
            {chartType === 'trend' && 'Performance Trend Over Time'}
          </h4>
          <div className="h-80 w-full">
            {chartType === 'distribution' && distributionData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <RePieChart>
                  <Pie
                    data={distributionData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    labelLine={{ stroke: '#9ca3af', strokeWidth: 1 }}
                  >
                    {distributionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </RePieChart>
              </ResponsiveContainer>
            ) : chartType === 'assessment' && assessmentData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={assessmentData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} domain={[0, 100]} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="average" name="Average %" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            ) : chartType === 'trend' ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Area type="monotone" dataKey="average" stackId="1" stroke="#8884d8" fill="#8884d8" />
                  <Area type="monotone" dataKey="classAvg" stackId="2" stroke="#82ca9d" fill="#82ca9d" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-500">
                No data available for this chart
              </div>
            )}
          </div>
        </div>

        {/* Assessment Type Breakdown */}
        {assessmentData.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h4 className="text-sm font-medium text-gray-700 mb-4">Assessment Breakdown</h4>
            <div className="space-y-4">
              {assessmentData.map((item, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700 capitalize">
                      {item.name}
                    </span>
                    <span className="text-sm text-gray-500">
                      {item.count} assessments
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div
                        className="h-2 rounded-full bg-purple-500"
                        style={{ width: `${item.average}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium text-gray-700">
                      {item.average}%
                    </span>
                  </div>
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>Highest: {item.highest}</span>
                    <span>Lowest: {item.lowest}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Top Students (for course view) */}
        {view === 'course' && topStudents.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h4 className="text-sm font-medium text-gray-700 mb-4 flex items-center">
              <Award className="w-4 h-4 mr-2 text-yellow-500" />
              Top Performing Students
            </h4>
            <div className="space-y-3">
              {topStudents.map((student, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <span className="text-lg font-bold text-yellow-600">#{index + 1}</span>
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {student.studentInfo?.[0]?.user?.name || 'Student'}
                      </p>
                      <p className="text-xs text-gray-500">
                        {student.totalAssessments} assessments
                      </p>
                    </div>
                  </div>
                  <span className="text-lg font-bold text-green-600">
                    {student.averagePercentage?.toFixed(1)}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Detailed Statistics Table */}
      {distributionData.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="w-full px-6 py-4 flex items-center justify-between bg-gray-50 hover:bg-gray-100 transition-colors"
          >
            <span className="font-medium text-gray-900">Detailed Statistics</span>
            {showDetails ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </button>

          {showDetails && (
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Summary Stats */}
                <div>
                  <h5 className="text-sm font-medium text-gray-700 mb-3">Summary</h5>
                  <dl className="space-y-2">
                    <div className="flex justify-between py-2 border-b border-gray-100">
                      <dt className="text-sm text-gray-500">Total Assessments</dt>
                      <dd className="text-sm font-medium text-gray-900">{overview.totalAssessments || 0}</dd>
                    </div>
                    <div className="flex justify-between py-2 border-b border-gray-100">
                      <dt className="text-sm text-gray-500">Total Students</dt>
                      <dd className="text-sm font-medium text-gray-900">{overview.totalStudents || 0}</dd>
                    </div>
                    <div className="flex justify-between py-2 border-b border-gray-100">
                      <dt className="text-sm text-gray-500">Average Score</dt>
                      <dd className="text-sm font-medium text-gray-900">{overview.averageScore?.toFixed(1) || 0}</dd>
                    </div>
                  </dl>
                </div>

                {/* Grade Distribution Table */}
                <div>
                  <h5 className="text-sm font-medium text-gray-700 mb-3">Grade Distribution</h5>
                  <table className="min-w-full">
                    <thead>
                      <tr className="text-xs text-gray-500">
                        <th className="text-left py-2">Grade</th>
                        <th className="text-right py-2">Count</th>
                        <th className="text-right py-2">Percentage</th>
                      </tr>
                    </thead>
                    <tbody>
                      {distribution.map((item, index) => {
                        const percentage = overview.totalAssessments > 0 
                          ? ((item.count / overview.totalAssessments) * 100).toFixed(1)
                          : 0;
                        return (
                          <tr key={index} className="border-t border-gray-100">
                            <td className="py-2 text-sm font-medium text-gray-900">
                              {item.grade || item._id}
                            </td>
                            <td className="py-2 text-sm text-right text-gray-600">
                              {item.count}
                            </td>
                            <td className="py-2 text-sm text-right text-gray-600">
                              {percentage}%
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Insights Section */}
      {overview.totalAssessments > 0 && (
        <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl border border-purple-200 p-6">
          <h4 className="text-sm font-medium text-purple-800 mb-4">📊 Key Insights</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-lg p-4 border border-purple-100">
              <p className="text-xs text-gray-500 mb-1">Class Performance</p>
              <p className="text-lg font-bold text-purple-600">
                {overview.averagePercentage >= 70 ? 'Good' : 'Needs Improvement'}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {overview.averagePercentage?.toFixed(1)}% class average
              </p>
            </div>
            <div className="bg-white rounded-lg p-4 border border-purple-100">
              <p className="text-xs text-gray-500 mb-1">Most Common Grade</p>
              <p className="text-lg font-bold text-purple-600">
                {distribution.length > 0 ? distribution.reduce((max, item) => 
                  item.count > max.count ? item : max
                ).grade || 'N/A' : 'N/A'}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Based on {overview.totalAssessments} assessments
              </p>
            </div>
            <div className="bg-white rounded-lg p-4 border border-purple-100">
              <p className="text-xs text-gray-500 mb-1">Passing Rate</p>
              <p className="text-lg font-bold text-purple-600">
                {distribution.filter(d => 
                  (d.grade?.[0] || d._id?.[0]) !== 'F' && 
                  (d.grade?.[0] || d._id?.[0]) !== 'D'
                ).reduce((sum, item) => sum + item.count, 0) / (overview.totalAssessments || 1) * 100 || 0}%
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Students scoring ≥ 60%
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GradeStatistics;