// src/components/Income/IncomeBySourceChart.jsx
import React, { useState } from 'react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
  Sector
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
  director_investment: 'Director Investment',
  grant: 'Grants',
  donation: 'Donations',
  auxiliary: 'Auxiliary Income',
  other: 'Other Income'
};

const IncomeBySourceChart = ({ data = [], onSourceClick, height = 300 }) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [chartType, setChartType] = useState('pie'); // 'pie', 'donut'

  // Process data for chart
  const chartData = data.map(item => ({
    name: SOURCE_LABELS[item.sourceType] || item.sourceType,
    value: item.total || 0,
    sourceType: item.sourceType,
    count: item.count || 0,
    percentage: item.percentage || 0,
    color: COLORS[item.sourceType] || '#6b7280'
  })).filter(item => item.value > 0).sort((a, b) => b.value - a.value);

  const totalAmount = chartData.reduce((sum, item) => sum + item.value, 0);

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const percentage = totalAmount > 0 ? (data.value / totalAmount) * 100 : 0;
      
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="text-sm font-medium text-gray-900 mb-2">{data.name}</p>
          <div className="space-y-1">
            <p className="text-xs text-gray-600">
              Amount: <span className="font-bold text-green-600">{formatCurrency(data.value)}</span>
            </p>
            <p className="text-xs text-gray-600">
              Percentage: <span className="font-bold text-gray-900">{percentage.toFixed(1)}%</span>
            </p>
            {data.count > 0 && (
              <p className="text-xs text-gray-600">
                Transactions: <span className="font-bold text-gray-900">{data.count}</span>
              </p>
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  const renderActiveShape = (props) => {
    const {
      cx, cy, innerRadius, outerRadius, startAngle, endAngle,
      fill, payload, percent, value
    } = props;

    return (
      <g>
        <text x={cx} y={cy - 10} dy={8} textAnchor="middle" fill={fill}>
          {payload.name}
        </text>
        <text x={cx} y={cy + 10} dy={8} textAnchor="middle" fill="#333">
          {formatCurrency(value)}
        </text>
        <text x={cx} y={cy + 25} dy={8} textAnchor="middle" fill="#666" fontSize={12}>
          {`${(percent * 100).toFixed(1)}%`}
        </text>
        <Sector
          cx={cx}
          cy={cy}
          innerRadius={innerRadius}
          outerRadius={outerRadius + 5}
          startAngle={startAngle}
          endAngle={endAngle}
          fill={fill}
        />
        <Sector
          cx={cx}
          cy={cy}
          startAngle={startAngle}
          endAngle={endAngle}
          innerRadius={outerRadius + 6}
          outerRadius={outerRadius + 10}
          fill={fill}
        />
      </g>
    );
  };

  const handlePieEnter = (_, index) => {
    setActiveIndex(index);
  };

  const handlePieClick = (data, index) => {
    if (onSourceClick && data.payload.sourceType) {
      onSourceClick(data.payload.sourceType);
    }
  };

  if (chartData.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
        <p className="text-gray-400">No income data available</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Chart Type Selector */}
      <div className="flex justify-end space-x-2">
        <button
          onClick={() => setChartType('pie')}
          className={`px-3 py-1 text-xs font-medium rounded-lg transition-colors ${
            chartType === 'pie'
              ? 'bg-green-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Pie Chart
        </button>
        <button
          onClick={() => setChartType('donut')}
          className={`px-3 py-1 text-xs font-medium rounded-lg transition-colors ${
            chartType === 'donut'
              ? 'bg-green-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Donut Chart
        </button>
      </div>

      {/* Chart */}
      <div style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              activeIndex={activeIndex}
              activeShape={renderActiveShape}
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={chartType === 'donut' ? 60 : 0}
              outerRadius={90}
              dataKey="value"
              onMouseEnter={handlePieEnter}
              onClick={handlePieClick}
              labelLine={false}
              cursor={onSourceClick ? 'pointer' : 'default'}
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend 
              verticalAlign="bottom" 
              height={36}
              formatter={(value, entry) => {
                const data = entry.payload;
                const percentage = totalAmount > 0 ? ((data.value / totalAmount) * 100).toFixed(1) : 0;
                return `${value} (${percentage}%)`;
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-2 pt-2">
        {chartData.slice(0, 3).map((source, index) => (
          <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full`} style={{ backgroundColor: source.color }} />
              <span className="text-xs text-gray-600">{source.name}</span>
            </div>
            <span className="text-xs font-medium text-gray-900">{formatCurrency(source.value)}</span>
          </div>
        ))}
      </div>

      {/* Total */}
      <div className="pt-2 border-t border-gray-200">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700">Total Income</span>
          <span className="text-lg font-bold text-green-600">{formatCurrency(totalAmount)}</span>
        </div>
      </div>
    </div>
  );
};

export default IncomeBySourceChart;