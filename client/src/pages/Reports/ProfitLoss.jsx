// src/pages/Reports/ProfitLoss.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import {
  FileText,
  Download,
  Printer,
  RefreshCw,
  Calendar,
  ChevronDown,
  ChevronUp,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Loader,
  ArrowLeft
} from 'lucide-react';
import Layout from '../../components/Layout/Layout';
import { useFinancialStore } from '../../stores/financialStore';
import { useAuthStore } from '../../stores/authStore';
import PLStatement from '../../components/Reports/PLStatement';
import { formatCurrency } from '../../utils/feeFormatter';
import toast from 'react-hot-toast';

const ProfitLoss = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const {
    profitLoss,
    fetchProfitLoss,
    loading
  } = useFinancialStore();

  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });
  const [groupBy, setGroupBy] = useState('monthly');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [expandedSections, setExpandedSections] = useState({
    summary: true,
    breakdown: true
  });
  const [refreshing, setRefreshing] = useState(false);

  // Load data on mount and when filters change
  useEffect(() => {
    loadReport();
  }, [dateRange, groupBy]);

  const loadReport = async () => {
    setRefreshing(true);
    await fetchProfitLoss({
      startDate: dateRange.startDate,
      endDate: dateRange.endDate,
      groupBy
    });
    setRefreshing(false);
  };

  const handleRefresh = () => {
    loadReport();
    toast.success('Report refreshed');
  };

  const handleDateRangeChange = (type, value) => {
    setDateRange(prev => ({ ...prev, [type]: value }));
  };

  const handleApplyDateRange = () => {
    setShowDatePicker(false);
    loadReport();
  };

  const handleClearDateRange = () => {
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    setDateRange({
      startDate: startOfMonth.toISOString().split('T')[0],
      endDate: today.toISOString().split('T')[0]
    });
    setShowDatePicker(false);
  };

  const handleExport = () => {
    if (!profitLoss) return;

    const headers = ['Period', 'Income', 'Expenses', 'Profit', 'Profit Margin (%)'];
    const data = profitLoss.breakdown.map(period => [
      period.period,
      period.income,
      period.expenses,
      period.profit,
      period.profitMargin.toFixed(2)
    ]);

    const csvContent = [headers, ...data]
      .map(row => row.join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `profit_loss_${dateRange.startDate}_to_${dateRange.endDate}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);

    toast.success('Report exported');
  };

  const handlePrint = () => {
    window.print();
  };

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // Check if user is admin
  if (user?.role !== 'admin') {
    navigate('/dashboard');
    return null;
  }

  if (loading && !profitLoss && !refreshing) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-96">
          <Loader className="w-8 h-8 animate-spin text-purple-600" />
        </div>
      </Layout>
    );
  }

  const totals = profitLoss?.summary || {
    totalIncome: 0,
    totalExpenses: 0,
    totalProfit: 0,
    overallProfitMargin: 0
  };

  return (
    <Layout>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/financial-dashboard')}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                  <FileText className="w-8 h-8 mr-3 text-purple-600" />
                  Profit & Loss Statement
                </h1>
                <p className="mt-2 text-gray-600">
                  Income and expense analysis for the selected period
                </p>
              </div>
            </div>

            <div className="mt-4 sm:mt-0 flex space-x-3">
              <button
                onClick={handlePrint}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
              >
                <Printer className="w-4 h-4 mr-2" />
                Print
              </button>

              <button
                onClick={handleExport}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
              >
                <Download className="w-4 h-4 mr-2" />
                Export
              </button>

              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 transition-colors"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Calendar className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-600">Period:</span>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setGroupBy('monthly')}
                    className={`px-3 py-1 text-sm font-medium rounded-lg transition-colors ${
                      groupBy === 'monthly'
                        ? 'bg-purple-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Monthly
                  </button>
                  <button
                    onClick={() => setGroupBy('quarterly')}
                    className={`px-3 py-1 text-sm font-medium rounded-lg transition-colors ${
                      groupBy === 'quarterly'
                        ? 'bg-purple-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Quarterly
                  </button>
                </div>
              </div>

              <div className="relative">
                <button
                  onClick={() => setShowDatePicker(!showDatePicker)}
                  className="inline-flex items-center px-3 py-1.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  <Calendar className="w-4 h-4 mr-2" />
                  {dateRange.startDate} - {dateRange.endDate}
                  <ChevronDown className="w-4 h-4 ml-2" />
                </button>

                {showDatePicker && (
                  <div className="absolute left-0 mt-2 p-4 bg-white rounded-lg shadow-lg border border-gray-200 z-50 w-72">
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm text-gray-700 mb-1">Start Date</label>
                        <input
                          type="date"
                          value={dateRange.startDate}
                          onChange={(e) => handleDateRangeChange('startDate', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-gray-700 mb-1">End Date</label>
                        <input
                          type="date"
                          value={dateRange.endDate}
                          onChange={(e) => handleDateRangeChange('endDate', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                        />
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={handleApplyDateRange}
                          className="flex-1 px-3 py-1.5 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700"
                        >
                          Apply
                        </button>
                        <button
                          onClick={handleClearDateRange}
                          className="flex-1 px-3 py-1.5 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50"
                        >
                          Clear
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="text-sm text-gray-500">
              Period: {new Date(dateRange.startDate).toLocaleDateString()} - {new Date(dateRange.endDate).toLocaleDateString()}
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-green-100 rounded-lg">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-1">Total Income</p>
            <p className="text-2xl font-bold text-green-600">{formatCurrency(totals.totalIncome)}</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-red-100 rounded-lg">
                <TrendingDown className="w-6 h-6 text-red-600" />
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-1">Total Expenses</p>
            <p className="text-2xl font-bold text-red-600">{formatCurrency(totals.totalExpenses)}</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-purple-100 rounded-lg">
                <DollarSign className="w-6 h-6 text-purple-600" />
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-1">Net Profit</p>
            <p className={`text-2xl font-bold ${totals.totalProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(totals.totalProfit)}
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-blue-100 rounded-lg">
                <TrendingUp className="w-6 h-6 text-blue-600" />
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-1">Profit Margin</p>
            <p className="text-2xl font-bold text-blue-600">{totals.overallProfitMargin.toFixed(1)}%</p>
          </div>
        </div>

        {/* P&L Statement */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <button
            onClick={() => toggleSection('summary')}
            className="w-full px-6 py-4 flex items-center justify-between bg-gray-50 hover:bg-gray-100 transition-colors border-b border-gray-200"
          >
            <div className="flex items-center space-x-2">
              <FileText className="w-5 h-5 text-purple-600" />
              <span className="font-medium text-gray-900">Profit & Loss Statement</span>
            </div>
            {expandedSections.summary ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </button>

          {expandedSections.summary && (
            <div className="p-6">
              <PLStatement
                data={profitLoss}
                groupBy={groupBy}
                period={{ startDate: dateRange.startDate, endDate: dateRange.endDate }}
              />
            </div>
          )}
        </div>

        {/* Detailed Breakdown */}
        <div className="mt-6 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <button
            onClick={() => toggleSection('breakdown')}
            className="w-full px-6 py-4 flex items-center justify-between bg-gray-50 hover:bg-gray-100 transition-colors border-b border-gray-200"
          >
            <div className="flex items-center space-x-2">
              <TrendingUp className="w-5 h-5 text-green-600" />
              <span className="font-medium text-gray-900">Income & Expense Breakdown</span>
            </div>
            {expandedSections.breakdown ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </button>

          {expandedSections.breakdown && profitLoss?.breakdown && (
            <div className="p-6">
              <div className="space-y-6">
                {profitLoss.breakdown.map((period, index) => (
                  <div key={index} className="border-b border-gray-200 last:border-b-0 pb-4 last:pb-0">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">{period.period}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Income Breakdown */}
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
                          <TrendingUp className="w-4 h-4 mr-2 text-green-600" />
                          Income by Source
                        </h4>
                        <div className="space-y-2">
                          {Object.entries(period.incomeBreakdown || {}).map(([source, amount]) => (
                            <div key={source} className="flex justify-between items-center">
                              <span className="text-sm text-gray-600 capitalize">{source.replace('_', ' ')}</span>
                              <span className="text-sm font-medium text-green-600">{formatCurrency(amount)}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Expense Breakdown */}
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
                          <TrendingDown className="w-4 h-4 mr-2 text-red-600" />
                          Expenses by Category
                        </h4>
                        <div className="space-y-2">
                          {Object.entries(period.expenseBreakdown || {}).slice(0, 5).map(([category, amount]) => (
                            <div key={category} className="flex justify-between items-center">
                              <span className="text-sm text-gray-600">{category}</span>
                              <span className="text-sm font-medium text-red-600">{formatCurrency(amount)}</span>
                            </div>
                          ))}
                          {Object.keys(period.expenseBreakdown || {}).length > 5 && (
                            <div className="text-right text-xs text-gray-400">
                              + {Object.keys(period.expenseBreakdown).length - 5} more categories
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default ProfitLoss;