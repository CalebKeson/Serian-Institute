// src/components/Reports/PLStatement.jsx
import React, { useState } from 'react';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  ChevronDown,
  ChevronUp,
  Eye
} from 'lucide-react';
import { formatCurrency } from '../../utils/feeFormatter';

const PLStatement = ({ data, groupBy, period }) => {
  const [expandedPeriods, setExpandedPeriods] = useState([]);
  const [showDetails, setShowDetails] = useState(false);

  const togglePeriodExpand = (periodName) => {
    setExpandedPeriods(prev =>
      prev.includes(periodName)
        ? prev.filter(p => p !== periodName)
        : [...prev, periodName]
    );
  };

  if (!data || !data.breakdown || data.breakdown.length === 0) {
    return (
      <div className="text-center py-12">
        <TrendingUp className="mx-auto h-12 w-12 text-gray-400" />
        <p className="mt-2 text-gray-500">No data available for the selected period</p>
      </div>
    );
  }

  const totals = data.summary || {
    totalIncome: 0,
    totalExpenses: 0,
    totalProfit: 0,
    overallProfitMargin: 0
  };

  return (
    <div className="space-y-6">
      {/* Summary Row */}
      <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center">
            <p className="text-sm text-gray-500">Total Income</p>
            <p className="text-xl font-bold text-green-600">{formatCurrency(totals.totalIncome)}</p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-500">Total Expenses</p>
            <p className="text-xl font-bold text-red-600">{formatCurrency(totals.totalExpenses)}</p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-500">Net Profit</p>
            <p className={`text-xl font-bold ${totals.totalProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(totals.totalProfit)}
              <span className="text-sm ml-2">({totals.overallProfitMargin.toFixed(1)}% margin)</span>
            </p>
          </div>
        </div>
      </div>

      {/* Period Breakdown */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Period
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Income
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Expenses
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Profit
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                Margin
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                Details
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {data.breakdown.map((periodData, index) => {
              const isExpanded = expandedPeriods.includes(periodData.period);
              return (
                <React.Fragment key={index}>
                  <tr className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {periodData.period}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-green-600">
                      {formatCurrency(periodData.income)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-red-600">
                      {formatCurrency(periodData.expenses)}
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap text-right text-sm font-medium ${
                      periodData.profit >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {formatCurrency(periodData.profit)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-600">
                      {periodData.profitMargin.toFixed(1)}%
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <button
                        onClick={() => togglePeriodExpand(periodData.period)}
                        className="text-gray-400 hover:text-gray-600 p-1 rounded hover:bg-gray-100 transition-colors"
                      >
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                    </td>
                  </tr>

                  {/* Expanded Row - Income/Expense Breakdown */}
                  {isExpanded && (
                    <tr className="bg-gray-50">
                      <td colSpan="6" className="px-6 py-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {/* Income Breakdown */}
                          <div>
                            <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
                              <TrendingUp className="w-4 h-4 mr-2 text-green-600" />
                              Income Breakdown
                            </h4>
                            <div className="space-y-2">
                              {Object.entries(periodData.incomeBreakdown || {}).map(([source, amount]) => (
                                <div key={source} className="flex justify-between items-center text-sm">
                                  <span className="text-gray-600 capitalize">{source.replace('_', ' ')}</span>
                                  <span className="font-medium text-green-600">{formatCurrency(amount)}</span>
                                </div>
                              ))}
                              {Object.keys(periodData.incomeBreakdown || {}).length === 0 && (
                                <p className="text-sm text-gray-500 italic">No income recorded</p>
                              )}
                            </div>
                          </div>

                          {/* Expense Breakdown */}
                          <div>
                            <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
                              <TrendingDown className="w-4 h-4 mr-2 text-red-600" />
                              Expense Breakdown
                            </h4>
                            <div className="space-y-2">
                              {Object.entries(periodData.expenseBreakdown || {}).map(([category, amount]) => (
                                <div key={category} className="flex justify-between items-center text-sm">
                                  <span className="text-gray-600">{category}</span>
                                  <span className="font-medium text-red-600">{formatCurrency(amount)}</span>
                                </div>
                              ))}
                              {Object.keys(periodData.expenseBreakdown || {}).length === 0 && (
                                <p className="text-sm text-gray-500 italic">No expenses recorded</p>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
          <tfoot className="bg-gray-50">
            <tr className="border-t border-gray-200">
              <td className="px-6 py-3 text-sm font-medium text-gray-900">TOTAL</td>
              <td className="px-6 py-3 text-right text-sm font-bold text-green-600">
                {formatCurrency(totals.totalIncome)}
              </td>
              <td className="px-6 py-3 text-right text-sm font-bold text-red-600">
                {formatCurrency(totals.totalExpenses)}
              </td>
              <td className={`px-6 py-3 text-right text-sm font-bold ${totals.totalProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(totals.totalProfit)}
              </td>
              <td className="px-6 py-3 text-center text-sm font-bold text-gray-700">
                {totals.overallProfitMargin.toFixed(1)}%
              </td>
              <td className="px-6 py-3"></td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Show/Hide Details Button */}
      <div className="text-center">
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="text-sm text-purple-600 hover:text-purple-700 flex items-center justify-center mx-auto"
        >
          <Eye className="w-4 h-4 mr-1" />
          {showDetails ? 'Hide Details' : 'Show Detailed Breakdown'}
        </button>
      </div>

      {/* Detailed Breakdown (if showDetails is true) */}
      {showDetails && data.breakdown && (
        <div className="mt-6 pt-6 border-t border-gray-200">
          <h3 className="text-md font-semibold text-gray-900 mb-4">Detailed Period Analysis</h3>
          {data.breakdown.map((periodData, index) => (
            <div key={index} className="mb-6 last:mb-0">
              <h4 className="text-sm font-medium text-gray-700 mb-3">{periodData.period}</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-xs text-gray-500 mb-2">Income Sources</p>
                  <div className="space-y-1">
                    {Object.entries(periodData.incomeBreakdown || {}).map(([source, amount]) => (
                      <div key={source} className="flex justify-between text-sm">
                        <span className="capitalize">{source.replace('_', ' ')}</span>
                        <span>{formatCurrency(amount)}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-xs text-gray-500 mb-2">Expense Categories</p>
                  <div className="space-y-1">
                    {Object.entries(periodData.expenseBreakdown || {}).map(([category, amount]) => (
                      <div key={category} className="flex justify-between text-sm">
                        <span>{category}</span>
                        <span>{formatCurrency(amount)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Footer */}
      <div className="text-xs text-gray-400 text-center pt-4 border-t border-gray-200">
        Generated on {new Date().toLocaleDateString()} | Period: {new Date(period.startDate).toLocaleDateString()} - {new Date(period.endDate).toLocaleDateString()}
      </div>
    </div>
  );
};

export default PLStatement;