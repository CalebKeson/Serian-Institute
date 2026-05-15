// src/pages/Income/Income.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import {
  TrendingUp,
  Plus,
  Search,
  Filter,
  RefreshCw,
  Download,
  ChevronDown,
  ChevronUp,
  Eye,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  DollarSign,
  Calendar,
  X,
  PieChart,
  LineChart
} from 'lucide-react';
import Layout from '../../components/Layout/Layout';
import { useIncomeStore } from '../../stores/incomeStore';
import { useAuthStore } from '../../stores/authStore';
import IncomeTable from '../../components/Income/IncomeTable';
import IncomeSummaryCards from '../../components/Income/IncomeSummaryCards';
import IncomeBySourceChart from '../../components/Income/IncomeBySourceChart';
import IncomeTrendChart from '../../components/Income/IncomeTrendChart';
import { formatCurrency } from '../../utils/feeFormatter';
import toast from 'react-hot-toast';

const Income = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuthStore();
  const {
    incomeTransactions,
    incomeStats,
    loading,
    filters,
    pagination,
    summary,
    fetchIncomeTransactions,
    fetchIncomeStats,
    deleteIncomeTransaction,
    setFilters,
    resetFilters,
    setPage
  } = useIncomeStore();

  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [showCharts, setShowCharts] = useState(true);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [dateRange, setDateRange] = useState({
    startDate: '',
    endDate: ''
  });

  // Get sourceType filter from URL
  const urlSourceType = searchParams.get('sourceType');
  const urlTab = searchParams.get('tab');

  // Apply URL filters on mount
  useEffect(() => {
    if (urlSourceType) {
      // Handle multiple source types (e.g., "grant,donation")
      const sourceTypes = urlSourceType.split(',');
      if (sourceTypes.length === 1) {
        setFilters({ sourceType: sourceTypes[0] });
      } else {
        // For multiple source types, we'll need to handle separately
        // For now, set the first one and note that we need multiple
        setFilters({ sourceType: sourceTypes[0] });
        console.log('Multiple source types detected:', sourceTypes);
      }
      fetchIncomeTransactions();
    }
  }, [urlSourceType]);

  // Load income data on mount
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    await Promise.all([
      fetchIncomeTransactions(),
      fetchIncomeStats()
    ]);
  };

  const handleRefresh = () => {
    loadData();
    toast.success('Data refreshed');
  };

  const handleSearch = () => {
    setFilters({ search: searchTerm });
    fetchIncomeTransactions();
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters({ [key]: value });
    fetchIncomeTransactions();
  };

  const handleDateRangeChange = (type, value) => {
    setDateRange(prev => ({ ...prev, [type]: value }));
  };

  const applyDateRange = () => {
    setFilters({
      startDate: dateRange.startDate,
      endDate: dateRange.endDate
    });
    fetchIncomeTransactions();
  };

  const clearDateRange = () => {
    setDateRange({ startDate: '', endDate: '' });
    setFilters({ startDate: '', endDate: '' });
    fetchIncomeTransactions();
  };

  const handleClearFilters = () => {
    resetFilters();
    setSearchTerm('');
    setDateRange({ startDate: '', endDate: '' });
    fetchIncomeTransactions();
    setShowFilters(false);
  };

  const handleRecordIncome = () => {
    navigate('/income/record');
  };

  const handleViewIncome = (income) => {
    navigate(`/income/${income._id}`);
  };

  const handleEditIncome = (income) => {
    navigate(`/income/edit/${income._id}`);
  };

  const handleDeleteIncome = (income) => {
    setDeleteConfirm(income);
  };

  const confirmDelete = async () => {
    if (deleteConfirm) {
      const result = await deleteIncomeTransaction(deleteConfirm._id);
      if (result.success) {
        setDeleteConfirm(null);
        loadData();
      }
    }
  };

  const cancelDelete = () => {
    setDeleteConfirm(null);
  };

  const handleExport = () => {
    if (incomeTransactions.length === 0) {
      toast.error('No income to export');
      return;
    }

    const headers = ['Date', 'Transaction #', 'Source', 'Amount', 'Status', 'Allocated', 'Reference', 'Description'];
    const csvData = incomeTransactions.map(t => [
      new Date(t.incomeDate).toLocaleDateString(),
      t.transactionNumber,
      t.sourceType?.toUpperCase() || 'Other',
      t.amount,
      t.status,
      t.allocatedAmount || 0,
      t.reference || 'N/A',
      t.description || ''
    ]);

    const csvContent = [headers, ...csvData]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `income_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);

    toast.success('Income exported successfully');
  };

  const handlePageChange = (newPage) => {
    setPage(newPage);
    fetchIncomeTransactions();
  };

  const activeFilterCount = (filters.search ? 1 : 0) +
    (filters.sourceType ? 1 : 0) +
    (filters.status ? 1 : 0) +
    (filters.startDate ? 1 : 0) +
    (filters.endDate ? 1 : 0);

  // Check if user is admin
  if (user?.role !== 'admin') {
    navigate('/dashboard');
    return null;
  }

  // Get page title based on URL filter
  const getPageTitle = () => {
    if (urlSourceType === 'director_investment') {
      return 'Director Investments';
    }
    if (urlSourceType === 'grant,donation' || urlSourceType === 'grant' || urlSourceType === 'donation') {
      return 'Grants & Donations';
    }
    return 'Income Management';
  };

  const getPageDescription = () => {
    if (urlSourceType === 'director_investment') {
      return 'Track all director investments and capital contributions';
    }
    if (urlSourceType === 'grant,donation' || urlSourceType === 'grant' || urlSourceType === 'donation') {
      return 'Manage grants and donations received';
    }
    return 'Track all income from fees, directors, grants, donations, and other sources';
  };

  return (
    <Layout>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                <TrendingUp className="w-8 h-8 mr-3 text-green-600" />
                {getPageTitle()}
              </h1>
              <p className="mt-2 text-gray-600">
                {getPageDescription()}
              </p>
              {urlSourceType && (
                <div className="mt-2 flex items-center space-x-2">
                  <span className="text-xs text-gray-500">Filtered by:</span>
                  <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs">
                    {urlSourceType === 'director_investment' ? 'Director Investments' :
                     urlSourceType === 'grant,donation' ? 'Grants & Donations' :
                     urlSourceType}
                  </span>
                  <button
                    onClick={() => navigate('/income')}
                    className="text-xs text-blue-600 hover:text-blue-700"
                  >
                    Clear filter
                  </button>
                </div>
              )}
            </div>

            <div className="mt-4 sm:mt-0 flex space-x-3">
              <button
                onClick={() => setShowCharts(!showCharts)}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
              >
                {showCharts ? <LineChart className="w-4 h-4 mr-2" /> : <PieChart className="w-4 h-4 mr-2" />}
                {showCharts ? 'Hide Charts' : 'Show Charts'}
              </button>

              <button
                onClick={handleRefresh}
                disabled={loading}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 transition-colors"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </button>

              <button
                onClick={handleExport}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
              >
                <Download className="w-4 h-4 mr-2" />
                Export
              </button>

              <button
                onClick={handleRecordIncome}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg text-sm font-medium text-white bg-gradient-to-r from-green-600 to-emerald-700 hover:from-green-700 hover:to-emerald-800 transition-all shadow-sm hover:shadow-md"
              >
                <Plus className="w-4 h-4 mr-2" />
                Record Income
              </button>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <IncomeSummaryCards stats={incomeStats} loading={loading} />

        {/* Charts Section */}
        {showCharts && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Income by Source</h3>
              <IncomeBySourceChart data={incomeStats?.bySourceType || []} />
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Monthly Trend</h3>
              <IncomeTrendChart data={incomeStats?.monthlyTrend || []} />
            </div>
          </div>
        )}

        {/* Search and Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by transaction number, description, or reference..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={handleKeyPress}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              />
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={handleSearch}
                className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors"
              >
                Search
              </button>

              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`inline-flex items-center px-4 py-2 border rounded-lg text-sm font-medium transition-colors ${
                  activeFilterCount > 0
                    ? 'bg-green-100 border-green-300 text-green-700'
                    : 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50'
                }`}
              >
                <Filter className="w-4 h-4 mr-2" />
                Filters
                {activeFilterCount > 0 && (
                  <span className="ml-2 bg-green-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {activeFilterCount}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Filters Panel */}
          {showFilters && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Source Type Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Source Type
                  </label>
                  <select
                    value={filters.sourceType}
                    onChange={(e) => handleFilterChange('sourceType', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  >
                    <option value="">All Sources</option>
                    <option value="fees">Student Fees</option>
                    <option value="director_investment">Director Investment</option>
                    <option value="grant">Grants</option>
                    <option value="donation">Donations</option>
                    <option value="auxiliary">Auxiliary Income</option>
                    <option value="other">Other Income</option>
                  </select>
                </div>

                {/* Status Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Status
                  </label>
                  <select
                    value={filters.status}
                    onChange={(e) => handleFilterChange('status', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  >
                    <option value="">All Statuses</option>
                    <option value="received">Received</option>
                    <option value="pending">Pending</option>
                    <option value="committed">Committed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>

                {/* Date Range */}
                <div className="md:col-span-3">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Date Range
                  </label>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <input
                      type="date"
                      value={dateRange.startDate}
                      onChange={(e) => handleDateRangeChange('startDate', e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      placeholder="Start Date"
                    />
                    <span className="text-gray-500 self-center">to</span>
                    <input
                      type="date"
                      value={dateRange.endDate}
                      onChange={(e) => handleDateRangeChange('endDate', e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      placeholder="End Date"
                    />
                    <div className="flex space-x-2">
                      <button
                        onClick={applyDateRange}
                        className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors"
                      >
                        Apply
                      </button>
                      <button
                        onClick={clearDateRange}
                        className="px-4 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        Clear
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Clear Filters Button */}
              {activeFilterCount > 0 && (
                <div className="mt-4 flex justify-end">
                  <button
                    onClick={handleClearFilters}
                    className="text-sm text-green-600 hover:text-green-700 flex items-center"
                  >
                    <X className="w-4 h-4 mr-1" />
                    Clear all filters
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Income Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <IncomeTable
            transactions={incomeTransactions}
            loading={loading}
            onView={handleViewIncome}
            onEdit={handleEditIncome}
            onDelete={handleDeleteIncome}
          />
        </div>

        {/* Pagination */}
        {pagination.total > 1 && (
          <div className="mt-6 flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Showing page {pagination.current} of {pagination.total} ({pagination.results} total transactions)
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => handlePageChange(pagination.current - 1)}
                disabled={pagination.current === 1}
                className="px-3 py-1 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Previous
              </button>
              <button
                onClick={() => handlePageChange(pagination.current + 1)}
                disabled={pagination.current === pagination.total}
                className="px-3 py-1 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {deleteConfirm && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-xl bg-white">
              <div className="mt-3">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                  <Trash2 className="h-6 w-6 text-red-600" />
                </div>
                <div className="mt-3 text-center">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">
                    Delete Income Transaction
                  </h3>
                  <div className="mt-2">
                    <p className="text-sm text-gray-500">
                      Are you sure you want to delete income transaction{' '}
                      <span className="font-semibold">{deleteConfirm.transactionNumber}</span>?
                    </p>
                    {deleteConfirm.allocatedAmount > 0 && (
                      <p className="text-sm text-red-500 mt-2">
                        ⚠️ Warning: This income has been allocated to expenses ({formatCurrency(deleteConfirm.allocatedAmount)}).
                        Deleting it will affect linked expenses.
                      </p>
                    )}
                  </div>
                </div>
                <div className="mt-4 flex space-x-3">
                  <button
                    onClick={cancelDelete}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmDelete}
                    className="flex-1 px-4 py-2 border border-transparent rounded-lg text-sm font-medium text-white bg-red-600 hover:bg-red-700 transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Income;