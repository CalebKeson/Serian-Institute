// src/components/Dashboard/PaymentMethodsChart.jsx
import React from 'react';
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
import { formatCurrency, getPaymentMethodInfo } from '../../utils/feeFormatter';

const COLORS = {
  mpesa: '#10b981',
  cooperative_bank: '#3b82f6',
  family_bank: '#8b5cf6',
  cash: '#f59e0b',
  other: '#6b7280'
};

const PaymentMethodsChart = ({ data = [], chartType = 'pie' }) => {
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="text-sm font-medium text-gray-900 mb-2">{data.name}</p>
          <div className="space-y-1">
            <p className="text-xs text-gray-600">
              Amount: <span className="font-bold text-green-600">{formatCurrency(data.value)}</span>
            </p>
            <p className="text-xs text-gray-600">
              Percentage: <span className="font-bold text-gray-900">
                {data.percentage?.toFixed(1)}%
              </span>
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  // Process data for chart
  const chartData = (data || []).map(item => ({
    name: item.methodDisplay || item.method,
    value: item.total || 0,
    method: item.method,
    percentage: item.percentage || 0,
    color: COLORS[item.method] || '#6b7280'
  })).sort((a, b) => b.value - a.value);

  if (!chartData || chartData.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
        <p className="text-gray-400">No payment data available</p>
      </div>
    );
  }

  return (
    <div className="w-full h-64">
      <ResponsiveContainer width="100%" height="100%">
        {chartType === 'pie' ? (
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={80}
              paddingAngle={2}
              dataKey="value"
              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              labelLine={{ stroke: '#9ca3af', strokeWidth: 1 }}
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend />
          </PieChart>
        ) : (
          <BarChart data={chartData} layout="vertical" margin={{ top: 5, right: 30, left: 80, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis type="number" tick={{ fontSize: 12 }} tickFormatter={(value) => `KSh ${value/1000}k`} />
            <YAxis type="category" dataKey="name" tick={{ fontSize: 12 }} width={100} />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Bar dataKey="value" name="Amount" radius={[0, 4, 4, 0]}>
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        )}
      </ResponsiveContainer>
    </div>
  );
};

export default PaymentMethodsChart;