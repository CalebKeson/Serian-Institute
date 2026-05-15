// src/components/Income/IncomeSummaryCards.jsx
import React from 'react';
import {
  TrendingUp,
  DollarSign,
  Calendar,
  PieChart,
  Wallet,
  Landmark,
  Heart,
  Briefcase,
  Coffee,
  MoreHorizontal,
  TrendingDown,
  AlertCircle
} from 'lucide-react';
import { formatCurrency } from '../../utils/feeFormatter';

const IncomeSummaryCards = ({ stats, loading }) => {
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
    totalStats: [{ totalAmount: 0, totalCount: 0, averageAmount: 0, maxAmount: 0, minAmount: 0 }],
    bySourceType: [],
    monthlyTrend: []
  };

  const totalAmount = data.totalStats?.[0]?.totalAmount || 0;
  const totalCount = data.totalStats?.[0]?.totalCount || 0;
  const averageAmount = data.totalStats?.[0]?.averageAmount || 0;
  const maxAmount = data.totalStats?.[0]?.maxAmount || 0;

  // Process source breakdown
  const sourceMap = {};
  (data.bySourceType || []).forEach(item => {
    sourceMap[item.sourceType] = item.total || 0;
  });

  const sourceBreakdown = [
    { type: 'fees', label: 'Student Fees', icon: Wallet, color: 'blue', amount: sourceMap.fees || 0 },
    { type: 'director_investment', label: 'Director Investments', icon: Landmark, color: 'purple', amount: sourceMap.director_investment || 0 },
    { type: 'grant', label: 'Grants', icon: Heart, color: 'pink', amount: sourceMap.grant || 0 },
    { type: 'donation', label: 'Donations', icon: Heart, color: 'red', amount: sourceMap.donation || 0 },
    { type: 'auxiliary', label: 'Auxiliary', icon: Coffee, color: 'orange', amount: sourceMap.auxiliary || 0 },
    { type: 'other', label: 'Other', icon: MoreHorizontal, color: 'gray', amount: sourceMap.other || 0 }
  ];

  // Get current month's income
  const currentMonth = data.monthlyTrend?.[data.monthlyTrend.length - 1];
  const previousMonth = data.monthlyTrend?.[data.monthlyTrend.length - 2];
  const monthlyChange = previousMonth && previousMonth.total > 0
    ? ((currentMonth?.total || 0) - previousMonth.total) / previousMonth.total * 100
    : 0;

  // Calculate allocation rate (placeholder - would come from real data)
  const allocatedAmount = data.totalStats?.[0]?.allocatedAmount || 0;
  const allocationRate = totalAmount > 0 ? (allocatedAmount / totalAmount) * 100 : 0;

  return (
    <div className="space-y-6 mb-6">
      {/* Main Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Total Income Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-green-100 rounded-lg">
              <DollarSign className="w-6 h-6 text-green-600" />
            </div>
            <span className="text-xs text-gray-400">All time</span>
          </div>
          <p className="text-sm text-gray-600 mb-1">Total Income</p>
          <p className="text-3xl font-bold text-green-600">{formatCurrency(totalAmount)}</p>
          <p className="text-xs text-gray-500 mt-2">
            {totalCount} transactions • Avg {formatCurrency(averageAmount)}
          </p>
        </div>

        {/* Largest Income Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-orange-100 rounded-lg">
              <TrendingUp className="w-6 h-6 text-orange-600" />
            </div>
            <span className="text-xs text-gray-400">Largest</span>
          </div>
          <p className="text-sm text-gray-600 mb-1">Largest Transaction</p>
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
          <p className="text-sm text-gray-600 mb-1">Monthly Income</p>
          <p className="text-3xl font-bold text-blue-600">{formatCurrency(currentMonth?.total || 0)}</p>
          <div className="flex items-center mt-2">
            {monthlyChange > 0 ? (
              <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
            ) : monthlyChange < 0 ? (
              <TrendingDown className="w-4 h-4 text-red-500 mr-1" />
            ) : null}
            <span className={`text-xs ${monthlyChange > 0 ? 'text-green-500' : monthlyChange < 0 ? 'text-red-500' : 'text-gray-500'}`}>
              {monthlyChange > 0 ? '+' : ''}{monthlyChange.toFixed(1)}% vs last month
            </span>
          </div>
        </div>

        {/* Allocation Rate Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-purple-100 rounded-lg">
              <PieChart className="w-6 h-6 text-purple-600" />
            </div>
            <span className="text-xs text-gray-400">Allocated</span>
          </div>
          <p className="text-sm text-gray-600 mb-1">Allocation Rate</p>
          <p className="text-3xl font-bold text-purple-600">{allocationRate.toFixed(1)}%</p>
          <div className="mt-2 w-full bg-gray-200 rounded-full h-1.5">
            <div
              className={`h-1.5 rounded-full ${allocationRate >= 90 ? 'bg-green-500' : allocationRate >= 50 ? 'bg-yellow-500' : 'bg-gray-400'}`}
              style={{ width: `${Math.min(100, allocationRate)}%` }}
            />
          </div>
          <p className="text-xs text-gray-500 mt-2">
            {formatCurrency(allocatedAmount)} allocated to expenses
          </p>
        </div>
      </div>

      {/* Source Breakdown Row */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <PieChart className="w-5 h-5 mr-2 text-green-600" />
          Income by Source
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {sourceBreakdown.map((source) => {
            const percentage = totalAmount > 0 ? (source.amount / totalAmount) * 100 : 0;
            const colorClasses = {
              blue: 'bg-blue-100 text-blue-600',
              purple: 'bg-purple-100 text-purple-600',
              pink: 'bg-pink-100 text-pink-600',
              red: 'bg-red-100 text-red-600',
              orange: 'bg-orange-100 text-orange-600',
              gray: 'bg-gray-100 text-gray-600'
            };
            const Icon = source.icon;
            
            return (
              <div key={source.type} className="text-center p-3 bg-gray-50 rounded-lg">
                <div className={`p-2 ${colorClasses[source.color]} rounded-lg inline-flex mb-2`}>
                  <Icon className="w-5 h-5" />
                </div>
                <p className="text-xs text-gray-500">{source.label}</p>
                <p className="text-sm font-bold text-gray-900">{formatCurrency(source.amount)}</p>
                <p className="text-xs text-gray-400">{percentage.toFixed(1)}%</p>
                <div className="mt-1 w-full bg-gray-200 rounded-full h-1">
                  <div
                    className={`h-1 rounded-full bg-${source.color}-500`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default IncomeSummaryCards;