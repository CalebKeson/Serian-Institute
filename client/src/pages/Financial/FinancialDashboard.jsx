// src/pages/Financial/FinancialDashboard.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import {
  LayoutDashboard,
  RefreshCw,
  Calendar,
  Download,
  TrendingUp,
  TrendingDown,
  DollarSign,
  AlertCircle,
  Loader
} from 'lucide-react';
import Layout from '../../components/Layout/Layout';
import { useAuthStore } from '../../stores/authStore';
import { useFinancialStore } from '../../stores/financialStore';
import { useIncomeStore } from '../../stores/incomeStore';
import { useExpenseStore } from '../../stores/expenseStore';
import { useDirectorStore } from '../../stores/directorStore';
import FinancialSummaryCards from '../../components/Financial/FinancialSummaryCards';
import IncomeVsExpenseChart from '../../components/Financial/IncomeVsExpenseChart';
import FinancialBreakdownCharts from '../../components/Financial/FinancialBreakdownCharts';
import RecentTransactions from '../../components/Financial/RecentTransactions';
import QuickActions from '../../components/Financial/QuickActions';
import FinancialAlerts from '../../components/Financial/FinancialAlerts';
import toast from 'react-hot-toast';

const FinancialDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const {
    financialSummary,
    fetchFinancialSummary,
    loading: financialLoading
  } = useFinancialStore();

  const {
    incomeStats,
    fetchIncomeStats,
    loading: incomeLoading
  } = useIncomeStore();

  const {
    expenseStats,
    fetchExpenseStats,
    loading: expenseLoading
  } = useExpenseStore();

  const {
    directorSummary,
    fetchDirectorSummary,
    loading: directorLoading
  } = useDirectorStore();

  const [period, setPeriod] = useState('month');
  const [dateRange, setDateRange] = useState({
    startDate: '',
    endDate: ''
  });
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Load all dashboard data on mount
  useEffect(() => {
    loadDashboardData();
  }, [period, dateRange]);

  const loadDashboardData = async () => {
    setRefreshing(true);
    try {
      const date = new Date().toISOString().split('T')[0];
      await Promise.all([
        fetchFinancialSummary({ period, date: dateRange.startDate || date }),
        fetchIncomeStats(getDateRangeParams()),
        fetchExpenseStats(getDateRangeParams()),
        fetchDirectorSummary()
      ]);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setRefreshing(false);
    }
  };

  const getDateRangeParams = () => {
    if (dateRange.startDate && dateRange.endDate) {
      return { startDate: dateRange.startDate, endDate: dateRange.endDate };
    }
    return {};
  };

  const handleRefresh = () => {
    loadDashboardData();
    toast.success('Dashboard refreshed');
  };

  const handlePeriodChange = (newPeriod) => {
    setPeriod(newPeriod);
    setDateRange({ startDate: '', endDate: '' });
  };

  const handleDateRangeApply = () => {
    if (dateRange.startDate && dateRange.endDate) {
      setShowDatePicker(false);
      loadDashboardData();
    } else {
      toast.error('Please select both start and end dates');
    }
  };

  const handleDateRangeClear = () => {
    setDateRange({ startDate: '', endDate: '' });
    setShowDatePicker(false);
    loadDashboardData();
  };

  const handleExport = () => {
    // Export dashboard data as CSV
    if (!financialSummary) return;

    const headers = ['Metric', 'Value'];
    const data = [
      ['Total Income', financialSummary.income?.total || 0],
      ['Total Expenses', financialSummary.expenses?.total || 0],
      ['Net Profit', financialSummary.profit?.net || 0],
      ['Profit Margin (%)', financialSummary.profit?.margin || 0],
      ['Director Liabilities', financialSummary.liabilities?.director || 0],
      ['Operating Ratio (%)', financialSummary.summary?.operatingRatio || 0],
      ['Cash Flow', financialSummary.summary?.cashFlow || 0]
    ];

    const csvContent = [headers, ...data]
      .map(row => row.join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `financial_dashboard_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);

    toast.success('Dashboard data exported');
  };

  // Check if user is admin
  if (user?.role !== 'admin') {
    navigate('/dashboard');
    return null;
  }

  const loading = financialLoading || incomeLoading || expenseLoading || directorLoading || refreshing;

  return (
    <Layout>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                <LayoutDashboard className="w-8 h-8 mr-3 text-purple-600" />
                Financial Dashboard
              </h1>
              <p className="mt-2 text-gray-600">
                Complete overview of institutional finances
              </p>
            </div>

            <div className="mt-4 sm:mt-0 flex items-center space-x-3">
              {/* Period Selector */}
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handlePeriodChange('today')}
                  className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                    period === 'today' && !dateRange.startDate
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Today
                </button>
                <button
                  onClick={() => handlePeriodChange('week')}
                  className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                    period === 'week' && !dateRange.startDate
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Week
                </button>
                <button
                  onClick={() => handlePeriodChange('month')}
                  className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                    period === 'month' && !dateRange.startDate
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Month
                </button>
                <button
                  onClick={() => handlePeriodChange('quarter')}
                  className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                    period === 'quarter' && !dateRange.startDate
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Quarter
                </button>
                <button
                  onClick={() => handlePeriodChange('year')}
                  className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                    period === 'year' && !dateRange.startDate
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Year
                </button>
              </div>

              {/* Custom Date Range */}
              <div className="relative">
                <button
                  onClick={() => setShowDatePicker(!showDatePicker)}
                  className={`inline-flex items-center px-3 py-1.5 border rounded-lg text-sm font-medium transition-colors ${
                    dateRange.startDate || dateRange.endDate
                      ? 'bg-purple-100 border-purple-300 text-purple-700'
                      : 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50'
                  }`}
                >
                  <Calendar className="w-4 h-4 mr-2" />
                  Custom
                </button>

                {showDatePicker && (
                  <div className="absolute right-0 mt-2 p-4 bg-white rounded-lg shadow-lg border border-gray-200 z-50 w-72">
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm text-gray-700 mb-1">Start Date</label>
                        <input
                          type="date"
                          value={dateRange.startDate}
                          onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-gray-700 mb-1">End Date</label>
                        <input
                          type="date"
                          value={dateRange.endDate}
                          onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                        />
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={handleDateRangeApply}
                          className="flex-1 px-3 py-1.5 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700"
                        >
                          Apply
                        </button>
                        <button
                          onClick={handleDateRangeClear}
                          className="flex-1 px-3 py-1.5 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50"
                        >
                          Clear
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <button
                onClick={handleRefresh}
                disabled={loading}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
                title="Refresh"
              >
                <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
              </button>

              <button
                onClick={handleExport}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                title="Export"
              >
                <Download className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center min-h-96">
            <div className="text-center">
              <Loader className="w-12 h-12 animate-spin text-purple-600 mx-auto" />
              <p className="mt-4 text-gray-600">Loading dashboard data...</p>
            </div>
          </div>
        ) : (
          <>
            {/* Summary Cards */}
            <FinancialSummaryCards
              financialSummary={financialSummary}
              incomeStats={incomeStats}
              expenseStats={expenseStats}
              directorSummary={directorSummary}
            />

            {/* Main Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              <IncomeVsExpenseChart
                incomeStats={incomeStats}
                expenseStats={expenseStats}
                period={period}
              />
              <FinancialBreakdownCharts
                incomeStats={incomeStats}
                expenseStats={expenseStats}
              />
            </div>

            {/* Recent Transactions and Alerts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              <RecentTransactions
                incomeStats={incomeStats}
                expenseStats={expenseStats}
              />
              <FinancialAlerts
                expenseStats={expenseStats}
                directorSummary={directorSummary}
                financialSummary={financialSummary}
              />
            </div>

            {/* Quick Actions */}
            <QuickActions />
          </>
        )}
      </div>
    </Layout>
  );
};

export default FinancialDashboard;