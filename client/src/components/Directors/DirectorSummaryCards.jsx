// src/components/Directors/DirectorSummaryCards.jsx
import React from 'react';
import { Users, TrendingUp, Wallet, Percent } from 'lucide-react';
import { formatCurrency } from '../../utils/feeFormatter';

const DirectorSummaryCards = ({ summary, loading }) => {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6 animate-pulse">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
            <div className="h-8 bg-gray-200 rounded w-3/4"></div>
          </div>
        ))}
      </div>
    );
  }

  const data = summary || {
    totalDirectors: 0,
    totalInvested: 0,
    totalRepaid: 0,
    totalOutstanding: 0,
    byRole: { chairman: 0, secretary: 0, treasurer: 0, member: 0 }
  };

  const repaymentRate = data.totalInvested > 0 
    ? (data.totalRepaid / data.totalInvested) * 100 
    : 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
      {/* Total Directors Card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between mb-4">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Users className="w-6 h-6 text-blue-600" />
          </div>
          <span className="text-xs text-gray-400">Active</span>
        </div>
        <p className="text-sm text-gray-600 mb-1">Total Directors</p>
        <p className="text-3xl font-bold text-gray-900">{data.totalDirectors}</p>
        <div className="flex flex-wrap gap-2 mt-2">
          {data.byRole.chairman > 0 && (
            <span className="text-xs bg-gray-100 px-2 py-0.5 rounded-full">Chair: {data.byRole.chairman}</span>
          )}
          {data.byRole.secretary > 0 && (
            <span className="text-xs bg-gray-100 px-2 py-0.5 rounded-full">Sec: {data.byRole.secretary}</span>
          )}
          {data.byRole.treasurer > 0 && (
            <span className="text-xs bg-gray-100 px-2 py-0.5 rounded-full">Treas: {data.byRole.treasurer}</span>
          )}
        </div>
      </div>

      {/* Total Invested Card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between mb-4">
          <div className="p-2 bg-green-100 rounded-lg">
            <TrendingUp className="w-6 h-6 text-green-600" />
          </div>
          <span className="text-xs text-gray-400">All time</span>
        </div>
        <p className="text-sm text-gray-600 mb-1">Total Invested</p>
        <p className="text-3xl font-bold text-green-600">{formatCurrency(data.totalInvested)}</p>
        <p className="text-xs text-gray-500 mt-2">from {data.totalDirectors} directors</p>
      </div>

      {/* Outstanding Balance Card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between mb-4">
          <div className="p-2 bg-orange-100 rounded-lg">
            <Wallet className="w-6 h-6 text-orange-600" />
          </div>
          <span className="text-xs text-gray-400">Due</span>
        </div>
        <p className="text-sm text-gray-600 mb-1">Outstanding Balance</p>
        <p className="text-3xl font-bold text-orange-600">{formatCurrency(data.totalOutstanding)}</p>
        <p className="text-xs text-gray-500 mt-2">
          {data.totalInvested > 0 ? ((data.totalOutstanding / data.totalInvested) * 100).toFixed(1) : 0}% of total
        </p>
      </div>

      {/* Repayment Rate Card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between mb-4">
          <div className="p-2 bg-purple-100 rounded-lg">
            <Percent className="w-6 h-6 text-purple-600" />
          </div>
          <span className="text-xs text-gray-400">Repaid</span>
        </div>
        <p className="text-sm text-gray-600 mb-1">Repayment Rate</p>
        <p className="text-3xl font-bold text-purple-600">{repaymentRate.toFixed(1)}%</p>
        <p className="text-xs text-gray-500 mt-2">
          {formatCurrency(data.totalRepaid)} repaid / {formatCurrency(data.totalInvested)} invested
        </p>
      </div>
    </div>
  );
};

export default DirectorSummaryCards;