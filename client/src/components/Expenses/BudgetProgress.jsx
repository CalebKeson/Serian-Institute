// src/components/Expenses/BudgetProgress.jsx
import React from 'react';
import { TrendingUp, TrendingDown, AlertCircle } from 'lucide-react';
import { formatCurrency } from '../../utils/feeFormatter';

const BudgetProgress = ({ category, compact = false }) => {
  const { 
    name, 
    budgetAmount = 0, 
    totalSpent = 0, 
    budgetPeriod = 'monthly',
    status = 'good'
  } = category || {};

  const utilization = budgetAmount > 0 ? (totalSpent / budgetAmount) * 100 : 0;
  const remaining = budgetAmount - totalSpent;

  const getStatusColor = () => {
    if (utilization >= 100) return 'text-red-600';
    if (utilization >= 90) return 'text-yellow-600';
    if (utilization >= 75) return 'text-orange-600';
    return 'text-green-600';
  };

  const getProgressColor = () => {
    if (utilization >= 100) return 'bg-red-500';
    if (utilization >= 90) return 'bg-yellow-500';
    if (utilization >= 75) return 'bg-orange-500';
    return 'bg-green-500';
  };

  const getStatusIcon = () => {
    if (utilization >= 100) return <AlertCircle className="w-4 h-4 text-red-500" />;
    if (utilization >= 90) return <TrendingUp className="w-4 h-4 text-yellow-500" />;
    if (utilization >= 75) return <TrendingUp className="w-4 h-4 text-orange-500" />;
    return <TrendingDown className="w-4 h-4 text-green-500" />;
  };

  if (compact) {
    return (
      <div className="space-y-1">
        <div className="flex items-center justify-between text-xs">
          <span className="text-gray-500">Budget: {formatCurrency(budgetAmount)}</span>
          <span className={`font-medium ${getStatusColor()}`}>{utilization.toFixed(1)}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-1.5">
          <div
            className={`h-1.5 rounded-full ${getProgressColor()}`}
            style={{ width: `${Math.min(100, utilization)}%` }}
          />
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="text-gray-500">Spent: {formatCurrency(totalSpent)}</span>
          <span className="text-gray-500">Remaining: {formatCurrency(remaining)}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          {getStatusIcon()}
          <span className="text-sm font-medium text-gray-700">{name || 'Budget Progress'}</span>
        </div>
        <span className={`text-sm font-bold ${getStatusColor()}`}>
          {utilization.toFixed(1)}%
        </span>
      </div>

      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className={`h-2 rounded-full transition-all duration-500 ${getProgressColor()}`}
          style={{ width: `${Math.min(100, utilization)}%` }}
        />
      </div>

      <div className="grid grid-cols-3 gap-2 text-xs">
        <div>
          <p className="text-gray-500">Budget</p>
          <p className="font-medium text-gray-900">{formatCurrency(budgetAmount)}</p>
        </div>
        <div>
          <p className="text-gray-500">Spent</p>
          <p className="font-medium text-red-600">{formatCurrency(totalSpent)}</p>
        </div>
        <div>
          <p className="text-gray-500">Remaining</p>
          <p className={`font-medium ${remaining >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {formatCurrency(Math.abs(remaining))}
            {remaining < 0 && ' over'}
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between text-xs text-gray-500">
        <span>{budgetPeriod === 'monthly' ? 'Monthly Budget' : budgetPeriod === 'quarterly' ? 'Quarterly Budget' : 'Annual Budget'}</span>
        <span>{totalSpent > budgetAmount ? 'Over Budget' : totalSpent === budgetAmount ? 'At Budget' : 'Within Budget'}</span>
      </div>
    </div>
  );
};

export default BudgetProgress;