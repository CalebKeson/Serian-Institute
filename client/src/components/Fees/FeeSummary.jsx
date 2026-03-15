// src/components/Fees/FeeSummary.jsx
import React from 'react';
import {
  DollarSign,
  TrendingUp,
  Calendar,
  CreditCard,
  AlertCircle,
  CheckCircle,
  XCircle,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  Wallet,
  Landmark,
  Smartphone,
  PieChart
} from 'lucide-react';
import {
  formatCurrency,
  calculateProgress,
  getProgressColor,
  getFeeStatusBadge,
  getPaymentMethodInfo
} from '../../utils/feeFormatter';

const FeeSummary = ({
  summary = {
    totalFees: 0,
    totalPaid: 0,
    totalBalance: 0,
    overallPercentage: 0,
    paymentStatus: 'No Fees'
  },
  courseBreakdown = [],
  recentPayments = [],
  showDetails = true,
  onViewAllPayments,
  onRecordPayment,
  compact = false
}) => {
  const progressPercentage = calculateProgress(summary.totalPaid, summary.totalFees);
  const progressColor = getProgressColor(progressPercentage);
  const statusBadge = getFeeStatusBadge(
    summary.totalBalance === 0 ? 'paid' : 
    summary.totalPaid > 0 ? 'partial' : 'unpaid'
  );

  // Calculate monthly average
  const monthlyAverage = recentPayments.length > 0
    ? recentPayments.reduce((sum, p) => sum + p.amount, 0) / recentPayments.length
    : 0;

  // Get payment method breakdown from recent payments
  const methodBreakdown = recentPayments.reduce((acc, payment) => {
    const method = payment.paymentMethod;
    if (!acc[method]) {
      acc[method] = { count: 0, total: 0 };
    }
    acc[method].count++;
    acc[method].total += payment.amount;
    return acc;
  }, {});

  if (compact) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium text-gray-700">Fee Summary</h3>
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusBadge.color}`}>
            {statusBadge.icon} {statusBadge.label}
          </span>
        </div>

        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-xs text-gray-500">Total Fees</span>
            <span className="text-sm font-bold text-gray-900">{formatCurrency(summary.totalFees)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-xs text-gray-500">Paid</span>
            <span className="text-sm font-bold text-green-600">{formatCurrency(summary.totalPaid)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-xs text-gray-500">Balance</span>
            <span className={`text-sm font-bold ${summary.totalBalance === 0 ? 'text-green-600' : 'text-orange-600'}`}>
              {formatCurrency(summary.totalBalance)}
            </span>
          </div>

          <div className="pt-2">
            <div className="flex justify-between text-xs mb-1">
              <span className="text-gray-500">Progress</span>
              <span className="font-medium text-gray-700">{summary.overallPercentage}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all duration-500 ${progressColor}`}
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          </div>

          {onRecordPayment && (
            <button
              onClick={onRecordPayment}
              className="w-full mt-3 px-3 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors"
            >
              <CreditCard className="w-4 h-4 inline mr-2" />
              Record Payment
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-green-50 to-emerald-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <DollarSign className="w-5 h-5 text-green-600" />
            <h2 className="text-lg font-semibold text-gray-900">Fee Summary</h2>
          </div>
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusBadge.color}`}>
            {statusBadge.icon} {statusBadge.label}
          </span>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-xs text-gray-500 mb-1">Total Fees</p>
            <p className="text-xl font-bold text-gray-900">{formatCurrency(summary.totalFees)}</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-xs text-gray-500 mb-1">Total Paid</p>
            <p className="text-xl font-bold text-green-600">{formatCurrency(summary.totalPaid)}</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-xs text-gray-500 mb-1">Balance</p>
            <p className={`text-xl font-bold ${summary.totalBalance === 0 ? 'text-green-600' : 'text-orange-600'}`}>
              {formatCurrency(summary.totalBalance)}
            </p>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-xs text-gray-500 mb-1">Monthly Average</p>
            <p className="text-xl font-bold text-purple-600">{formatCurrency(monthlyAverage)}</p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Overall Payment Progress</span>
            <span className="text-sm font-medium text-gray-900">
              {formatCurrency(summary.totalPaid)} / {formatCurrency(summary.totalFees)} ({summary.overallPercentage}%)
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className={`h-3 rounded-full transition-all duration-500 ${progressColor}`}
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>

        {/* Course Breakdown Section */}
        {showDetails && courseBreakdown.length > 0 && (
          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
              <PieChart className="w-4 h-4 mr-2 text-green-600" />
              Course-wise Breakdown
            </h3>
            <div className="space-y-4">
              {courseBreakdown.map((course, index) => {
                const courseProgress = calculateProgress(course.paid, course.price);
                const courseProgressColor = getProgressColor(courseProgress);
                const courseStatus = course.paid >= course.price ? 'paid' : course.paid > 0 ? 'partial' : 'unpaid';
                const courseStatusBadge = getFeeStatusBadge(courseStatus);

                return (
                  <div key={index} className="border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h4 className="font-medium text-gray-900">{course.courseName}</h4>
                        <p className="text-xs text-gray-500">{course.courseCode}</p>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${courseStatusBadge.color}`}>
                        {courseStatusBadge.label}
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-4 mb-3">
                      <div>
                        <p className="text-xs text-gray-500">Course Fee</p>
                        <p className="text-sm font-bold text-gray-900">{formatCurrency(course.price)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Paid</p>
                        <p className="text-sm font-bold text-green-600">{formatCurrency(course.paid)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Balance</p>
                        <p className={`text-sm font-bold ${course.balance === 0 ? 'text-green-600' : 'text-orange-600'}`}>
                          {formatCurrency(course.balance)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <div className="flex-1 bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all duration-500 ${courseProgressColor}`}
                          style={{ width: `${courseProgress}%` }}
                        />
                      </div>
                      <span className="text-xs font-medium text-gray-600">{courseProgress}%</span>
                    </div>

                    {course.paymentsCount > 0 && (
                      <div className="mt-2 text-xs text-gray-500">
                        {course.paymentsCount} payment{course.paymentsCount > 1 ? 's' : ''} • 
                        Last payment: {course.lastPaymentDate ? new Date(course.lastPaymentDate).toLocaleDateString() : 'N/A'}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Recent Payments Section */}
        {showDetails && recentPayments.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-gray-700 flex items-center">
                <Clock className="w-4 h-4 mr-2 text-green-600" />
                Recent Payments
              </h3>
              {onViewAllPayments && (
                <button
                  onClick={onViewAllPayments}
                  className="text-sm text-green-600 hover:text-green-700"
                >
                  View All →
                </button>
              )}
            </div>

            <div className="space-y-3">
              {recentPayments.slice(0, 5).map((payment, index) => {
                const methodInfo = getPaymentMethodInfo(payment.paymentMethod);
                return (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className={`p-2 rounded-lg ${methodInfo.bgColor}`}>
                        {payment.paymentMethod === 'mpesa' && <Smartphone className={`w-4 h-4 ${methodInfo.textColor}`} />}
                        {(payment.paymentMethod === 'cooperative_bank' || payment.paymentMethod === 'family_bank') && 
                          <Landmark className={`w-4 h-4 ${methodInfo.textColor}`} />
                        }
                        {payment.paymentMethod === 'cash' && <Wallet className={`w-4 h-4 ${methodInfo.textColor}`} />}
                        {!['mpesa', 'cooperative_bank', 'family_bank', 'cash'].includes(payment.paymentMethod) && 
                          <CreditCard className={`w-4 h-4 ${methodInfo.textColor}`} />
                        }
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {formatCurrency(payment.amount)}
                        </p>
                        <p className="text-xs text-gray-500">
                          {payment.paymentForDisplay} • {new Date(payment.paymentDate).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      payment.status === 'completed' ? 'bg-green-100 text-green-800' :
                      payment.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {payment.status}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Payment Method Breakdown */}
        {showDetails && Object.keys(methodBreakdown).length > 0 && (
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
              <TrendingUp className="w-4 h-4 mr-2 text-green-600" />
              Payment Method Breakdown
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {Object.entries(methodBreakdown).map(([method, data]) => {
                const methodInfo = getPaymentMethodInfo(method);
                return (
                  <div key={method} className="p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-2 mb-2">
                      <div className={`w-2 h-2 rounded-full bg-${methodInfo.color}-500`} />
                      <span className="text-xs font-medium text-gray-700">{methodInfo.label}</span>
                    </div>
                    <p className="text-sm font-bold text-gray-900">{formatCurrency(data.total)}</p>
                    <p className="text-xs text-gray-500">{data.count} payments</p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Quick Stats */}
        {showDetails && (
          <div className="mt-6 grid grid-cols-2 gap-4 pt-4 border-t border-gray-200">
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <div>
                <p className="text-xs text-gray-500">Payment Rate</p>
                <p className="text-sm font-bold text-gray-900">{summary.overallPercentage}%</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Calendar className="w-4 h-4 text-blue-600" />
              <div>
                <p className="text-xs text-gray-500">Total Payments</p>
                <p className="text-sm font-bold text-gray-900">{recentPayments.length}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer Actions */}
      {onRecordPayment && (
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
          <button
            onClick={onRecordPayment}
            className="w-full flex items-center justify-center px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors"
          >
            <CreditCard className="w-4 h-4 mr-2" />
            Record New Payment
          </button>
        </div>
      )}
    </div>
  );
};

export default FeeSummary;