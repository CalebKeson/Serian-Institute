// src/components/Reports/BudgetTable.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  ChevronDown,
  ChevronUp,
  Eye,
  AlertCircle,
  CheckCircle,
  ArrowRight
} from 'lucide-react';
import { formatCurrency } from '../../utils/feeFormatter';

const BudgetTable = ({ data, year, period }) => {
  const navigate = useNavigate();
  const [expandedCategories, setExpandedCategories] = useState([]);
  const [showDetails, setShowDetails] = useState(false);

  const toggleCategoryExpand = (categoryId) => {
    setExpandedCategories(prev =>
      prev.includes(categoryId)
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const handleCategoryClick = (categoryId) => {
    if (categoryId) {
      navigate(`/expenses?category=${categoryId}&year=${year}`);
    }
  };

  if (!data || !data.categorySummary || data.categorySummary.length === 0) {
    return (
      <div className="text-center py-12">
        <DollarSign className="mx-auto h-12 w-12 text-gray-400" />
        <p className="mt-2 text-gray-500">No budget data available for {year}</p>
      </div>
    );
  }

  const yearlyTotals = data.yearlyTotals || {
    totalBudget: 0,
    totalActual: 0,
    totalVariance: 0,
    variancePercentage: 0
  };

  const categorySummary = data.categorySummary || [];

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-blue-50 rounded-lg p-4">
          <p className="text-sm text-blue-700">Total Budget</p>
          <p className="text-xl font-bold text-blue-700">{formatCurrency(yearlyTotals.totalBudget)}</p>
        </div>
        <div className="bg-orange-50 rounded-lg p-4">
          <p className="text-sm text-orange-700">Actual Spend</p>
          <p className="text-xl font-bold text-orange-700">{formatCurrency(yearlyTotals.totalActual)}</p>
        </div>
        <div className={`rounded-lg p-4 ${yearlyTotals.totalVariance >= 0 ? 'bg-red-50' : 'bg-green-50'}`}>
          <p className={`text-sm ${yearlyTotals.totalVariance >= 0 ? 'text-red-700' : 'text-green-700'}`}>
            {yearlyTotals.totalVariance >= 0 ? 'Over Budget' : 'Under Budget'}
          </p>
          <p className={`text-xl font-bold ${yearlyTotals.totalVariance >= 0 ? 'text-red-700' : 'text-green-700'}`}>
            {formatCurrency(Math.abs(yearlyTotals.totalVariance))}
            <span className="text-sm ml-2">({Math.abs(yearlyTotals.variancePercentage).toFixed(1)}%)</span>
          </p>
        </div>
      </div>

      {/* Category Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Category
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Budget
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actual
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Variance
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                Details
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {categorySummary.map((category, index) => {
              const isExpanded = expandedCategories.includes(category.categoryId);
              const status = category.variance > 0 ? 'over' : category.variance < 0 ? 'under' : 'on';
              const percentage = category.budgetAmount > 0 
                ? (category.actualAmount / category.budgetAmount) * 100 
                : 0;

              return (
                <React.Fragment key={index}>
                  <tr className="hover:bg-gray-50 transition-colors cursor-pointer" onClick={() => handleCategoryClick(category.categoryId)}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {category.categoryName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900">
                      {formatCurrency(category.budgetAmount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-orange-600">
                      {formatCurrency(category.actualAmount)}
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap text-right text-sm font-medium ${
                      status === 'over' ? 'text-red-600' : status === 'under' ? 'text-green-600' : 'text-gray-600'
                    }`}>
                      {status === 'over' ? '+' : status === 'under' ? '-' : ''}
                      {formatCurrency(Math.abs(category.variance))}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      {status === 'over' && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          <TrendingUp className="w-3 h-3 mr-1" />
                          Over
                        </span>
                      )}
                      {status === 'under' && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          <TrendingDown className="w-3 h-3 mr-1" />
                          Under
                        </span>
                      )}
                      {status === 'on' && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          On Target
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleCategoryExpand(category.categoryId);
                        }}
                        className="text-gray-400 hover:text-gray-600 p-1 rounded hover:bg-gray-100 transition-colors"
                      >
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                    </td>
                  </tr>

                  {/* Expanded Row - Monthly Breakdown */}
                  {isExpanded && data.monthlyTotals && (
                    <tr className="bg-gray-50">
                      <td colSpan="6" className="px-6 py-4">
                        <h4 className="text-sm font-medium text-gray-700 mb-3">
                          Monthly Breakdown - {category.categoryName}
                        </h4>
                        <div className="space-y-2">
                          {data.monthlyTotals.map((month, idx) => {
                            const monthBudget = month.categoryBreakdown?.[category.categoryId]?.budget || 0;
                            const monthActual = month.categoryBreakdown?.[category.categoryId]?.actual || 0;
                            const monthVariance = monthActual - monthBudget;
                            const monthStatus = monthVariance > 0 ? 'over' : monthVariance < 0 ? 'under' : 'on';
                            
                            return (
                              <div key={idx} className="flex items-center justify-between text-sm py-1">
                                <span className="w-24 text-gray-600">
                                  {new Date(2000, month.month - 1, 1).toLocaleString('default', { month: 'short' })}
                                </span>
                                <span className="w-28 text-right text-gray-600">
                                  Budget: {formatCurrency(monthBudget)}
                                </span>
                                <span className="w-28 text-right text-orange-600">
                                  Actual: {formatCurrency(monthActual)}
                                </span>
                                <span className={`w-28 text-right font-medium ${
                                  monthStatus === 'over' ? 'text-red-600' : monthStatus === 'under' ? 'text-green-600' : 'text-gray-600'
                                }`}>
                                  {monthStatus === 'over' ? '+' : monthStatus === 'under' ? '-' : ''}
                                  {formatCurrency(Math.abs(monthVariance))}
                                </span>
                                <div className="w-24">
                                  <div className="w-full bg-gray-200 rounded-full h-1.5">
                                    <div
                                      className={`h-1.5 rounded-full ${
                                        monthStatus === 'over' ? 'bg-red-500' : monthStatus === 'under' ? 'bg-green-500' : 'bg-blue-500'
                                      }`}
                                      style={{ width: `${Math.min(100, (monthActual / monthBudget) * 100)}%` }}
                                    />
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                        <div className="mt-3 text-right">
                          <button
                            onClick={() => handleCategoryClick(category.categoryId)}
                            className="text-xs text-purple-600 hover:text-purple-700 flex items-center justify-end"
                          >
                            View all expenses in this category
                            <ArrowRight className="w-3 h-3 ml-1" />
                          </button>
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
              <td className="px-6 py-3 text-right text-sm font-bold text-gray-900">
                {formatCurrency(yearlyTotals.totalBudget)}
              </td>
              <td className="px-6 py-3 text-right text-sm font-bold text-orange-600">
                {formatCurrency(yearlyTotals.totalActual)}
              </td>
              <td className={`px-6 py-3 text-right text-sm font-bold ${
                yearlyTotals.totalVariance >= 0 ? 'text-red-600' : 'text-green-600'
              }`}>
                {yearlyTotals.totalVariance >= 0 ? '+' : '-'}
                {formatCurrency(Math.abs(yearlyTotals.totalVariance))}
              </td>
              <td colSpan="2" className="px-6 py-3"></td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Show/Hide Details Button */}
      <div className="text-center">
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="text-sm text-orange-600 hover:text-orange-700 flex items-center justify-center mx-auto"
        >
          <Eye className="w-4 h-4 mr-1" />
          {showDetails ? 'Hide Details' : 'Show Analysis'}
        </button>
      </div>

      {/* Analysis Section */}
      {showDetails && (
        <div className="mt-6 pt-6 border-t border-gray-200">
          <h3 className="text-md font-semibold text-gray-900 mb-4">Budget Analysis</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
                <AlertCircle className="w-4 h-4 mr-2 text-red-500" />
                Top Over Budget Categories
              </h4>
              <div className="space-y-2">
                {categorySummary.filter(c => c.variance > 0).slice(0, 5).map((cat, idx) => (
                  <div key={idx} className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">{cat.categoryName}</span>
                    <span className="text-sm font-medium text-red-600">
                      +{formatCurrency(cat.variance)} ({cat.variancePercentage.toFixed(1)}%)
                    </span>
                  </div>
                ))}
                {categorySummary.filter(c => c.variance > 0).length === 0 && (
                  <p className="text-sm text-gray-500 italic">No categories over budget</p>
                )}
              </div>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
                <TrendingDown className="w-4 h-4 mr-2 text-green-500" />
                Top Under Budget Categories
              </h4>
              <div className="space-y-2">
                {categorySummary.filter(c => c.variance < 0).slice(0, 5).map((cat, idx) => (
                  <div key={idx} className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">{cat.categoryName}</span>
                    <span className="text-sm font-medium text-green-600">
                      -{formatCurrency(Math.abs(cat.variance))} ({Math.abs(cat.variancePercentage).toFixed(1)}%)
                    </span>
                  </div>
                ))}
                {categorySummary.filter(c => c.variance < 0).length === 0 && (
                  <p className="text-sm text-gray-500 italic">No categories under budget</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="text-xs text-gray-400 text-center pt-4 border-t border-gray-200">
        Generated on {new Date().toLocaleDateString()} | Fiscal Year: {year} | Period: {period}
      </div>
    </div>
  );
};

export default BudgetTable;