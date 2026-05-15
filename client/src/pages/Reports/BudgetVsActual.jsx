// src/pages/Reports/BudgetVsActual.jsx
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
  ArrowLeft,
  AlertCircle,
  CheckCircle,
  XCircle
} from 'lucide-react';
import Layout from '../../components/Layout/Layout';
import { useFinancialStore } from '../../stores/financialStore';
import { useAuthStore } from '../../stores/authStore';
import BudgetTable from '../../components/Reports/BudgetTable';
import { formatCurrency } from '../../utils/feeFormatter';
import toast from 'react-hot-toast';

const BudgetVsActual = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const {
    budgetVsActual,
    fetchBudgetVsActual,
    loading
  } = useFinancialStore();

  const [year, setYear] = useState(new Date().getFullYear());
  const [period, setPeriod] = useState('monthly');
  const [showYearPicker, setShowYearPicker] = useState(false);
  const [expandedSections, setExpandedSections] = useState({
    summary: true,
    categoryBreakdown: true,
    monthlyDetails: true
  });
  const [refreshing, setRefreshing] = useState(false);

  // Load data on mount and when filters change
  useEffect(() => {
    loadReport();
  }, [year, period]);

  const loadReport = async () => {
    setRefreshing(true);
    await fetchBudgetVsActual({ year, period });
    setRefreshing(false);
  };

  const handleRefresh = () => {
    loadReport();
    toast.success('Report refreshed');
  };

  const handleYearChange = (newYear) => {
    setYear(newYear);
    setShowYearPicker(false);
  };

  const handleExport = () => {
    if (!budgetVsActual) return;

    const headers = ['Category', 'Budget', 'Actual', 'Variance', 'Variance (%)', 'Status'];
    const data = (budgetVsActual.categorySummary || []).map(cat => [
      cat.categoryName,
      cat.budgetAmount,
      cat.actualAmount,
      cat.variance,
      cat.variancePercentage.toFixed(2),
      cat.variance >= 0 ? 'Over Budget' : 'Under Budget'
    ]);

    const csvContent = [headers, ...data]
      .map(row => row.join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `budget_vs_actual_${year}.csv`;
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

  if (loading && !budgetVsActual && !refreshing) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-96">
          <Loader className="w-8 h-8 animate-spin text-purple-600" />
        </div>
      </Layout>
    );
  }

  const yearlyTotals = budgetVsActual?.yearlyTotals || {
    totalBudget: 0,
    totalActual: 0,
    totalVariance: 0,
    variancePercentage: 0
  };
  const monthlyTotals = budgetVsActual?.monthlyTotals || [];
  const categorySummary = budgetVsActual?.categorySummary || [];

  const overBudgetCategories = categorySummary.filter(c => c.variance > 0);
  const underBudgetCategories = categorySummary.filter(c => c.variance < 0);
  const onBudgetCategories = categorySummary.filter(c => c.variance === 0);

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
                  <FileText className="w-8 h-8 mr-3 text-orange-600" />
                  Budget vs Actual Report
                </h1>
                <p className="mt-2 text-gray-600">
                  Compare budgeted vs actual expenses with variance analysis
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
                <span className="text-sm text-gray-600">Year:</span>
                <div className="relative">
                  <button
                    onClick={() => setShowYearPicker(!showYearPicker)}
                    className="inline-flex items-center px-3 py-1.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                  >
                    {year}
                    <ChevronDown className="w-4 h-4 ml-2" />
                  </button>

                  {showYearPicker && (
                    <div className="absolute left-0 mt-2 p-2 bg-white rounded-lg shadow-lg border border-gray-200 z-50 w-32">
                      {[2022, 2023, 2024, 2025, 2026].map(y => (
                        <button
                          key={y}
                          onClick={() => handleYearChange(y)}
                          className={`w-full text-left px-3 py-2 text-sm rounded-lg transition-colors ${
                            y === year
                              ? 'bg-orange-100 text-orange-700'
                              : 'hover:bg-gray-100'
                          }`}
                        >
                          {y}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">Period:</span>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setPeriod('monthly')}
                    className={`px-3 py-1 text-sm font-medium rounded-lg transition-colors ${
                      period === 'monthly'
                        ? 'bg-orange-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Monthly
                  </button>
                  <button
                    onClick={() => setPeriod('quarterly')}
                    className={`px-3 py-1 text-sm font-medium rounded-lg transition-colors ${
                      period === 'quarterly'
                        ? 'bg-orange-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Quarterly
                  </button>
                </div>
              </div>
            </div>

            <div className="text-sm text-gray-500">
              Fiscal Year: {year}
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-blue-100 rounded-lg">
                <DollarSign className="w-6 h-6 text-blue-600" />
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-1">Total Budget</p>
            <p className="text-2xl font-bold text-blue-600">{formatCurrency(yearlyTotals.totalBudget)}</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-orange-100 rounded-lg">
                <TrendingUp className="w-6 h-6 text-orange-600" />
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-1">Actual Spend</p>
            <p className="text-2xl font-bold text-orange-600">{formatCurrency(yearlyTotals.totalActual)}</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-purple-100 rounded-lg">
                <TrendingUp className="w-6 h-6 text-purple-600" />
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-1">Variance</p>
            <p className={`text-2xl font-bold ${yearlyTotals.totalVariance >= 0 ? 'text-red-600' : 'text-green-600'}`}>
              {formatCurrency(Math.abs(yearlyTotals.totalVariance))}
              {yearlyTotals.totalVariance >= 0 ? ' over' : ' under'}
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-green-100 rounded-lg">
                <AlertCircle className="w-6 h-6 text-green-600" />
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-1">Variance %</p>
            <p className={`text-2xl font-bold ${yearlyTotals.variancePercentage >= 0 ? 'text-red-600' : 'text-green-600'}`}>
              {Math.abs(yearlyTotals.variancePercentage).toFixed(1)}%
              {yearlyTotals.variancePercentage >= 0 ? ' over' : ' under'}
            </p>
          </div>
        </div>

        {/* Category Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-red-50 rounded-lg p-4 border border-red-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-red-700">Over Budget</p>
                <p className="text-2xl font-bold text-red-700">{overBudgetCategories.length}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-red-500" />
            </div>
            <p className="text-xs text-red-600 mt-2">
              Total over: {formatCurrency(overBudgetCategories.reduce((sum, c) => sum + c.variance, 0))}
            </p>
          </div>

          <div className="bg-green-50 rounded-lg p-4 border border-green-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-700">Under Budget</p>
                <p className="text-2xl font-bold text-green-700">{underBudgetCategories.length}</p>
              </div>
              <TrendingDown className="w-8 h-8 text-green-500" />
            </div>
            <p className="text-xs text-green-600 mt-2">
              Total under: {formatCurrency(Math.abs(underBudgetCategories.reduce((sum, c) => sum + c.variance, 0)))}
            </p>
          </div>

          <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-700">On Budget</p>
                <p className="text-2xl font-bold text-blue-700">{onBudgetCategories.length}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-blue-500" />
            </div>
            <p className="text-xs text-blue-600 mt-2">
              Categories meeting budget exactly
            </p>
          </div>
        </div>

        {/* Category Breakdown Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-6">
          <button
            onClick={() => toggleSection('categoryBreakdown')}
            className="w-full px-6 py-4 flex items-center justify-between bg-gray-50 hover:bg-gray-100 transition-colors border-b border-gray-200"
          >
            <div className="flex items-center space-x-2">
              <FileText className="w-5 h-5 text-orange-600" />
              <span className="font-medium text-gray-900">Category Breakdown</span>
            </div>
            {expandedSections.categoryBreakdown ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </button>

          {expandedSections.categoryBreakdown && (
            <div className="p-6">
              <BudgetTable
                data={budgetVsActual}
                year={year}
                period={period}
              />
            </div>
          )}
        </div>

        {/* Monthly Details */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <button
            onClick={() => toggleSection('monthlyDetails')}
            className="w-full px-6 py-4 flex items-center justify-between bg-gray-50 hover:bg-gray-100 transition-colors border-b border-gray-200"
          >
            <div className="flex items-center space-x-2">
              <Calendar className="w-5 h-5 text-blue-600" />
              <span className="font-medium text-gray-900">Monthly Breakdown</span>
            </div>
            {expandedSections.monthlyDetails ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </button>

          {expandedSections.monthlyDetails && monthlyTotals.length > 0 && (
            <div className="p-6">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Month</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Budget</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actual</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Variance</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Status</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {monthlyTotals.map((month, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">
                          {new Date(2000, month.month - 1, 1).toLocaleString('default', { month: 'long' })}
                        </td>
                        <td className="px-4 py-3 text-right text-sm text-gray-900">
                          {formatCurrency(month.totalBudget)}
                        </td>
                        <td className="px-4 py-3 text-right text-sm text-orange-600">
                          {formatCurrency(month.totalActual)}
                        </td>
                        <td className={`px-4 py-3 text-right text-sm font-medium ${
                          month.variance >= 0 ? 'text-red-600' : 'text-green-600'
                        }`}>
                          {formatCurrency(Math.abs(month.variance))}
                          {month.variance >= 0 ? ' over' : ' under'}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {month.variance > 0 ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                              <TrendingUp className="w-3 h-3 mr-1" />
                              Over
                            </span>
                          ) : month.variance < 0 ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              <TrendingDown className="w-3 h-3 mr-1" />
                              Under
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              On Target
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Monthly Trend Visualization */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                <h4 className="text-sm font-medium text-gray-700 mb-4">Monthly Trend</h4>
                <div className="space-y-3">
                  {monthlyTotals.map((month, index) => {
                    const percentage = month.totalBudget > 0 
                      ? (month.totalActual / month.totalBudget) * 100 
                      : 0;
                    const isOverBudget = percentage > 100;
                    
                    return (
                      <div key={index}>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="font-medium text-gray-600">
                            {new Date(2000, month.month - 1, 1).toLocaleString('default', { month: 'short' })}
                          </span>
                          <span className={`${isOverBudget ? 'text-red-600' : 'text-green-600'}`}>
                            {percentage.toFixed(1)}%
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${isOverBudget ? 'bg-red-500' : 'bg-green-500'}`}
                            style={{ width: `${Math.min(100, percentage)}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default BudgetVsActual;