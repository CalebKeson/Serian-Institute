// src/components/Financial/FinancialSummaryCards.jsx
import React from 'react';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Wallet,
  PieChart,
  AlertCircle
} from 'lucide-react';
import { formatCurrency } from '../../utils/feeFormatter';

const FinancialSummaryCards = ({ financialSummary, incomeStats, expenseStats, directorSummary }) => {
  // Calculate totals from stats
  const totalIncome = incomeStats?.totalStats?.[0]?.totalAmount || 0;
  const totalExpenses = expenseStats?.totalStats?.[0]?.totalAmount || 0;
  const netProfit = totalIncome - totalExpenses;
  const profitMargin = totalIncome > 0 ? (netProfit / totalIncome) * 100 : 0;
  const directorLiabilities = directorSummary?.totalOutstanding || 0;

  // Calculate percentage changes (placeholder - would come from previous period data)
  const incomeChange = 15.2; // Example: +15.2%
  const expenseChange = -5.8; // Example: -5.8%
  const profitChange = 28.4; // Example: +28.4%

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
      {/* Total Income Card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between mb-4">
          <div className="p-2 bg-green-100 rounded-lg">
            <TrendingUp className="w-6 h-6 text-green-600" />
          </div>
          <div className={`flex items-center space-x-1 text-xs ${incomeChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {incomeChange >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            <span>{Math.abs(incomeChange)}%</span>
          </div>
        </div>
        <p className="text-sm text-gray-600 mb-1">Total Income</p>
        <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalIncome)}</p>
        <p className="text-xs text-gray-500 mt-2">vs previous period</p>
      </div>

      {/* Total Expenses Card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between mb-4">
          <div className="p-2 bg-red-100 rounded-lg">
            <TrendingDown className="w-6 h-6 text-red-600" />
          </div>
          <div className={`flex items-center space-x-1 text-xs ${expenseChange <= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {expenseChange <= 0 ? <TrendingDown className="w-3 h-3" /> : <TrendingUp className="w-3 h-3" />}
            <span>{Math.abs(expenseChange)}%</span>
          </div>
        </div>
        <p className="text-sm text-gray-600 mb-1">Total Expenses</p>
        <p className="text-2xl font-bold text-red-600">{formatCurrency(totalExpenses)}</p>
        <p className="text-xs text-gray-500 mt-2">vs previous period</p>
      </div>

      {/* Net Profit Card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between mb-4">
          <div className="p-2 bg-purple-100 rounded-lg">
            <DollarSign className="w-6 h-6 text-purple-600" />
          </div>
          <div className={`flex items-center space-x-1 text-xs ${profitChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {profitChange >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            <span>{Math.abs(profitChange)}%</span>
          </div>
        </div>
        <p className="text-sm text-gray-600 mb-1">Net Profit</p>
        <p className={`text-2xl font-bold ${netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
          {formatCurrency(netProfit)}
        </p>
        <p className="text-xs text-gray-500 mt-2">Margin: {profitMargin.toFixed(1)}%</p>
      </div>

      {/* Director Liabilities Card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between mb-4">
          <div className="p-2 bg-orange-100 rounded-lg">
            <AlertCircle className="w-6 h-6 text-orange-600" />
          </div>
          <span className="text-xs text-gray-400">Liabilities</span>
        </div>
        <p className="text-sm text-gray-600 mb-1">Director Liabilities</p>
        <p className="text-2xl font-bold text-orange-600">{formatCurrency(directorLiabilities)}</p>
        <p className="text-xs text-gray-500 mt-2">Outstanding balance</p>
      </div>
    </div>
  );
};

export default FinancialSummaryCards;