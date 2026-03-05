// src/components/Attendance/StudentAttendanceChart.jsx
import React, { useState, useEffect } from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { TrendingUp, PieChart as PieChartIcon, BarChart3 } from 'lucide-react';

const COLORS = {
  present: '#10b981',
  absent: '#ef4444',
  late: '#f59e0b',
  excused: '#3b82f6'
};

const StudentAttendanceChart = ({ studentId, courseId, attendanceData }) => {
  const [chartType, setChartType] = useState('line');
  const [processedData, setProcessedData] = useState({
    trendData: [],
    distributionData: [],
    courseBreakdown: [],
    stats: {
      total: 0,
      present: 0,
      absent: 0,
      late: 0,
      excused: 0,
      rate: 0
    }
  });

  useEffect(() => {
    if (attendanceData && attendanceData.length > 0) {
      processStudentData();
    }
  }, [attendanceData]);

  const processStudentData = () => {
    // Calculate stats
    const stats = attendanceData.reduce((acc, record) => {
      acc.total++;
      acc[record.status]++;
      return acc;
    }, { total: 0, present: 0, absent: 0, late: 0, excused: 0 });

    stats.rate = stats.total > 0 
      ? Math.round(((stats.present + stats.excused) / stats.total) * 100) 
      : 0;

    // Trend data by date
    const trendMap = new Map();
    attendanceData.forEach(record => {
      const date = new Date(record.date).toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      });
      
      if (!trendMap.has(date)) {
        trendMap.set(date, { date, present: 0, absent: 0, late: 0, excused: 0 });
      }
      
      const day = trendMap.get(date);
      day[record.status]++;
    });

    const trendData = Array.from(trendMap.values());

    // Distribution data
    const distributionData = [
      { name: 'Present', value: stats.present, color: COLORS.present },
      { name: 'Absent', value: stats.absent, color: COLORS.absent },
      { name: 'Late', value: stats.late, color: COLORS.late },
      { name: 'Excused', value: stats.excused, color: COLORS.excused }
    ].filter(item => item.value > 0);

    // Course breakdown
    const courseMap = new Map();
    attendanceData.forEach(record => {
      const courseName = record.course?.name || record.course?.courseCode || 'Unknown';
      
      if (!courseMap.has(courseName)) {
        courseMap.set(courseName, { 
          course: courseName, 
          present: 0, 
          absent: 0, 
          late: 0, 
          excused: 0,
          total: 0 
        });
      }
      
      const course = courseMap.get(courseName);
      course[record.status]++;
      course.total++;
    });

    const courseBreakdown = Array.from(courseMap.values()).map(course => ({
      ...course,
      rate: Math.round(((course.present + course.excused) / course.total) * 100)
    }));

    setProcessedData({ trendData, distributionData, courseBreakdown, stats });
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

  if (!attendanceData || attendanceData.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
        <p className="text-gray-500">No attendance data available for charts</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Student Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-xs text-gray-500">Total Days</p>
          <p className="text-xl font-bold text-gray-900">{processedData.stats.total}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-xs text-gray-500">Present</p>
          <p className="text-xl font-bold text-green-600">{processedData.stats.present}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-xs text-gray-500">Absent</p>
          <p className="text-xl font-bold text-red-600">{processedData.stats.absent}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-xs text-gray-500">Late</p>
          <p className="text-xl font-bold text-yellow-600">{processedData.stats.late}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-xs text-gray-500">Attendance Rate</p>
          <p className="text-xl font-bold text-blue-600">{processedData.stats.rate}%</p>
        </div>
      </div>

      {/* Chart Type Selector */}
      <div className="flex space-x-2 border-b border-gray-200 pb-2">
        <button
          onClick={() => setChartType('line')}
          className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
            chartType === 'line'
              ? 'bg-purple-100 text-purple-700'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          <TrendingUp className="w-4 h-4 inline mr-2" />
          Trend
        </button>
        <button
          onClick={() => setChartType('pie')}
          className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
            chartType === 'pie'
              ? 'bg-purple-100 text-purple-700'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          <PieChartIcon className="w-4 h-4 inline mr-2" />
          Distribution
        </button>
        <button
          onClick={() => setChartType('bar')}
          className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
            chartType === 'bar'
              ? 'bg-purple-100 text-purple-700'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          <BarChart3 className="w-4 h-4 inline mr-2" />
          Courses
        </button>
      </div>

      {/* Chart Display */}
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          {chartType === 'line' && (
            <LineChart data={processedData.trendData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="present" 
                stroke={COLORS.present} 
                strokeWidth={2}
                dot={{ r: 3 }}
              />
              <Line 
                type="monotone" 
                dataKey="absent" 
                stroke={COLORS.absent} 
                strokeWidth={2}
                dot={{ r: 3 }}
              />
              <Line 
                type="monotone" 
                dataKey="late" 
                stroke={COLORS.late} 
                strokeWidth={2}
                dot={{ r: 3 }}
              />
              <Line 
                type="monotone" 
                dataKey="excused" 
                stroke={COLORS.excused} 
                strokeWidth={2}
                dot={{ r: 3 }}
              />
            </LineChart>
          )}

          {chartType === 'pie' && (
            <PieChart>
              <Pie
                data={processedData.distributionData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={2}
                dataKey="value"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              >
                {processedData.distributionData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          )}

          {chartType === 'bar' && (
            <BarChart data={processedData.courseBreakdown} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="course" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Legend />
              <Bar dataKey="present" name="Present" fill={COLORS.present} />
              <Bar dataKey="absent" name="Absent" fill={COLORS.absent} />
              <Bar dataKey="late" name="Late" fill={COLORS.late} />
              <Bar dataKey="excused" name="Excused" fill={COLORS.excused} />
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>

      {/* Course Breakdown Table */}
      {chartType === 'bar' && processedData.courseBreakdown.length > 0 && (
        <div className="mt-4 border-t border-gray-200 pt-4">
          <h5 className="text-sm font-medium text-gray-700 mb-3">Course Performance</h5>
          <div className="space-y-2">
            {processedData.courseBreakdown.map((course, index) => (
              <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                <span className="text-sm font-medium text-gray-700">{course.course}</span>
                <div className="flex items-center space-x-4">
                  <span className="text-xs text-gray-500">Rate: {course.rate}%</span>
                  <div className="w-24 bg-gray-200 rounded-full h-2">
                    <div
                      className="h-2 rounded-full bg-green-500"
                      style={{ width: `${course.rate}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentAttendanceChart;