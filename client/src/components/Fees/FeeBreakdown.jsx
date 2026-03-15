// src/components/Fees/FeeBreakdown.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import {
  BookOpen,
  DollarSign,
  TrendingUp,
  Calendar,
  CreditCard,
  CheckCircle,
  AlertCircle,
  XCircle,
  ChevronDown,
  ChevronUp,
  PieChart,
  Clock,
  Award,
  Download,
  Eye
} from 'lucide-react';
import { formatCurrency, calculateProgress, getProgressColor, getFeeStatusBadge } from '../../utils/feeFormatter';

const FeeBreakdown = ({
  courses = [],
  studentId,
  onRecordPayment,
  onViewCourse,
  showActions = true,
  compact = false,
  title = 'Course Fee Breakdown'
}) => {
  const navigate = useNavigate();
  const [expandedCourses, setExpandedCourses] = useState([]);
  const [sortConfig, setSortConfig] = useState({
    key: 'balance',
    direction: 'desc'
  });

  // Sort courses
  const sortedCourses = [...courses].sort((a, b) => {
    let aVal = a[sortConfig.key];
    let bVal = b[sortConfig.key];

    if (sortConfig.key === 'courseName') {
      aVal = a.courseName || '';
      bVal = b.courseName || '';
    } else if (sortConfig.key === 'percentage') {
      aVal = a.percentage || 0;
      bVal = b.percentage || 0;
    }

    if (typeof aVal === 'string') {
      aVal = aVal.toLowerCase();
      bVal = bVal.toLowerCase();
    }

    if (sortConfig.direction === 'asc') {
      return aVal > bVal ? 1 : -1;
    } else {
      return aVal < bVal ? 1 : -1;
    }
  });

  const handleSort = (key) => {
    setSortConfig({
      key,
      direction: sortConfig.key === key && sortConfig.direction === 'asc' ? 'desc' : 'asc'
    });
  };

  const toggleCourseExpand = (courseId) => {
    setExpandedCourses(prev =>
      prev.includes(courseId)
        ? prev.filter(id => id !== courseId)
        : [...prev, courseId]
    );
  };

  const handleViewCourse = (courseId) => {
    if (onViewCourse) {
      onViewCourse(courseId);
    } else {
      navigate(`/courses/${courseId}`);
    }
  };

  // FIXED: Handle record payment with navigation
  const handleRecordPayment = (course) => {
    if (onRecordPayment) {
      onRecordPayment(course);
    } else {
      // Default navigation to record payment page with student and course
      const params = new URLSearchParams();
      params.append('studentId', studentId);
      params.append('courseId', course.courseId);
      navigate(`/fees/record-payment?${params.toString()}`);
    }
  };

  const calculateTotals = () => {
    return {
      totalFees: courses.reduce((sum, c) => sum + (c.price || 0), 0),
      totalPaid: courses.reduce((sum, c) => sum + (c.paid || 0), 0),
      totalBalance: courses.reduce((sum, c) => sum + (c.balance || 0), 0)
    };
  };

  const totals = calculateTotals();
  const overallProgress = calculateProgress(totals.totalPaid, totals.totalFees);
  const overallProgressColor = getProgressColor(overallProgress);

  if (compact) {
    return (
      <div className="space-y-3">
        {sortedCourses.slice(0, 3).map((course) => {
          const progress = calculateProgress(course.paid, course.price);
          const status = getFeeStatusBadge(
            course.balance === 0 ? 'paid' : course.paid > 0 ? 'partial' : 'unpaid'
          );

          return (
            <div key={course.courseId} className="bg-gray-50 rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="text-sm font-medium text-gray-900">{course.courseName}</p>
                  <p className="text-xs text-gray-500">{course.courseCode}</p>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${status.color}`}>
                  {status.label}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-xs mb-2">
                <div>
                  <p className="text-gray-500">Fee</p>
                  <p className="font-medium text-gray-900">{formatCurrency(course.price)}</p>
                </div>
                <div>
                  <p className="text-gray-500">Paid</p>
                  <p className="font-medium text-green-600">{formatCurrency(course.paid)}</p>
                </div>
                <div>
                  <p className="text-gray-500">Balance</p>
                  <p className="font-medium text-orange-600">{formatCurrency(course.balance)}</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <div className="flex-1 bg-gray-200 rounded-full h-1.5">
                  <div
                    className={`h-1.5 rounded-full ${getProgressColor(progress)}`}
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <span className="text-xs font-medium text-gray-600">{progress}%</span>
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-green-50 to-emerald-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <PieChart className="w-5 h-5 text-green-600" />
            <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
            <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
              {courses.length} courses
            </span>
          </div>

          {/* Overall Progress */}
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <p className="text-xs text-gray-500">Overall Progress</p>
              <p className="text-sm font-bold text-gray-900">{overallProgress}%</p>
            </div>
            <div className="w-32 bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full ${overallProgressColor}`}
                style={{ width: `${overallProgress}%` }}
              />
            </div>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-4 mt-4">
          <div className="bg-white rounded-lg p-2 text-center">
            <p className="text-xs text-gray-500">Total Fees</p>
            <p className="text-lg font-bold text-gray-900">{formatCurrency(totals.totalFees)}</p>
          </div>
          <div className="bg-white rounded-lg p-2 text-center">
            <p className="text-xs text-gray-500">Total Paid</p>
            <p className="text-lg font-bold text-green-600">{formatCurrency(totals.totalPaid)}</p>
          </div>
          <div className="bg-white rounded-lg p-2 text-center">
            <p className="text-xs text-gray-500">Balance</p>
            <p className="text-lg font-bold text-orange-600">{formatCurrency(totals.totalBalance)}</p>
          </div>
        </div>
      </div>

      {/* Table Header */}
      <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-3 bg-gray-50 border-b border-gray-200 text-xs font-medium text-gray-500 uppercase tracking-wider">
        <div className="col-span-4 cursor-pointer hover:text-gray-700" onClick={() => handleSort('courseName')}>
          Course
          {sortConfig.key === 'courseName' && (
            <span className="ml-1">{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
          )}
        </div>
        <div className="col-span-1 text-right cursor-pointer hover:text-gray-700" onClick={() => handleSort('price')}>
          Fee
          {sortConfig.key === 'price' && (
            <span className="ml-1">{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
          )}
        </div>
        <div className="col-span-1 text-right cursor-pointer hover:text-gray-700" onClick={() => handleSort('paid')}>
          Paid
          {sortConfig.key === 'paid' && (
            <span className="ml-1">{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
          )}
        </div>
        <div className="col-span-1 text-right cursor-pointer hover:text-gray-700" onClick={() => handleSort('balance')}>
          Balance
          {sortConfig.key === 'balance' && (
            <span className="ml-1">{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
          )}
        </div>
        <div className="col-span-3 text-center">Progress</div>
        <div className="col-span-1 text-center">Status</div>
        {showActions && <div className="col-span-1 text-right">Actions</div>}
      </div>

      {/* Course Rows */}
      <div className="divide-y divide-gray-200">
        {sortedCourses.map((course) => {
          const progress = calculateProgress(course.paid, course.price);
          const progressColor = getProgressColor(progress);
          const status = getFeeStatusBadge(
            course.balance === 0 ? 'paid' : course.paid > 0 ? 'partial' : 'unpaid'
          );
          const StatusIcon = status.icon === '✅' ? CheckCircle : 
                           status.icon === '⚠️' ? AlertCircle : XCircle;
          const isExpanded = expandedCourses.includes(course.courseId);

          return (
            <React.Fragment key={course.courseId}>
              {/* Desktop View */}
              <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-4 hover:bg-gray-50 transition-colors">
                <div className="col-span-4">
                  <div className="flex items-center space-x-3">
                    <div className="h-10 w-10 bg-gradient-to-r from-green-600 to-emerald-700 rounded-lg flex items-center justify-center">
                      <span className="text-white font-bold text-sm">
                        {course.courseCode?.charAt(0) || 'C'}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{course.courseName}</p>
                      <p className="text-xs text-gray-500">{course.courseCode}</p>
                    </div>
                  </div>
                </div>
                <div className="col-span-1 text-right font-medium text-gray-900">
                  {formatCurrency(course.price)}
                </div>
                <div className="col-span-1 text-right font-medium text-green-600">
                  {formatCurrency(course.paid)}
                </div>
                <div className="col-span-1 text-right font-bold text-orange-600">
                  {formatCurrency(course.balance)}
                </div>
                <div className="col-span-3">
                  <div className="flex items-center space-x-2">
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${progressColor}`}
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    <span className="text-xs font-medium text-gray-600 min-w-[40px]">
                      {progress}%
                    </span>
                  </div>
                </div>
                <div className="col-span-1 text-center">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${status.color}`}>
                    <StatusIcon className="w-3 h-3 mr-1" />
                    {status.label}
                  </span>
                </div>
                {showActions && (
                  <div className="col-span-1 text-right">
                    <div className="flex items-center justify-end space-x-2">
                      <button
                        onClick={() => toggleCourseExpand(course.courseId)}
                        className="text-gray-400 hover:text-gray-600 p-1 rounded hover:bg-gray-100 transition-colors"
                        title="View details"
                      >
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                      <button
                        onClick={() => handleViewCourse(course.courseId)}
                        className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50 transition-colors"
                        title="View course"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleRecordPayment(course)}
                        className="text-green-600 hover:text-green-900 p-1 rounded hover:bg-green-50 transition-colors"
                        title="Record payment"
                      >
                        <CreditCard className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Mobile View */}
              <div className="md:hidden p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-3">
                    <div className="h-10 w-10 bg-gradient-to-r from-green-600 to-emerald-700 rounded-lg flex items-center justify-center">
                      <span className="text-white font-bold text-sm">
                        {course.courseCode?.charAt(0) || 'C'}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{course.courseName}</p>
                      <p className="text-xs text-gray-500">{course.courseCode}</p>
                    </div>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${status.color}`}>
                    {status.label}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 mb-3">
                  <div className="text-center">
                    <p className="text-xs text-gray-500">Fee</p>
                    <p className="text-sm font-bold text-gray-900">{formatCurrency(course.price)}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-gray-500">Paid</p>
                    <p className="text-sm font-bold text-green-600">{formatCurrency(course.paid)}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-gray-500">Balance</p>
                    <p className="text-sm font-bold text-orange-600">{formatCurrency(course.balance)}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-2 mb-3">
                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${progressColor}`}
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <span className="text-xs font-medium text-gray-600">{progress}%</span>
                </div>

                {showActions && (
                  <div className="flex items-center justify-end space-x-2 pt-2 border-t border-gray-100">
                    <button
                      onClick={() => toggleCourseExpand(course.courseId)}
                      className="text-gray-600 hover:text-gray-900 px-3 py-1 text-sm"
                    >
                      {isExpanded ? 'Hide Details' : 'View Details'}
                    </button>
                    <button
                      onClick={() => handleViewCourse(course.courseId)}
                      className="text-blue-600 hover:text-blue-900 px-3 py-1 text-sm"
                    >
                      View Course
                    </button>
                    <button
                      onClick={() => handleRecordPayment(course)}
                      className="text-green-600 hover:text-green-900 px-3 py-1 text-sm"
                    >
                      Pay
                    </button>
                  </div>
                )}
              </div>

              {/* Expanded Details */}
              {isExpanded && (
                <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Payment History */}
                    {course.payments && course.payments.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                          <Clock className="w-4 h-4 mr-2 text-gray-500" />
                          Recent Payments
                        </h4>
                        <div className="space-y-2">
                          {course.payments.slice(0, 3).map((payment, idx) => (
                            <div key={idx} className="flex items-center justify-between text-sm bg-white p-2 rounded border border-gray-200">
                              <div>
                                <p className="font-medium text-gray-900">{formatCurrency(payment.amount)}</p>
                                <p className="text-xs text-gray-500">
                                  {new Date(payment.paymentDate).toLocaleDateString()}
                                </p>
                              </div>
                              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                payment.status === 'completed' ? 'bg-green-100 text-green-800' :
                                payment.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-red-100 text-red-800'
                              }`}>
                                {payment.status}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Course Info */}
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                        <BookOpen className="w-4 h-4 mr-2 text-gray-500" />
                        Course Information
                      </h4>
                      <dl className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <dt className="text-gray-500">Duration:</dt>
                          <dd className="font-medium text-gray-900">{course.duration || 'N/A'}</dd>
                        </div>
                        <div className="flex justify-between">
                          <dt className="text-gray-500">Instructor:</dt>
                          <dd className="font-medium text-gray-900">{course.instructor || 'N/A'}</dd>
                        </div>
                        <div className="flex justify-between">
                          <dt className="text-gray-500">Last Payment:</dt>
                          <dd className="font-medium text-gray-900">
                            {course.lastPaymentDate ? new Date(course.lastPaymentDate).toLocaleDateString() : 'N/A'}
                          </dd>
                        </div>
                        <div className="flex justify-between">
                          <dt className="text-gray-500">Payments Count:</dt>
                          <dd className="font-medium text-gray-900">{course.paymentsCount || 0}</dd>
                        </div>
                      </dl>
                    </div>
                  </div>

                  {/* Export Option */}
                  <div className="mt-4 flex justify-end">
                    <button
                      onClick={() => {
                        // Export course payment data
                        const data = [['Date', 'Amount', 'Status']];
                        course.payments?.forEach(p => {
                          data.push([
                            new Date(p.paymentDate).toLocaleDateString(),
                            p.amount,
                            p.status
                          ]);
                        });
                        
                        const csv = data.map(row => row.join(',')).join('\n');
                        const blob = new Blob([csv], { type: 'text/csv' });
                        const url = window.URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `${course.courseCode}_payments.csv`;
                        a.click();
                        window.URL.revokeObjectURL(url);
                      }}
                      className="text-sm text-gray-600 hover:text-gray-900 flex items-center"
                    >
                      <Download className="w-4 h-4 mr-1" />
                      Export Payment History
                    </button>
                  </div>
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Footer */}
      {courses.length > 0 && (
        <div className="px-6 py-3 bg-gray-50 border-t border-gray-200">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center space-x-4">
              <span className="text-gray-500">
                {courses.length} course{courses.length > 1 ? 's' : ''}
              </span>
              <span className="flex items-center">
                <span className="w-2 h-2 rounded-full bg-green-500 mr-1"></span>
                Paid: {courses.filter(c => c.balance === 0).length}
              </span>
              <span className="flex items-center">
                <span className="w-2 h-2 rounded-full bg-yellow-500 mr-1"></span>
                Partial: {courses.filter(c => c.paid > 0 && c.balance > 0).length}
              </span>
              <span className="flex items-center">
                <span className="w-2 h-2 rounded-full bg-red-500 mr-1"></span>
                Unpaid: {courses.filter(c => c.paid === 0).length}
              </span>
            </div>
            <div className="text-green-600 font-medium">
              Total Balance: {formatCurrency(totals.totalBalance)}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FeeBreakdown;