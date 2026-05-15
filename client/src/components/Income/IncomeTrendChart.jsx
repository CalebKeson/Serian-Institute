// src/components/Income/IncomeTrendChart.jsx
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

const IncomeTrendChart = ({ data = [], height = 300 }) => {
  const [chartType, setChartType] = useState('line'); // 'line', 'bar', 'area'
  const [groupBy, setGroupBy] = useState('month'); // 'month', 'quarter'

  // Process data based on grouping
  const processData = () => {
    if (!data || data.length === 0) return [];

    if (groupBy === 'month') {
      return data.map(item => ({
        period: item.monthName ? `${item.monthName} ${item.year}` : item.period,
        total: item.total || 0,
        count: item.count || 0
      }));
    } else if (groupBy === 'quarter') {
      // Group by quarter
      const quarterlyData = {};
      data.forEach(item => {
        if (item.year && item.month) {
          const quarter = Math.ceil(item.month / 3);
          const key = `${item.year}-Q${quarter}`;
          if (!quarterlyData[key]) {
            quarterlyData[key] = { period: key, total: 0, count: 0 };
          }
          quarterlyData[key].total += item.total || 0;
          quarterlyData[key].count += item.count || 0;
        } else {
          // Fallback to existing period
          quarterlyData[item.period] = { 
            period: item.period, 
            total: item.total || 0, 
            count: item.count || 0 
          };
        }
      });
      return Object.values(quarterlyData).sort((a, b) => a.period.localeCompare(b.period));
    }
    
    return data;
  };

  const chartData = processData();
  const totalAmount = chartData.reduce((sum, item) => sum + item.total, 0);
  const averageAmount = chartData.length > 0 ? totalAmount / chartData.length : 0;
  const highestMonth = chartData.reduce((max, item) => item.total > max.total ? item : max, { total: 0, period: '' });
  const lowestMonth = chartData.reduce((min, item) => item.total < min.total ? item : min, { total: Infinity, period: '' });

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
      <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
        <p className="text-gray-400">No trend data available</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-2">
          <span className="text-xs text-gray-500">Group by:</span>
          <button
            onClick={() => setGroupBy('month')}
            className={`px-3 py-1 text-xs font-medium rounded-lg transition-colors ${
              groupBy === 'month'
                ? 'bg-green-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setGroupBy('quarter')}
            className={`px-3 py-1 text-xs font-medium rounded-lg transition-colors ${
              groupBy === 'quarter'
                ? 'bg-green-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Quarterly
          </button>
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-xs text-gray-500">Chart type:</span>
          <button
            onClick={() => setChartType('line')}
            className={`px-3 py-1 text-xs font-medium rounded-lg transition-colors ${
              chartType === 'line'
                ? 'bg-green-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Line
          </button>
          <button
            onClick={() => setChartType('bar')}
            className={`px-3 py-1 text-xs font-medium rounded-lg transition-colors ${
              chartType === 'bar'
                ? 'bg-green-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Bar
          </button>
          <button
            onClick={() => setChartType('area')}
            className={`px-3 py-1 text-xs font-medium rounded-lg transition-colors ${
              chartType === 'area'
                ? 'bg-green-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Area
          </button>
        </div>
      </div>

      {/* Chart */}
      <div style={{ height }}>
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
                dataKey="total" 
                name="Income" 
                stroke="#10b981" 
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
              <Bar dataKey="total" name="Income" fill="#10b981" radius={[4, 4, 0, 0]} />
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
                dataKey="total" 
                name="Income" 
                stroke="#10b981" 
                fill="#10b981" 
                fillOpacity={0.3}
              />
            </AreaChart>
          )}
        </ResponsiveContainer>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-2">
        <div className="p-2 bg-gray-50 rounded-lg text-center">
          <p className="text-xs text-gray-500">Total</p>
          <p className="text-sm font-bold text-green-600">{formatCurrency(totalAmount)}</p>
        </div>
        <div className="p-2 bg-gray-50 rounded-lg text-center">
          <p className="text-xs text-gray-500">Average</p>
          <p className="text-sm font-bold text-gray-700">{formatCurrency(averageAmount)}</p>
        </div>
        <div className="p-2 bg-gray-50 rounded-lg text-center">
          <p className="text-xs text-gray-500">Highest</p>
          <p className="text-sm font-bold text-green-600">
            {formatCurrency(highestMonth.total)}<br />
            <span className="text-xs text-gray-400">{highestMonth.period}</span>
          </p>
        </div>
        <div className="p-2 bg-gray-50 rounded-lg text-center">
          <p className="text-xs text-gray-500">Lowest</p>
          <p className="text-sm font-bold text-orange-600">
            {formatCurrency(lowestMonth.total)}<br />
            <span className="text-xs text-gray-400">{lowestMonth.period}</span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default IncomeTrendChart;