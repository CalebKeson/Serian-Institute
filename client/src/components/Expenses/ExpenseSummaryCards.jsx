// src/components/Expenses/ExpenseSummaryCards.jsx
import React from 'react';
import {
  Receipt,
  DollarSign,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  Calendar
} from 'lucide-react';
import { formatCurrency } from '../../utils/feeFormatter';

const ExpenseSummaryCards = ({ stats, loading }) => {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6 animate-pulse">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
            <div className="h-8 bg-gray-200 rounded w-3/4"></div>
          </div>
        ))}
      </div>
    );
  }

  const data = stats || {
    totalStats: [{ totalAmount: 0, totalExpenses: 0, averageAmount: 0, maxAmount: 0, minAmount: 0 }],
    byStatus: [],
    monthlyTrend: []
  };

  const totalAmount = data.totalStats?.[0]?.totalAmount || 0;
  const totalCount = data.totalStats?.[0]?.totalExpenses || 0;
  const averageAmount = data.totalStats?.[0]?.averageAmount || 0;
  const maxAmount = data.totalStats?.[0]?.maxAmount || 0;

  // Get status counts
  const statusCounts = {};
  (data.byStatus || []).forEach(item => {
    statusCounts[item.status] = item.count || 0;
  });

  const draftCount = statusCounts.draft || 0;
  const pendingCount = statusCounts.pending || 0;
  const approvedCount = statusCounts.approved || 0;
  const paidCount = statusCounts.paid || 0;

  // Get current month's expenses (from monthlyTrend)
  const currentMonth = data.monthlyTrend?.[data.monthlyTrend.length - 1];
  const previousMonth = data.monthlyTrend?.[data.monthlyTrend.length - 2];
  const monthlyChange = previousMonth && previousMonth.total > 0
    ? ((currentMonth?.total || 0) - previousMonth.total) / previousMonth.total * 100
    : 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
      {/* Total Expenses Card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between mb-4">
          <div className="p-2 bg-red-100 rounded-lg">
            <Receipt className="w-6 h-6 text-red-600" />
          </div>
          <span className="text-xs text-gray-400">All time</span>
        </div>
        <p className="text-sm text-gray-600 mb-1">Total Expenses</p>
        <p className="text-3xl font-bold text-red-600">{formatCurrency(totalAmount)}</p>
        <p className="text-xs text-gray-500 mt-2">
          {totalCount} transactions • Avg {formatCurrency(averageAmount)}
        </p>
      </div>

      {/* Largest Expense Card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between mb-4">
          <div className="p-2 bg-orange-100 rounded-lg">
            <TrendingUp className="w-6 h-6 text-orange-600" />
          </div>
          <span className="text-xs text-gray-400">Largest</span>
        </div>
        <p className="text-sm text-gray-600 mb-1">Largest Expense</p>
        <p className="text-3xl font-bold text-orange-600">{formatCurrency(maxAmount)}</p>
        <p className="text-xs text-gray-500 mt-2">
          Single transaction
        </p>
      </div>

      {/* Monthly Trend Card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between mb-4">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Calendar className="w-6 h-6 text-blue-600" />
          </div>
          <span className="text-xs text-gray-400">This month</span>
        </div>
        <p className="text-sm text-gray-600 mb-1">Monthly Expenses</p>
        <p className="text-3xl font-bold text-blue-600">{formatCurrency(currentMonth?.total || 0)}</p>
        <div className="flex items-center mt-2">
          {monthlyChange > 0 ? (
            <TrendingUp className="w-4 h-4 text-red-500 mr-1" />
          ) : monthlyChange < 0 ? (
            <TrendingDown className="w-4 h-4 text-green-500 mr-1" />
          ) : null}
          <span className={`text-xs ${monthlyChange > 0 ? 'text-red-500' : monthlyChange < 0 ? 'text-green-500' : 'text-gray-500'}`}>
            {monthlyChange > 0 ? '+' : ''}{monthlyChange.toFixed(1)}% vs last month
          </span>
        </div>
      </div>

      {/* Status Breakdown Card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between mb-4">
          <div className="p-2 bg-purple-100 rounded-lg">
            <AlertCircle className="w-6 h-6 text-purple-600" />
          </div>
          <span className="text-xs text-gray-400">By status</span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500">Draft</span>
            <span className="text-sm font-medium text-gray-700">{draftCount}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500">Pending</span>
            <span className="text-sm font-medium text-yellow-600">{pendingCount}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500">Approved</span>
            <span className="text-sm font-medium text-blue-600">{approvedCount}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500">Paid</span>
            <span className="text-sm font-medium text-green-600">{paidCount}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExpenseSummaryCards;