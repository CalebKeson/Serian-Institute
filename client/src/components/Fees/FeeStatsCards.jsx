// src/components/Fees/FeeStatsCards.jsx
import React from 'react';
import {
  DollarSign,
  TrendingUp,
  Users,
  CreditCard,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  Wallet,
  Landmark,
  Smartphone,
  PieChart,
  AlertCircle,
  CheckCircle,
  Clock
} from 'lucide-react';
import { formatCurrency } from '../../utils/feeFormatter';

const FeeStatsCards = ({
  stats = {
    totalAmount: 0,
    totalPayments: 0,
    averageAmount: 0,
    minAmount: 0,
    maxAmount: 0
  },
  outstandingTotal = 0,
  outstandingCount = 0,
  paymentMethods = [],
  dateRange = 'month',
  onDateRangeChange,
  showDetails = true,
  compact = false,
  loading = false
}) => {
  // Calculate period label
  const getPeriodLabel = () => {
    switch (dateRange) {
      case 'today':
        return 'Today';
      case 'week':
        return 'This Week';
      case 'month':
        return 'This Month';
      case 'quarter':
        return 'This Quarter';
      case 'year':
        return 'This Year';
      default:
        return 'Period';
    }
  };

  // Calculate percentage change (mock data - replace with real data from API)
  const getPercentageChange = (value) => {
    // This would come from comparison with previous period
    const changes = {
      totalAmount: { value: 12.5, trend: 'up' },
      totalPayments: { value: 8.3, trend: 'up' },
      outstandingTotal: { value: 5.2, trend: 'down' },
      averageAmount: { value: 3.8, trend: 'up' }
    };
    return changes[value] || { value: 0, trend: 'stable' };
  };

  const totalAmountChange = getPercentageChange('totalAmount');
  const paymentsChange = getPercentageChange('totalPayments');
  const outstandingChange = getPercentageChange('outstandingTotal');

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 animate-pulse">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
            <div className="h-8 bg-gray-200 rounded w-3/4 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-1/3"></div>
          </div>
        ))}
      </div>
    );
  }

  if (compact) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg border border-green-200 p-3">
          <div className="flex items-center justify-between mb-1">
            <DollarSign className="w-4 h-4 text-green-600" />
            <span className="text-xs text-green-600">{getPeriodLabel()}</span>
          </div>
          <p className="text-lg font-bold text-gray-900">{formatCurrency(stats.totalAmount)}</p>
          <p className="text-xs text-gray-500">{stats.totalPayments} payments</p>
        </div>

        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg border border-blue-200 p-3">
          <div className="flex items-center justify-between mb-1">
            <TrendingUp className="w-4 h-4 text-blue-600" />
            <span className="text-xs text-blue-600">Average</span>
          </div>
          <p className="text-lg font-bold text-gray-900">{formatCurrency(stats.averageAmount)}</p>
          <p className="text-xs text-gray-500">per payment</p>
        </div>

        <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-lg border border-orange-200 p-3">
          <div className="flex items-center justify-between mb-1">
            <AlertCircle className="w-4 h-4 text-orange-600" />
            <span className="text-xs text-orange-600">Outstanding</span>
          </div>
          <p className="text-lg font-bold text-orange-600">{formatCurrency(outstandingTotal)}</p>
          <p className="text-xs text-gray-500">{outstandingCount} students</p>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg border border-purple-200 p-3">
          <div className="flex items-center justify-between mb-1">
            <CreditCard className="w-4 h-4 text-purple-600" />
            <span className="text-xs text-purple-600">Largest</span>
          </div>
          <p className="text-lg font-bold text-gray-900">{formatCurrency(stats.maxAmount)}</p>
          <p className="text-xs text-gray-500">single payment</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Date Range Selector */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Calendar className="w-4 h-4 text-gray-400" />
          <span className="text-sm text-gray-600">Period:</span>
          <select
            value={dateRange}
            onChange={(e) => onDateRangeChange?.(e.target.value)}
            className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white"
          >
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="quarter">This Quarter</option>
            <option value="year">This Year</option>
            <option value="custom">Custom Range</option>
          </select>
        </div>
        <div className="text-sm text-gray-500">
          Last updated: {new Date().toLocaleTimeString()}
        </div>
      </div>

      {/* Main Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Collected */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-green-100 rounded-lg">
              <DollarSign className="w-5 h-5 text-green-600" />
            </div>
            <div className={`flex items-center space-x-1 text-xs ${
              totalAmountChange.trend === 'up' ? 'text-green-600' : 
              totalAmountChange.trend === 'down' ? 'text-red-600' : 'text-gray-500'
            }`}>
              {totalAmountChange.trend === 'up' && <ArrowUpRight className="w-3 h-3" />}
              {totalAmountChange.trend === 'down' && <ArrowDownRight className="w-3 h-3" />}
              <span>{totalAmountChange.value}%</span>
            </div>
          </div>
          <p className="text-sm text-gray-600 mb-1">Total Collected</p>
          <p className="text-2xl font-bold text-gray-900 mb-2">
            {formatCurrency(stats.totalAmount)}
          </p>
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-500">{stats.totalPayments} payments</span>
            <span className="text-gray-500">Avg {formatCurrency(stats.averageAmount)}</span>
          </div>
        </div>

        {/* Outstanding Balance */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-orange-100 rounded-lg">
              <AlertCircle className="w-5 h-5 text-orange-600" />
            </div>
            <div className={`flex items-center space-x-1 text-xs ${
              outstandingChange.trend === 'up' ? 'text-red-600' : 
              outstandingChange.trend === 'down' ? 'text-green-600' : 'text-gray-500'
            }`}>
              {outstandingChange.trend === 'up' && <ArrowUpRight className="w-3 h-3" />}
              {outstandingChange.trend === 'down' && <ArrowDownRight className="w-3 h-3" />}
              <span>{outstandingChange.value}%</span>
            </div>
          </div>
          <p className="text-sm text-gray-600 mb-1">Outstanding Balance</p>
          <p className="text-2xl font-bold text-orange-600 mb-2">
            {formatCurrency(outstandingTotal)}
          </p>
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-500">{outstandingCount} students</span>
            <span className="text-gray-500">Avg {formatCurrency(outstandingTotal / (outstandingCount || 1))}</span>
          </div>
        </div>

        {/* Total Payments */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-blue-100 rounded-lg">
              <CreditCard className="w-5 h-5 text-blue-600" />
            </div>
            <div className={`flex items-center space-x-1 text-xs ${
              paymentsChange.trend === 'up' ? 'text-green-600' : 
              paymentsChange.trend === 'down' ? 'text-red-600' : 'text-gray-500'
            }`}>
              {paymentsChange.trend === 'up' && <ArrowUpRight className="w-3 h-3" />}
              {paymentsChange.trend === 'down' && <ArrowDownRight className="w-3 h-3" />}
              <span>{paymentsChange.value}%</span>
            </div>
          </div>
          <p className="text-sm text-gray-600 mb-1">Total Payments</p>
          <p className="text-2xl font-bold text-gray-900 mb-2">
            {stats.totalPayments}
          </p>
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-500">{getPeriodLabel()}</span>
            <span className="text-gray-500">
              {stats.totalPayments > 0 ? `${Math.round(stats.totalPayments / 30 * 100) / 100}/day` : '0/day'}
            </span>
          </div>
        </div>

        {/* Collection Rate */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-purple-100 rounded-lg">
              <TrendingUp className="w-5 h-5 text-purple-600" />
            </div>
            <div className="text-xs text-gray-500">
              vs target
            </div>
          </div>
          <p className="text-sm text-gray-600 mb-1">Collection Rate</p>
          <p className="text-2xl font-bold text-purple-600 mb-2">
            {outstandingTotal > 0 
              ? Math.round((stats.totalAmount / (stats.totalAmount + outstandingTotal)) * 100) 
              : 100}%
          </p>
          <div className="w-full bg-gray-200 rounded-full h-1.5">
            <div
              className="h-1.5 rounded-full bg-purple-500"
              style={{ 
                width: `${outstandingTotal > 0 
                  ? Math.min(100, (stats.totalAmount / (stats.totalAmount + outstandingTotal)) * 100) 
                  : 100}%` 
              }}
            />
          </div>
        </div>
      </div>

      {/* Secondary Stats */}
      {showDetails && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Min/Max Range */}
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-xs text-gray-500 mb-2">Payment Range</p>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-400">Min</p>
                <p className="text-sm font-bold text-gray-900">{formatCurrency(stats.minAmount)}</p>
              </div>
              <ArrowUpRight className="w-4 h-4 text-gray-400" />
              <div>
                <p className="text-xs text-gray-400">Max</p>
                <p className="text-sm font-bold text-gray-900">{formatCurrency(stats.maxAmount)}</p>
              </div>
            </div>
          </div>

          {/* Payment Methods Summary */}
          {paymentMethods.length > 0 && (
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-xs text-gray-500 mb-2">Top Payment Method</p>
              <div className="flex items-center space-x-2">
                {paymentMethods[0]?.method === 'mpesa' && <Smartphone className="w-4 h-4 text-green-600" />}
                {paymentMethods[0]?.method === 'cooperative_bank' && <Landmark className="w-4 h-4 text-blue-600" />}
                {paymentMethods[0]?.method === 'family_bank' && <Landmark className="w-4 h-4 text-purple-600" />}
                {paymentMethods[0]?.method === 'cash' && <Wallet className="w-4 h-4 text-yellow-600" />}
                <span className="text-sm font-medium text-gray-900">
                  {paymentMethods[0]?.methodDisplay || 'N/A'}
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {paymentMethods[0]?.count} payments • {formatCurrency(paymentMethods[0]?.total)}
              </p>
            </div>
          )}

          {/* Daily Average */}
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-xs text-gray-500 mb-2">Daily Average</p>
            <p className="text-lg font-bold text-gray-900">
              {formatCurrency(stats.totalAmount / 30)} {/* Approximate */}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Based on last 30 days
            </p>
          </div>

          {/* Success Rate */}
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-xs text-gray-500 mb-2">Payment Success Rate</p>
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span className="text-lg font-bold text-gray-900">98%</span>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              <Clock className="w-3 h-3 inline mr-1" />
              2% pending/failed
            </p>
          </div>
        </div>
      )}

      {/* Quick Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="flex items-center space-x-2">
          <div className="w-1 h-8 bg-green-500 rounded-full"></div>
          <div>
            <p className="text-xs text-gray-500">Largest Payment</p>
            <p className="text-sm font-bold text-gray-900">{formatCurrency(stats.maxAmount)}</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-1 h-8 bg-blue-500 rounded-full"></div>
          <div>
            <p className="text-xs text-gray-500">Smallest Payment</p>
            <p className="text-sm font-bold text-gray-900">{formatCurrency(stats.minAmount)}</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-1 h-8 bg-purple-500 rounded-full"></div>
          <div>
            <p className="text-xs text-gray-500">Payment Frequency</p>
            <p className="text-sm font-bold text-gray-900">{stats.totalPayments} total</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-1 h-8 bg-orange-500 rounded-full"></div>
          <div>
            <p className="text-xs text-gray-500">Collection Ratio</p>
            <p className="text-sm font-bold text-gray-900">
              {outstandingTotal > 0 
                ? (stats.totalAmount / (stats.totalAmount + outstandingTotal)).toFixed(2)
                : '1.00'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FeeStatsCards;