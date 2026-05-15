// src/components/Financial/FinancialBreakdownCharts.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { formatCurrency } from '../../utils/feeFormatter';

const COLORS = {
  fees: '#3b82f6',
  director_investment: '#8b5cf6',
  grant: '#ec489a',
  donation: '#ef4444',
  auxiliary: '#f97316',
  other: '#6b7280'
};

const SOURCE_LABELS = {
  fees: 'Student Fees',
  director_investment: 'Director',
  grant: 'Grants',
  donation: 'Donations',
  auxiliary: 'Auxiliary',
  other: 'Other'
};

const FinancialBreakdownCharts = ({ incomeStats, expenseStats }) => {
  const navigate = useNavigate();
  const [activeSource, setActiveSource] = useState(null);

  // Process income by source data
  const incomeBySource = incomeStats?.bySourceType || [];
  const totalIncome = incomeBySource.reduce((sum, s) => sum + (s.total || 0), 0);

  const incomeChartData = incomeBySource.map(item => ({
    name: SOURCE_LABELS[item.sourceType] || item.sourceType,
    value: item.total || 0,
    sourceType: item.sourceType,
    percentage: totalIncome > 0 ? (item.total / totalIncome) * 100 : 0,
    color: COLORS[item.sourceType] || '#6b7280'
  })).filter(item => item.value > 0).sort((a, b) => b.value - a.value);

  // Process expense by category data
  const expenseByCategory = expenseStats?.byCategory || [];
  const totalExpenses = expenseByCategory.reduce((sum, c) => sum + (c.total || 0), 0);

  const expenseChartData = expenseByCategory.map(item => ({
    name: item.categoryName || item._id,
    value: item.total || 0,
    categoryId: item.categoryId,
    percentage: totalExpenses > 0 ? (item.total / totalExpenses) * 100 : 0
  })).filter(item => item.value > 0).sort((a, b) => b.value - a.value).slice(0, 8);

  const handleSourceClick = (sourceType) => {
    if (sourceType === 'fees') {
      navigate('/fees');
    } else if (sourceType === 'director_investment') {
      navigate('/directors');
    } else if (sourceType === 'grant' || sourceType === 'donation' || sourceType === 'auxiliary' || sourceType === 'other') {
      navigate(`/income?sourceType=${sourceType}`);
    }
  };

  const handleCategoryClick = (categoryId) => {
    if (categoryId) {
      navigate(`/expenses?category=${categoryId}`);
    }
  };

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="text-sm font-medium text-gray-900 mb-2">{data.name}</p>
          <p className="text-xs text-gray-600">
            Amount: <span className="font-bold text-green-600">{formatCurrency(data.value)}</span>
          </p>
          <p className="text-xs text-gray-600">
            Percentage: <span className="font-bold text-gray-900">{data.percentage.toFixed(1)}%</span>
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Financial Breakdown</h3>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Income by Source - Pie Chart */}
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-3 text-center">Income by Source</h4>
          {incomeChartData.length > 0 ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={incomeChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={70}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    labelLine={{ stroke: '#9ca3af', strokeWidth: 1 }}
                    onClick={(data) => handleSourceClick(data.payload.sourceType)}
                    cursor="pointer"
                  >
                    {incomeChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-gray-400">
              No income data available
            </div>
          )}
          <div className="mt-4 text-center">
            <p className="text-xs text-gray-500">Click on any segment to view details</p>
          </div>
        </div>

        {/* Expenses by Category - Bar Chart */}
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-3 text-center">Top Expenses by Category</h4>
          {expenseChartData.length > 0 ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={expenseChartData}
                  layout="vertical"
                  margin={{ top: 5, right: 30, left: 80, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis type="number" tickFormatter={(value) => `KSh ${value/1000}k`} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 12 }} width={80} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar 
                    dataKey="value" 
                    fill="#f97316" 
                    radius={[0, 4, 4, 0]}
                    onClick={(data) => handleCategoryClick(data.payload.categoryId)}
                    cursor="pointer"
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-gray-400">
              No expense data available
            </div>
          )}
          <div className="mt-4 text-center">
            <p className="text-xs text-gray-500">Click on any bar to view category details</p>
          </div>
        </div>
      </div>

      {/* Summary Totals */}
      <div className="mt-4 pt-4 border-t border-gray-200 grid grid-cols-2 gap-4">
        <div className="text-center">
          <p className="text-xs text-gray-500">Total Income</p>
          <p className="text-lg font-bold text-green-600">{formatCurrency(totalIncome)}</p>
          <p className="text-xs text-gray-400">{incomeChartData.length} sources</p>
        </div>
        <div className="text-center">
          <p className="text-xs text-gray-500">Total Expenses</p>
          <p className="text-lg font-bold text-red-600">{formatCurrency(totalExpenses)}</p>
          <p className="text-xs text-gray-400">{expenseChartData.length} categories</p>
        </div>
      </div>
    </div>
  );
};

export default FinancialBreakdownCharts;