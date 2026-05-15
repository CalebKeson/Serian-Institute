// src/components/Financial/IncomeVsExpenseChart.jsx
import React, { useState } from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { formatCurrency } from '../../utils/feeFormatter';

const IncomeVsExpenseChart = ({ incomeStats, expenseStats, period = 'month' }) => {
  const [chartType, setChartType] = useState('line'); // 'line', 'bar', 'area'
  const [groupBy, setGroupBy] = useState(period === 'quarter' ? 'quarter' : 'month');

  // Combine income and expense data
  const processChartData = () => {
    const incomeTrend = incomeStats?.monthlyTrend || [];
    const expenseTrend = expenseStats?.monthlyTrend || [];

    if (groupBy === 'month') {
      // Create a map of all periods
      const allPeriods = new Set([
        ...incomeTrend.map(i => i.period),
        ...expenseTrend.map(e => e.period)
      ]);

      return Array.from(allPeriods)
        .sort()
        .map(period => ({
          period,
          income: incomeTrend.find(i => i.period === period)?.total || 0,
          expenses: expenseTrend.find(e => e.period === period)?.total || 0
        }));
    } else if (groupBy === 'quarter') {
      // Group by quarter
      const quarterlyData = {};
      
      [...incomeTrend, ...expenseTrend].forEach(item => {
        if (item.year && item.month) {
          const quarter = Math.ceil(item.month / 3);
          const key = `${item.year}-Q${quarter}`;
          if (!quarterlyData[key]) {
            quarterlyData[key] = { period: key, income: 0, expenses: 0 };
          }
          if (item.type === 'income') {
            quarterlyData[key].income += item.total;
          } else {
            quarterlyData[key].expenses += item.total;
          }
        }
      });
      
      return Object.values(quarterlyData).sort((a, b) => a.period.localeCompare(b.period));
    }
    
    return [];
  };

  const chartData = processChartData();

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="text-sm font-medium text-gray-900 mb-2">{label}</p>
          {payload.map((entry, index) => (
            <div key={index} className="flex items-center justify-between text-xs mb-1">
              <span style={{ color: entry.color }}>{entry.name}:</span>
              <span className="font-medium ml-4">{formatCurrency(entry.value)}</span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  if (chartData.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Income vs Expenses</h3>
        <div className="h-80 flex items-center justify-center">
          <p className="text-gray-400">No data available for the selected period</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex flex-wrap items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Income vs Expenses</h3>
        
        <div className="flex items-center space-x-2">
          {/* Group By Selector */}
          <div className="flex items-center space-x-1 bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setGroupBy('month')}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                groupBy === 'month'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setGroupBy('quarter')}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                groupBy === 'quarter'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Quarterly
            </button>
          </div>

          {/* Chart Type Selector */}
          <div className="flex items-center space-x-1 bg-gray-100 rounded-lg p-1 ml-2">
            <button
              onClick={() => setChartType('line')}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                chartType === 'line'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Line
            </button>
            <button
              onClick={() => setChartType('bar')}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                chartType === 'bar'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Bar
            </button>
            <button
              onClick={() => setChartType('area')}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                chartType === 'area'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Area
            </button>
          </div>
        </div>
      </div>

      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          {chartType === 'line' && (
            <LineChart data={chartData} margin={{ top: 10, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="period" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} tickFormatter={(value) => `KSh ${value/1000}k`} />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="income" 
                name="Income" 
                stroke="#10b981" 
                strokeWidth={2}
                dot={{ r: 4, strokeWidth: 2 }}
                activeDot={{ r: 6 }}
              />
              <Line 
                type="monotone" 
                dataKey="expenses" 
                name="Expenses" 
                stroke="#ef4444" 
                strokeWidth={2}
                dot={{ r: 4, strokeWidth: 2 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          )}

          {chartType === 'bar' && (
            <BarChart data={chartData} margin={{ top: 10, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="period" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} tickFormatter={(value) => `KSh ${value/1000}k`} />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Bar dataKey="income" name="Income" fill="#10b981" radius={[4, 4, 0, 0]} />
              <Bar dataKey="expenses" name="Expenses" fill="#ef4444" radius={[4, 4, 0, 0]} />
            </BarChart>
          )}

          {chartType === 'area' && (
            <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="period" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} tickFormatter={(value) => `KSh ${value/1000}k`} />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Area 
                type="monotone" 
                dataKey="income" 
                name="Income" 
                stroke="#10b981" 
                fill="#10b981" 
                fillOpacity={0.3}
              />
              <Area 
                type="monotone" 
                dataKey="expenses" 
                name="Expenses" 
                stroke="#ef4444" 
                fill="#ef4444" 
                fillOpacity={0.3}
              />
            </AreaChart>
          )}
        </ResponsiveContainer>
      </div>

      {/* Summary Stats */}
      <div className="mt-4 pt-4 border-t border-gray-200 grid grid-cols-2 gap-4">
        <div className="text-center">
          <p className="text-xs text-gray-500">Total Income</p>
          <p className="text-lg font-bold text-green-600">
            {formatCurrency(chartData.reduce((sum, d) => sum + d.income, 0))}
          </p>
        </div>
        <div className="text-center">
          <p className="text-xs text-gray-500">Total Expenses</p>
          <p className="text-lg font-bold text-red-600">
            {formatCurrency(chartData.reduce((sum, d) => sum + d.expenses, 0))}
          </p>
        </div>
      </div>
    </div>
  );
};

export default IncomeVsExpenseChart;