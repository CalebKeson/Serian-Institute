// src/components/Fees/PaymentMethodChart.jsx
import React, { useState } from 'react';
import {
  PieChart as PieChartIcon,
  BarChart3,
  TrendingUp,
  Smartphone,
  Landmark,
  Wallet,
  CreditCard,
  ChevronDown,
  ChevronUp,
  Download
} from 'lucide-react';
import {
  PieChart,
  Pie,
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Sector
} from 'recharts';
import { formatCurrency, getPaymentMethodInfo } from '../../utils/feeFormatter';
import toast from 'react-hot-toast';

const COLORS = {
  mpesa: '#10b981',
  cooperative_bank: '#3b82f6',
  family_bank: '#8b5cf6',
  cash: '#f59e0b',
  other: '#6b7280'
};

const PaymentMethodChart = ({
  data = [],
  title = 'Payment Methods',
  showLegend = true,
  showTooltip = true,
  height = 300,
  chartType = 'pie', // 'pie', 'bar', 'donut'
  onChartTypeChange,
  onExport,
  loading = false
}) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [expanded, setExpanded] = useState(false);
  const [internalChartType, setInternalChartType] = useState(chartType);

  // Process data for chart
  const chartData = data.map(item => ({
    name: item.methodDisplay || item.method,
    value: item.total,
    count: item.count,
    method: item.method,
    color: COLORS[item.method] || '#6b7280'
  })).sort((a, b) => b.value - a.value);

  const totalAmount = chartData.reduce((sum, item) => sum + item.value, 0);
  const totalCount = chartData.reduce((sum, item) => sum + item.count, 0);

  // Custom active shape for pie chart
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

  // Custom tooltip
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
              Payments: <span className="font-bold text-gray-900">{data.count}</span>
            </p>
            <p className="text-xs text-gray-600">
              Percentage: <span className="font-bold text-gray-900">
                {totalAmount > 0 ? ((data.value / totalAmount) * 100).toFixed(1) : 0}%
              </span>
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  const handlePieEnter = (_, index) => {
    setActiveIndex(index);
  };

  const handleChartTypeChange = (type) => {
    setInternalChartType(type);
    if (onChartTypeChange) onChartTypeChange(type);
  };

  const handleExport = () => {
    if (onExport) {
      onExport(chartData);
    } else {
      // Default export as CSV
      const headers = ['Method', 'Amount', 'Payments', 'Percentage'];
      const csvData = chartData.map(item => [
        item.name,
        item.value,
        item.count,
        totalAmount > 0 ? ((item.value / totalAmount) * 100).toFixed(1) + '%' : '0%'
      ]);

      const csvContent = [headers, ...csvData]
        .map(row => row.join(','))
        .join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `payment_methods_${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);

      toast.success('Chart data exported successfully');
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (chartData.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
        <PieChartIcon className="mx-auto h-12 w-12 text-gray-400 mb-3" />
        <p className="text-gray-500">No payment data available</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <PieChartIcon className="w-5 h-5 text-green-600" />
          <h3 className="font-medium text-gray-900">{title}</h3>
        </div>

        <div className="flex items-center space-x-2">
          {/* Chart Type Selector */}
          <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden">
            <button
              onClick={() => handleChartTypeChange('pie')}
              className={`p-1.5 transition-colors ${
                internalChartType === 'pie' ? 'bg-green-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'
              }`}
              title="Pie Chart"
            >
              <PieChartIcon className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleChartTypeChange('donut')}
              className={`p-1.5 transition-colors ${
                internalChartType === 'donut' ? 'bg-green-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'
              }`}
              title="Donut Chart"
            >
              <PieChartIcon className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleChartTypeChange('bar')}
              className={`p-1.5 transition-colors ${
                internalChartType === 'bar' ? 'bg-green-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'
              }`}
              title="Bar Chart"
            >
              <BarChart3 className="w-4 h-4" />
            </button>
          </div>

          {/* Export Button */}
          <button
            onClick={handleExport}
            className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            title="Export data"
          >
            <Download className="w-4 h-4" />
          </button>

          {/* Expand/Collapse */}
          <button
            onClick={() => setExpanded(!expanded)}
            className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Chart */}
      <div className="p-4">
        <div style={{ height: expanded ? height * 1.5 : height }}>
          <ResponsiveContainer width="100%" height="100%">
            {internalChartType === 'bar' ? (
              <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                {showTooltip && <Tooltip content={<CustomTooltip />} />}
                {showLegend && <Legend />}
                <Bar dataKey="value" name="Amount" fill="#10b981" radius={[4, 4, 0, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            ) : (
              <PieChart>
                <Pie
                  activeIndex={activeIndex}
                  activeShape={renderActiveShape}
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={internalChartType === 'donut' ? 60 : 0}
                  outerRadius={80}
                  dataKey="value"
                  onMouseEnter={handlePieEnter}
                  labelLine={false}
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                {showTooltip && <Tooltip content={<CustomTooltip />} />}
                {showLegend && <Legend />}
              </PieChart>
            )}
          </ResponsiveContainer>
        </div>

        {/* Summary Stats */}
        <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-gray-50 rounded-lg p-2 text-center">
            <p className="text-xs text-gray-500">Total Amount</p>
            <p className="text-sm font-bold text-gray-900">{formatCurrency(totalAmount)}</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-2 text-center">
            <p className="text-xs text-gray-500">Total Payments</p>
            <p className="text-sm font-bold text-gray-900">{totalCount}</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-2 text-center">
            <p className="text-xs text-gray-500">Avg per Payment</p>
            <p className="text-sm font-bold text-gray-900">
              {formatCurrency(totalAmount / (totalCount || 1))}
            </p>
          </div>
          <div className="bg-gray-50 rounded-lg p-2 text-center">
            <p className="text-xs text-gray-500">Methods Used</p>
            <p className="text-sm font-bold text-gray-900">{chartData.length}</p>
          </div>
        </div>

        {/* Expanded Details */}
        {expanded && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <h4 className="text-sm font-medium text-gray-700 mb-3">Method Breakdown</h4>
            <div className="space-y-3">
              {chartData.map((item, index) => {
                const methodInfo = getPaymentMethodInfo(item.method);
                const percentage = totalAmount > 0 ? ((item.value / totalAmount) * 100).toFixed(1) : 0;
                
                return (
                  <div key={index} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center space-x-2">
                        <div className={`p-1 rounded-lg ${methodInfo.bgColor}`}>
                          {item.method === 'mpesa' && <Smartphone className={`w-3 h-3 ${methodInfo.textColor}`} />}
                          {item.method === 'cooperative_bank' && <Landmark className={`w-3 h-3 ${methodInfo.textColor}`} />}
                          {item.method === 'family_bank' && <Landmark className={`w-3 h-3 ${methodInfo.textColor}`} />}
                          {item.method === 'cash' && <Wallet className={`w-3 h-3 ${methodInfo.textColor}`} />}
                          {!['mpesa', 'cooperative_bank', 'family_bank', 'cash'].includes(item.method) && 
                            <CreditCard className={`w-3 h-3 ${methodInfo.textColor}`} />
                          }
                        </div>
                        <span className="font-medium text-gray-700">{item.name}</span>
                      </div>
                      <div className="flex items-center space-x-4">
                        <span className="text-gray-600">{formatCurrency(item.value)}</span>
                        <span className="text-gray-500 text-xs w-16 text-right">{item.count} payments</span>
                        <span className="text-green-600 font-medium w-12 text-right">{percentage}%</span>
                      </div>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-1.5">
                      <div
                        className="h-1.5 rounded-full"
                        style={{
                          width: `${percentage}%`,
                          backgroundColor: item.color
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentMethodChart;