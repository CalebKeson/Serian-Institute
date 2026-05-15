// src/components/Financial/RecentTransactions.jsx
import React from 'react';
import { useNavigate } from 'react-router';
import {
  ArrowRight,
  TrendingUp,
  TrendingDown,
  Wallet,
  Landmark,
  Heart,
  Coffee,
  MoreHorizontal,
  Eye
} from 'lucide-react';
import { formatCurrency, formatDate } from '../../utils/feeFormatter';

const RecentTransactions = ({ incomeStats, expenseStats }) => {
  const navigate = useNavigate();

  const getSourceIcon = (sourceType) => {
    const icons = {
      fees: Wallet,
      director_investment: Landmark,
      grant: Heart,
      donation: Heart,
      auxiliary: Coffee,
      other: MoreHorizontal
    };
    const Icon = icons[sourceType] || TrendingUp;
    return Icon;
  };

  const getSourceColor = (sourceType) => {
    const colors = {
      fees: 'text-blue-600 bg-blue-100',
      director_investment: 'text-purple-600 bg-purple-100',
      grant: 'text-pink-600 bg-pink-100',
      donation: 'text-red-600 bg-red-100',
      auxiliary: 'text-orange-600 bg-orange-100',
      other: 'text-gray-600 bg-gray-100'
    };
    return colors[sourceType] || 'text-green-600 bg-green-100';
  };

  const getStatusColor = (status) => {
    const colors = {
      paid: 'text-green-600 bg-green-100',
      approved: 'text-blue-600 bg-blue-100',
      pending: 'text-yellow-600 bg-yellow-100',
      draft: 'text-gray-600 bg-gray-100'
    };
    return colors[status] || colors.draft;
  };

  const recentIncome = incomeStats?.recentTransactions?.slice(0, 5) || [];
  const recentExpenses = expenseStats?.recentExpenses?.slice(0, 5) || [];

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-gray-200">
        {/* Recent Income */}
        <div className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <TrendingUp className="w-5 h-5 mr-2 text-green-600" />
              Recent Income
            </h3>
            <button
              onClick={() => navigate('/income')}
              className="text-sm text-green-600 hover:text-green-700 flex items-center"
            >
              View All
              <ArrowRight className="w-4 h-4 ml-1" />
            </button>
          </div>

          <div className="space-y-3">
            {recentIncome.length > 0 ? (
              recentIncome.map((transaction, index) => {
                const Icon = getSourceIcon(transaction.sourceType);
                const colorClass = getSourceColor(transaction.sourceType);
                return (
                  <div
                    key={index}
                    onClick={() => navigate(`/income/${transaction._id}`)}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`p-2 rounded-lg ${colorClass}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {transaction.sourceType === 'director_investment' ? transaction.directorName :
                           transaction.sourceType === 'grant' ? transaction.donorName :
                           transaction.sourceType === 'donation' ? transaction.donorName :
                           transaction.description || transaction.sourceType}
                        </p>
                        <p className="text-xs text-gray-500">
                          {formatDate(transaction.incomeDate)} • {transaction.transactionNumber}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-green-600">
                        {formatCurrency(transaction.amount)}
                      </p>
                      <p className="text-xs text-gray-400 capitalize">{transaction.sourceType?.replace('_', ' ')}</p>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-8 text-gray-500">
                <TrendingUp className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                <p className="text-sm">No recent income</p>
              </div>
            )}
          </div>
        </div>

        {/* Recent Expenses */}
        <div className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <TrendingDown className="w-5 h-5 mr-2 text-red-600" />
              Recent Expenses
            </h3>
            <button
              onClick={() => navigate('/expenses')}
              className="text-sm text-red-600 hover:text-red-700 flex items-center"
            >
              View All
              <ArrowRight className="w-4 h-4 ml-1" />
            </button>
          </div>

          <div className="space-y-3">
            {recentExpenses.length > 0 ? (
              recentExpenses.map((expense, index) => {
                const statusColor = getStatusColor(expense.status);
                return (
                  <div
                    key={index}
                    onClick={() => navigate(`/expenses/${expense._id}`)}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {expense.vendor}
                        </p>
                        <span className={`ml-2 px-2 py-0.5 rounded-full text-xs font-medium ${statusColor}`}>
                          {expense.status}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 truncate mt-0.5">
                        {expense.description}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        {formatDate(expense.expenseDate)} • {expense.expenseNumber}
                      </p>
                    </div>
                    <div className="ml-3 text-right">
                      <p className="text-sm font-bold text-red-600">
                        {formatCurrency(expense.totalAmount)}
                      </p>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-8 text-gray-500">
                <TrendingDown className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                <p className="text-sm">No recent expenses</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RecentTransactions;