// src/pages/Financial/FinancialStatements.jsx
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
  Wallet,
  Building,
  Landmark,
  Briefcase,
  Eye,
  Settings,
  X
} from 'lucide-react';
import Layout from '../../components/Layout/Layout';
import { useFinancialStore } from '../../stores/financialStore';
import { useAuthStore } from '../../stores/authStore';
import { useIncomeStore } from '../../stores/incomeStore';
import { useExpenseStore } from '../../stores/expenseStore';
import { useDirectorStore } from '../../stores/directorStore';
import { formatCurrency } from '../../utils/feeFormatter';
import toast from 'react-hot-toast';

const FinancialStatements = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const {
    profitLoss,
    cashFlow,
    fetchProfitLoss,
    fetchCashFlow,
    loading: financialLoading
  } = useFinancialStore();
  const { incomeStats, fetchIncomeStats } = useIncomeStore();
  const { expenseStats, fetchExpenseStats } = useExpenseStore();
  const { directorSummary, fetchDirectorSummary } = useDirectorStore();

  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });
  const [groupBy, setGroupBy] = useState('monthly');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showOpeningBalanceModal, setShowOpeningBalanceModal] = useState(false);
  const [openingBalance, setOpeningBalance] = useState(0);
  const [tempOpeningBalance, setTempOpeningBalance] = useState(0);
  const [expandedSections, setExpandedSections] = useState({
    profitLoss: true,
    cashFlow: true,
    balanceSheet: true
  });
  const [refreshing, setRefreshing] = useState(false);
  const [activeStatement, setActiveStatement] = useState('all');

  // Load saved opening balance from localStorage
  useEffect(() => {
    const savedBalance = localStorage.getItem('openingCashBalance');
    if (savedBalance) {
      setOpeningBalance(parseFloat(savedBalance));
      setTempOpeningBalance(parseFloat(savedBalance));
    }
  }, []);

  // Load data on mount and when filters change
  useEffect(() => {
    loadStatements();
  }, [dateRange, groupBy, openingBalance]);

  const loadStatements = async () => {
    setRefreshing(true);
    await Promise.all([
      fetchProfitLoss({
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
        groupBy
      }),
      fetchCashFlow({
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
        groupBy
      }),
      fetchIncomeStats({
        startDate: dateRange.startDate,
        endDate: dateRange.endDate
      }),
      fetchExpenseStats({
        startDate: dateRange.startDate,
        endDate: dateRange.endDate
      }),
      fetchDirectorSummary()
    ]);
    setRefreshing(false);
  };

  const handleRefresh = () => {
    loadStatements();
    toast.success('Statements refreshed');
  };

  const handleDateRangeChange = (type, value) => {
    setDateRange(prev => ({ ...prev, [type]: value }));
  };

  const handleApplyDateRange = () => {
    setShowDatePicker(false);
    loadStatements();
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

  const handleSaveOpeningBalance = () => {
    setOpeningBalance(tempOpeningBalance);
    localStorage.setItem('openingCashBalance', tempOpeningBalance.toString());
    setShowOpeningBalanceModal(false);
    toast.success('Opening balance updated');
    loadStatements();
  };

  const handleExport = () => {
    if (!profitLoss && !cashFlow) return;

    const headers = ['Statement', 'Metric', 'Amount'];
    const data = [];

    if (profitLoss) {
      data.push(['PROFIT & LOSS', '', '']);
      data.push(['', 'Total Income', profitLoss.summary?.totalIncome || 0]);
      data.push(['', 'Total Expenses', profitLoss.summary?.totalExpenses || 0]);
      data.push(['', 'Net Profit', profitLoss.summary?.totalProfit || 0]);
      data.push(['', 'Profit Margin (%)', profitLoss.summary?.overallProfitMargin || 0]);
      data.push(['', '', '']);
    }

    if (cashFlow) {
      data.push(['CASH FLOW', '', '']);
      data.push(['', 'Opening Balance', openingBalance]);
      data.push(['', 'Total Inflows', cashFlow.summary?.totalInflows || 0]);
      data.push(['', 'Total Outflows', cashFlow.summary?.totalOutflows || 0]);
      data.push(['', 'Net Cash Flow', cashFlow.summary?.totalNetCashFlow || 0]);
      
      // Calculate running balance
      let runningBalance = openingBalance;
      if (cashFlow.cashFlow) {
        cashFlow.cashFlow.forEach(period => {
          runningBalance += period.netCashFlow;
        });
      }
      data.push(['', 'Closing Balance', runningBalance]);
    }

    const csvContent = [headers, ...data]
      .map(row => row.join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `financial_statements_${dateRange.startDate}_to_${dateRange.endDate}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);

    toast.success('Statements exported');
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

  // Calculate running cash balance for cash flow periods
  const getCashFlowWithBalances = () => {
    if (!cashFlow?.cashFlow) return [];
    
    let runningBalance = openingBalance;
    return cashFlow.cashFlow.map(period => {
      runningBalance += period.netCashFlow;
      return {
        ...period,
        closingBalance: runningBalance
      };
    });
  };

  // Calculate final closing balance
  const getFinalClosingBalance = () => {
    let runningBalance = openingBalance;
    if (cashFlow?.cashFlow) {
      cashFlow.cashFlow.forEach(period => {
        runningBalance += period.netCashFlow;
      });
    }
    return runningBalance;
  };

  // Check if user is admin
  if (user?.role !== 'admin') {
    navigate('/dashboard');
    return null;
  }

  if (financialLoading && !profitLoss && !cashFlow && !refreshing) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-96">
          <Loader className="w-8 h-8 animate-spin text-purple-600" />
        </div>
      </Layout>
    );
  }

  const plTotals = profitLoss?.summary || {
    totalIncome: 0,
    totalExpenses: 0,
    totalProfit: 0,
    overallProfitMargin: 0
  };

  const cfTotals = cashFlow?.summary || {
    totalInflows: 0,
    totalOutflows: 0,
    totalNetCashFlow: 0
  };

  const cashFlowWithBalances = getCashFlowWithBalances();
  const finalClosingBalance = getFinalClosingBalance();

  // Calculate Balance Sheet data
  const totalAssets = plTotals.totalIncome - plTotals.totalExpenses + openingBalance;
  const directorLiabilities = directorSummary?.totalOutstanding || 0;
  const totalEquity = totalAssets - directorLiabilities;

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
                  <Briefcase className="w-8 h-8 mr-3 text-purple-600" />
                  Financial Statements
                </h1>
                <p className="mt-2 text-gray-600">
                  Complete financial overview including P&L, Cash Flow, and Balance Sheet
                </p>
              </div>
            </div>

            <div className="mt-4 sm:mt-0 flex space-x-3">
              <button
                onClick={() => setShowOpeningBalanceModal(true)}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
              >
                <Settings className="w-4 h-4 mr-2" />
                Set Opening Balance
              </button>

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

        {/* Opening Balance Modal */}
        {showOpeningBalanceModal && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-full max-w-md shadow-lg rounded-xl bg-white">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <Wallet className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">Set Opening Balance</h2>
                    <p className="text-sm text-gray-600">Enter the starting cash balance</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowOpeningBalanceModal(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 transition-colors rounded-lg hover:bg-gray-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Opening Cash Balance (KSh)
                  </label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="number"
                      value={tempOpeningBalance}
                      onChange={(e) => setTempOpeningBalance(parseFloat(e.target.value) || 0)}
                      step="1000"
                      min="0"
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                      placeholder="0.00"
                    />
                  </div>
                  <p className="mt-1 text-xs text-gray-500">
                    This is the cash balance at the beginning of the selected period
                  </p>
                </div>

                <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                  <button
                    onClick={() => setShowOpeningBalanceModal(false)}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveOpeningBalance}
                    className="px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 transition-colors"
                  >
                    Save Balance
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

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
              Opening Balance: {formatCurrency(openingBalance)}
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-green-100 rounded-lg">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-1">Total Income</p>
            <p className="text-2xl font-bold text-green-600">{formatCurrency(plTotals.totalIncome)}</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-red-100 rounded-lg">
                <TrendingDown className="w-6 h-6 text-red-600" />
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-1">Total Expenses</p>
            <p className="text-2xl font-bold text-red-600">{formatCurrency(plTotals.totalExpenses)}</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-purple-100 rounded-lg">
                <DollarSign className="w-6 h-6 text-purple-600" />
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-1">Net Profit</p>
            <p className={`text-2xl font-bold ${plTotals.totalProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(plTotals.totalProfit)}
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Wallet className="w-6 h-6 text-blue-600" />
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-1">Closing Balance</p>
            <p className="text-2xl font-bold text-blue-600">{formatCurrency(finalClosingBalance)}</p>
          </div>
        </div>

        {/* Statement Selector Tabs */}
        <div className="mb-6 border-b border-gray-200">
          <nav className="flex -mb-px space-x-8">
            <button
              onClick={() => setActiveStatement('all')}
              className={`py-4 px-1 text-sm font-medium border-b-2 transition-colors ${
                activeStatement === 'all'
                  ? 'border-purple-600 text-purple-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Eye className="w-4 h-4 inline mr-2" />
              All Statements
            </button>
            <button
              onClick={() => setActiveStatement('pl')}
              className={`py-4 px-1 text-sm font-medium border-b-2 transition-colors ${
                activeStatement === 'pl'
                  ? 'border-purple-600 text-purple-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <TrendingUp className="w-4 h-4 inline mr-2" />
              Profit & Loss
            </button>
            <button
              onClick={() => setActiveStatement('cf')}
              className={`py-4 px-1 text-sm font-medium border-b-2 transition-colors ${
                activeStatement === 'cf'
                  ? 'border-purple-600 text-purple-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Wallet className="w-4 h-4 inline mr-2" />
              Cash Flow
            </button>
            <button
              onClick={() => setActiveStatement('bs')}
              className={`py-4 px-1 text-sm font-medium border-b-2 transition-colors ${
                activeStatement === 'bs'
                  ? 'border-purple-600 text-purple-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Building className="w-4 h-4 inline mr-2" />
              Balance Sheet
            </button>
          </nav>
        </div>

        {/* Profit & Loss Statement */}
        {(activeStatement === 'all' || activeStatement === 'pl') && (
          <div className={`bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-6 ${activeStatement !== 'all' ? 'block' : ''}`}>
            <button
              onClick={() => toggleSection('profitLoss')}
              className="w-full px-6 py-4 flex items-center justify-between bg-gray-50 hover:bg-gray-100 transition-colors border-b border-gray-200"
            >
              <div className="flex items-center space-x-2">
                <TrendingUp className="w-5 h-5 text-green-600" />
                <span className="font-medium text-gray-900">Profit & Loss Statement</span>
              </div>
              {expandedSections.profitLoss ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </button>

            {expandedSections.profitLoss && (
              <div className="p-6 overflow-x-auto">
                {/* P&L Table - same as before */}
                <table className="min-w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Description</th>
                      <th className="text-right py-3 px-4 font-semibold text-gray-700">Amount (KSh)</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="bg-gray-50">
                      <td className="py-2 px-4 font-medium text-gray-800">INCOME</td>
                      <td className="py-2 px-4 text-right"></td>
                    </tr>
                    <tr>
                      <td className="py-2 px-4 pl-8 text-gray-600">Student Fees</td>
                      <td className="py-2 px-4 text-right text-green-600">
                        {formatCurrency(incomeStats?.bySourceType?.find(s => s.sourceType === 'fees')?.total || 0)}
                      </td>
                    </tr>
                    <tr>
                      <td className="py-2 px-4 pl-8 text-gray-600">Director Investments</td>
                      <td className="py-2 px-4 text-right text-green-600">
                        {formatCurrency(incomeStats?.bySourceType?.find(s => s.sourceType === 'director_investment')?.total || 0)}
                      </td>
                    </tr>
                    <tr>
                      <td className="py-2 px-4 pl-8 text-gray-600">Grants</td>
                      <td className="py-2 px-4 text-right text-green-600">
                        {formatCurrency(incomeStats?.bySourceType?.find(s => s.sourceType === 'grant')?.total || 0)}
                      </td>
                    </tr>
                    <tr>
                      <td className="py-2 px-4 pl-8 text-gray-600">Donations</td>
                      <td className="py-2 px-4 text-right text-green-600">
                        {formatCurrency(incomeStats?.bySourceType?.find(s => s.sourceType === 'donation')?.total || 0)}
                      </td>
                    </tr>
                    <tr>
                      <td className="py-2 px-4 pl-8 text-gray-600">Auxiliary Income</td>
                      <td className="py-2 px-4 text-right text-green-600">
                        {formatCurrency(incomeStats?.bySourceType?.find(s => s.sourceType === 'auxiliary')?.total || 0)}
                      </td>
                    </tr>
                    <tr>
                      <td className="py-2 px-4 pl-8 text-gray-600">Other Income</td>
                      <td className="py-2 px-4 text-right text-green-600">
                        {formatCurrency(incomeStats?.bySourceType?.find(s => s.sourceType === 'other')?.total || 0)}
                      </td>
                    </tr>
                    <tr className="border-t border-gray-200">
                      <td className="py-2 px-4 font-semibold text-gray-800">Total Income</td>
                      <td className="py-2 px-4 text-right font-bold text-green-600">
                        {formatCurrency(plTotals.totalIncome)}
                      </td>
                    </tr>

                    <tr className="bg-gray-50">
                      <td className="py-2 px-4 font-medium text-gray-800 pt-4">EXPENSES</td>
                      <td className="py-2 px-4 text-right"></td>
                    </tr>
                    {expenseStats?.byCategory?.slice(0, 10).map((category, idx) => (
                      <tr key={idx}>
                        <td className="py-2 px-4 pl-8 text-gray-600">{category.categoryName}</td>
                        <td className="py-2 px-4 text-right text-red-600">{formatCurrency(category.total)}</td>
                      </tr>
                    ))}
                    <tr className="border-t border-gray-200">
                      <td className="py-2 px-4 font-semibold text-gray-800">Total Expenses</td>
                      <td className="py-2 px-4 text-right font-bold text-red-600">
                        {formatCurrency(plTotals.totalExpenses)}
                      </td>
                    </tr>

                    <tr className="border-t-2 border-gray-300 bg-gray-50">
                      <td className="py-3 px-4 font-bold text-gray-900">NET PROFIT</td>
                      <td className={`py-3 px-4 text-right font-bold ${plTotals.totalProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatCurrency(plTotals.totalProfit)}
                      </td>
                    </tr>
                    <tr>
                      <td className="py-2 px-4 pl-8 text-gray-500 text-sm">Profit Margin</td>
                      <td className="py-2 px-4 text-right text-gray-600">{plTotals.overallProfitMargin.toFixed(1)}%</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Cash Flow Statement - UPDATED with correct running balance */}
        {(activeStatement === 'all' || activeStatement === 'cf') && (
          <div className={`bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-6 ${activeStatement !== 'all' ? 'block' : ''}`}>
            <button
              onClick={() => toggleSection('cashFlow')}
              className="w-full px-6 py-4 flex items-center justify-between bg-gray-50 hover:bg-gray-100 transition-colors border-b border-gray-200"
            >
              <div className="flex items-center space-x-2">
                <Wallet className="w-5 h-5 text-blue-600" />
                <span className="font-medium text-gray-900">Cash Flow Statement</span>
              </div>
              {expandedSections.cashFlow ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </button>

            {expandedSections.cashFlow && (
              <div className="p-6 overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Period</th>
                      <th className="text-right py-3 px-4 font-semibold text-gray-700">Inflows</th>
                      <th className="text-right py-3 px-4 font-semibold text-gray-700">Outflows</th>
                      <th className="text-right py-3 px-4 font-semibold text-gray-700">Net Cash Flow</th>
                      <th className="text-right py-3 px-4 font-semibold text-gray-700">Closing Balance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {/* Opening Balance Row */}
                    <tr className="bg-gray-50">
                      <td className="py-2 px-4 font-medium text-gray-800">Opening Balance</td>
                      <td className="py-2 px-4 text-right"></td>
                      <td className="py-2 px-4 text-right"></td>
                      <td className="py-2 px-4 text-right"></td>
                      <td className="py-2 px-4 text-right font-bold text-blue-600">
                        {formatCurrency(openingBalance)}
                      </td>
                    </tr>
                    
                    {cashFlowWithBalances.map((period, index) => (
                      <tr key={index}>
                        <td className="py-2 px-4 text-gray-700">{period.period}</td>
                        <td className="py-2 px-4 text-right text-green-600">{formatCurrency(period.inflows)}</td>
                        <td className="py-2 px-4 text-right text-red-600">{formatCurrency(period.outflows)}</td>
                        <td className={`py-2 px-4 text-right font-medium ${period.netCashFlow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {formatCurrency(period.netCashFlow)}
                        </td>
                        <td className="py-2 px-4 text-right font-bold text-blue-600">
                          {formatCurrency(period.closingBalance)}
                        </td>
                      </tr>
                    ))}
                    
                    <tr className="border-t-2 border-gray-300 bg-gray-50">
                      <td className="py-3 px-4 font-bold text-gray-900">Closing Balance</td>
                      <td className="py-3 px-4 text-right"></td>
                      <td className="py-3 px-4 text-right"></td>
                      <td className="py-3 px-4 text-right"></td>
                      <td className="py-3 px-4 text-right font-bold text-blue-600">
                        {formatCurrency(finalClosingBalance)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Balance Sheet */}
        {(activeStatement === 'all' || activeStatement === 'bs') && (
          <div className={`bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden ${activeStatement !== 'all' ? 'block' : ''}`}>
            <button
              onClick={() => toggleSection('balanceSheet')}
              className="w-full px-6 py-4 flex items-center justify-between bg-gray-50 hover:bg-gray-100 transition-colors border-b border-gray-200"
            >
              <div className="flex items-center space-x-2">
                <Building className="w-5 h-5 text-orange-600" />
                <span className="font-medium text-gray-900">Balance Sheet</span>
              </div>
              {expandedSections.balanceSheet ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </button>

            {expandedSections.balanceSheet && (
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* ASSETS */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">ASSETS</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Current Assets</span>
                        <span className="font-medium text-gray-900">{formatCurrency(totalAssets)}</span>
                      </div>
                      <div className="flex justify-between items-center pl-4">
                        <span className="text-gray-500 text-sm">Cash and Cash Equivalents</span>
                        <span className="text-gray-600">{formatCurrency(finalClosingBalance)}</span>
                      </div>
                      <div className="flex justify-between items-center pl-4">
                        <span className="text-gray-500 text-sm">Accounts Receivable</span>
                        <span className="text-gray-600">KSh 0</span>
                      </div>
                      <div className="flex justify-between items-center pt-2 border-t border-gray-200 mt-2">
                        <span className="font-semibold text-gray-800">Total Assets</span>
                        <span className="font-bold text-gray-900">{formatCurrency(totalAssets)}</span>
                      </div>
                    </div>
                  </div>

                  {/* LIABILITIES & EQUITY */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">LIABILITIES & EQUITY</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Liabilities</span>
                        <span className="font-medium text-gray-900">{formatCurrency(directorLiabilities)}</span>
                      </div>
                      <div className="flex justify-between items-center pl-4">
                        <span className="text-gray-500 text-sm">Director Liabilities</span>
                        <span className="text-gray-600">{formatCurrency(directorLiabilities)}</span>
                      </div>
                      <div className="flex justify-between items-center pl-4">
                        <span className="text-gray-500 text-sm">Accounts Payable</span>
                        <span className="text-gray-600">KSh 0</span>
                      </div>

                      <div className="flex justify-between items-center pt-2 mt-2">
                        <span className="text-gray-600">Equity</span>
                        <span className="font-medium text-gray-900">{formatCurrency(totalEquity)}</span>
                      </div>
                      <div className="flex justify-between items-center pl-4">
                        <span className="text-gray-500 text-sm">Retained Earnings</span>
                        <span className="text-gray-600">{formatCurrency(plTotals.totalProfit)}</span>
                      </div>
                      <div className="flex justify-between items-center pl-4">
                        <span className="text-gray-500 text-sm">Director Equity</span>
                        <span className="text-gray-600">
                          {formatCurrency((incomeStats?.bySourceType?.find(s => s.sourceType === 'director_investment')?.total || 0) - directorLiabilities)}
                        </span>
                      </div>

                      <div className="flex justify-between items-center pt-2 border-t border-gray-200 mt-2">
                        <span className="font-semibold text-gray-800">Total Liabilities & Equity</span>
                        <span className="font-bold text-gray-900">{formatCurrency(totalAssets)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-gray-200 text-xs text-gray-400 text-center">
                  <p>These financial statements are prepared on an accrual basis. The balance sheet represents the financial position as of the period end date.</p>
                  <p className="mt-1">Opening cash balance: {formatCurrency(openingBalance)} | Closing cash balance: {formatCurrency(finalClosingBalance)}</p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default FinancialStatements;