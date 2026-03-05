// src/components/Attendance/ReportSummary.jsx
import React from 'react';
import {
  TrendingUp,
  TrendingDown,
  Users,
  CheckCircle,
  XCircle,
  Clock,
  FileText,
  Calendar,
  Percent,
  Award,
  AlertCircle
} from 'lucide-react';
import { useAttendanceStore } from '../../stores/attendanceStore';

const ReportSummary = ({ courseId }) => {
  const {
    reportData,
    reportLoading,
    selectedDateRange
  } = useAttendanceStore();

  const { summary, comparison } = reportData;

  // Format percentage with + or - sign
  const formatChange = (value) => {
    if (value === undefined || value === null) return null;
    const sign = value > 0 ? '+' : '';
    const color = value > 0 ? 'text-green-600' : value < 0 ? 'text-red-600' : 'text-gray-600';
    return { sign, color, value: Math.abs(value).toFixed(1) };
  };

  const presentChange = formatChange(comparison?.change?.present);
  const absentChange = formatChange(comparison?.change?.absent);
  const lateChange = formatChange(comparison?.change?.late);
  const excusedChange = formatChange(comparison?.change?.excused);
  const rateChange = formatChange(comparison?.change?.rate);

  if (reportLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 animate-pulse">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
            <div className="h-8 bg-gray-200 rounded w-3/4 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-1/3"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Main Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Days Card */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Calendar className="w-5 h-5 text-purple-600" />
            </div>
            <span className="text-xs text-gray-500">Selected Period</span>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-gray-600">Total Days</p>
            <p className="text-3xl font-bold text-gray-900">{summary.totalDays || 0}</p>
            <p className="text-xs text-gray-500">
              {new Date(selectedDateRange.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {new Date(selectedDateRange.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </p>
          </div>
        </div>

        {/* Total Records Card */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <span className="text-xs text-gray-500">Total Entries</span>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-gray-600">Attendance Records</p>
            <p className="text-3xl font-bold text-gray-900">{summary.totalRecords || 0}</p>
            <p className="text-xs text-gray-500">
              Avg {(summary.totalRecords / (summary.totalDays || 1)).toFixed(1)} per day
            </p>
          </div>
        </div>

        {/* Attendance Rate Card */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-green-100 rounded-lg">
              <Percent className="w-5 h-5 text-green-600" />
            </div>
            <div className="flex items-center space-x-1">
              {rateChange && (
                <span className={`text-xs font-medium ${rateChange.color} flex items-center`}>
                  {rateChange.sign === '+' ? <TrendingUp className="w-3 h-3 mr-1" /> : <TrendingDown className="w-3 h-3 mr-1" />}
                  {rateChange.sign}{rateChange.value}%
                </span>
              )}
            </div>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-gray-600">Attendance Rate</p>
            <p className="text-3xl font-bold text-gray-900">{summary.attendanceRate?.toFixed(1) || 0}%</p>
            <p className="text-xs text-gray-500">
              {summary.attendanceRate >= 90 ? '🎉 Excellent' : 
               summary.attendanceRate >= 80 ? '📈 Good' : 
               summary.attendanceRate >= 70 ? '⚠️ Needs Improvement' : 
               '🔴 Critical'}
            </p>
          </div>
        </div>

        {/* Average Daily Attendance Card */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Award className="w-5 h-5 text-orange-600" />
            </div>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-gray-600">Daily Average</p>
            <p className="text-3xl font-bold text-gray-900">
              {summary.averageAttendance?.toFixed(1) || 0}
            </p>
            <p className="text-xs text-gray-500">
              students per day
            </p>
          </div>
        </div>
      </div>

      {/* Status Breakdown Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Present Card */}
        <div className="bg-gradient-to-br from-green-50 to-green-100/50 rounded-xl border border-green-200 p-6">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-green-200 rounded-lg">
                <CheckCircle className="w-5 h-5 text-green-700" />
              </div>
              <span className="font-medium text-green-800">Present</span>
            </div>
            {presentChange && (
              <span className={`text-xs font-medium ${presentChange.color} flex items-center bg-white px-2 py-1 rounded-full`}>
                {presentChange.sign === '+' ? <TrendingUp className="w-3 h-3 mr-1" /> : <TrendingDown className="w-3 h-3 mr-1" />}
                {presentChange.sign}{presentChange.value}%
              </span>
            )}
          </div>
          <div className="space-y-2">
            <p className="text-3xl font-bold text-gray-900">{summary.present || 0}</p>
            <div className="flex justify-between text-sm">
              <span className="text-green-700">
                {summary.totalRecords > 0 ? ((summary.present / summary.totalRecords) * 100).toFixed(1) : 0}% of total
              </span>
              <span className="text-gray-500">
                {summary.totalDays > 0 ? (summary.present / summary.totalDays).toFixed(1) : 0}/day
              </span>
            </div>
          </div>
        </div>

        {/* Absent Card */}
        <div className="bg-gradient-to-br from-red-50 to-red-100/50 rounded-xl border border-red-200 p-6">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-red-200 rounded-lg">
                <XCircle className="w-5 h-5 text-red-700" />
              </div>
              <span className="font-medium text-red-800">Absent</span>
            </div>
            {absentChange && (
              <span className={`text-xs font-medium ${absentChange.color} flex items-center bg-white px-2 py-1 rounded-full`}>
                {absentChange.sign === '+' ? <TrendingUp className="w-3 h-3 mr-1" /> : <TrendingDown className="w-3 h-3 mr-1" />}
                {absentChange.sign}{absentChange.value}%
              </span>
            )}
          </div>
          <div className="space-y-2">
            <p className="text-3xl font-bold text-gray-900">{summary.absent || 0}</p>
            <div className="flex justify-between text-sm">
              <span className="text-red-700">
                {summary.totalRecords > 0 ? ((summary.absent / summary.totalRecords) * 100).toFixed(1) : 0}% of total
              </span>
              <span className="text-gray-500">
                {summary.totalDays > 0 ? (summary.absent / summary.totalDays).toFixed(1) : 0}/day
              </span>
            </div>
          </div>
        </div>

        {/* Late Card */}
        <div className="bg-gradient-to-br from-yellow-50 to-yellow-100/50 rounded-xl border border-yellow-200 p-6">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-yellow-200 rounded-lg">
                <Clock className="w-5 h-5 text-yellow-700" />
              </div>
              <span className="font-medium text-yellow-800">Late</span>
            </div>
            {lateChange && (
              <span className={`text-xs font-medium ${lateChange.color} flex items-center bg-white px-2 py-1 rounded-full`}>
                {lateChange.sign === '+' ? <TrendingUp className="w-3 h-3 mr-1" /> : <TrendingDown className="w-3 h-3 mr-1" />}
                {lateChange.sign}{lateChange.value}%
              </span>
            )}
          </div>
          <div className="space-y-2">
            <p className="text-3xl font-bold text-gray-900">{summary.late || 0}</p>
            <div className="flex justify-between text-sm">
              <span className="text-yellow-700">
                {summary.totalRecords > 0 ? ((summary.late / summary.totalRecords) * 100).toFixed(1) : 0}% of total
              </span>
              <span className="text-gray-500">
                {summary.totalDays > 0 ? (summary.late / summary.totalDays).toFixed(1) : 0}/day
              </span>
            </div>
          </div>
        </div>

        {/* Excused Card */}
        <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-xl border border-blue-200 p-6">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-200 rounded-lg">
                <FileText className="w-5 h-5 text-blue-700" />
              </div>
              <span className="font-medium text-blue-800">Excused</span>
            </div>
            {excusedChange && (
              <span className={`text-xs font-medium ${excusedChange.color} flex items-center bg-white px-2 py-1 rounded-full`}>
                {excusedChange.sign === '+' ? <TrendingUp className="w-3 h-3 mr-1" /> : <TrendingDown className="w-3 h-3 mr-1" />}
                {excusedChange.sign}{excusedChange.value}%
              </span>
            )}
          </div>
          <div className="space-y-2">
            <p className="text-3xl font-bold text-gray-900">{summary.excused || 0}</p>
            <div className="flex justify-between text-sm">
              <span className="text-blue-700">
                {summary.totalRecords > 0 ? ((summary.excused / summary.totalRecords) * 100).toFixed(1) : 0}% of total
              </span>
              <span className="text-gray-500">
                {summary.totalDays > 0 ? (summary.excused / summary.totalDays).toFixed(1) : 0}/day
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Comparison with Previous Period */}
      {comparison?.currentPeriod && comparison?.previousPeriod && (
        <div className="bg-gradient-to-r from-gray-50 to-gray-100/50 rounded-xl border border-gray-200 p-6">
          <h4 className="text-sm font-medium text-gray-700 mb-4 flex items-center">
            <TrendingUp className="w-4 h-4 mr-2 text-purple-600" />
            Comparison with Previous Period
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-xs text-gray-500 mb-1">Present</p>
              <p className="text-lg font-semibold text-gray-900">
                {comparison.currentPeriod.present || 0}
                <span className="text-xs text-gray-500 ml-1">
                  vs {comparison.previousPeriod.present || 0}
                </span>
              </p>
              {presentChange && (
                <p className={`text-xs ${presentChange.color} flex items-center mt-1`}>
                  {presentChange.sign === '+' ? <TrendingUp className="w-3 h-3 mr-1" /> : <TrendingDown className="w-3 h-3 mr-1" />}
                  {presentChange.sign}{presentChange.value}%
                </p>
              )}
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Absent</p>
              <p className="text-lg font-semibold text-gray-900">
                {comparison.currentPeriod.absent || 0}
                <span className="text-xs text-gray-500 ml-1">
                  vs {comparison.previousPeriod.absent || 0}
                </span>
              </p>
              {absentChange && (
                <p className={`text-xs ${absentChange.color} flex items-center mt-1`}>
                  {absentChange.sign === '+' ? <TrendingUp className="w-3 h-3 mr-1" /> : <TrendingDown className="w-3 h-3 mr-1" />}
                  {absentChange.sign}{absentChange.value}%
                </p>
              )}
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Late</p>
              <p className="text-lg font-semibold text-gray-900">
                {comparison.currentPeriod.late || 0}
                <span className="text-xs text-gray-500 ml-1">
                  vs {comparison.previousPeriod.late || 0}
                </span>
              </p>
              {lateChange && (
                <p className={`text-xs ${lateChange.color} flex items-center mt-1`}>
                  {lateChange.sign === '+' ? <TrendingUp className="w-3 h-3 mr-1" /> : <TrendingDown className="w-3 h-3 mr-1" />}
                  {lateChange.sign}{lateChange.value}%
                </p>
              )}
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Excused</p>
              <p className="text-lg font-semibold text-gray-900">
                {comparison.currentPeriod.excused || 0}
                <span className="text-xs text-gray-500 ml-1">
                  vs {comparison.previousPeriod.excused || 0}
                </span>
              </p>
              {excusedChange && (
                <p className={`text-xs ${excusedChange.color} flex items-center mt-1`}>
                  {excusedChange.sign === '+' ? <TrendingUp className="w-3 h-3 mr-1" /> : <TrendingDown className="w-3 h-3 mr-1" />}
                  {excusedChange.sign}{excusedChange.value}%
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Alert for low attendance */}
      {summary.attendanceRate < 75 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <div className="flex items-center">
            <AlertCircle className="w-5 h-5 text-red-600 mr-3 flex-shrink-0" />
            <div>
              <h4 className="text-sm font-medium text-red-800">Low Attendance Alert</h4>
              <p className="text-sm text-red-700 mt-1">
                Attendance rate is below 75%. Consider reviewing attendance patterns and following up with students.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportSummary;