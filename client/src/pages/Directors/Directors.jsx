// src/pages/Directors/Directors.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import {
  Users,
  UserPlus,
  Search,
  Filter,
  RefreshCw,
  Download,
  ChevronDown,
  ChevronUp,
  Eye,
  Edit,
  Trash2,
  UserCheck,
  UserX,
  TrendingUp,
  Wallet,
  CreditCard,
  AlertCircle,
  Plus,
  X
} from 'lucide-react';
import Layout from '../../components/Layout/Layout';
import { useDirectorStore } from '../../stores/directorStore';
import { useAuthStore } from '../../stores/authStore';
import DirectorTable from '../../components/Directors/DirectorTable';
import DirectorSummaryCards from '../../components/Directors/DirectorSummaryCards';
import { formatCurrency } from '../../utils/feeFormatter';
import toast from 'react-hot-toast';

const Directors = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const {
    directors,
    directorSummary,
    loading,
    filters,
    fetchDirectors,
    fetchDirectorSummary,
    deleteDirector,
    setFilters,
    resetFilters
  } = useDirectorStore();

  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  // Load directors on mount
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    await Promise.all([
      fetchDirectors(),
      fetchDirectorSummary()
    ]);
  };

  const handleRefresh = () => {
    loadData();
    toast.success('Data refreshed');
  };

  const handleSearch = () => {
    setFilters({ search: searchTerm });
    fetchDirectors();
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters({ [key]: value });
    fetchDirectors();
  };

  const handleClearFilters = () => {
    resetFilters();
    setSearchTerm('');
    fetchDirectors();
    setShowFilters(false);
  };

  const handleAddDirector = () => {
    navigate('/directors/add');
  };

  const handleViewDirector = (director) => {
    navigate(`/directors/${director._id}`);
  };

  const handleEditDirector = (director) => {
    navigate(`/directors/edit/${director._id}`);
  };

  const handleDeleteDirector = (director) => {
    setDeleteConfirm(director);
  };

  const confirmDelete = async () => {
    if (deleteConfirm) {
      const result = await deleteDirector(deleteConfirm._id);
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
    if (directors.length === 0) {
      toast.error('No directors to export');
      return;
    }

    const headers = ['Name', 'Email', 'Phone', 'Role', 'Total Invested', 'Total Repaid', 'Outstanding', 'Status'];
    const csvData = directors.map(d => [
      d.name,
      d.email,
      d.phone,
      d.role?.toUpperCase() || 'MEMBER',
      d.totalInvested || 0,
      d.totalRepaid || 0,
      d.outstandingBalance || 0,
      d.isActive ? 'Active' : 'Inactive'
    ]);

    const csvContent = [headers, ...csvData]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `directors_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);

    toast.success('Directors exported successfully');
  };

  // Check if user is admin
  if (user?.role !== 'admin') {
    navigate('/dashboard');
    return null;
  }

  const activeFilterCount = (filters.search ? 1 : 0) + (filters.isActive !== undefined && filters.isActive !== true ? 1 : 0);

  return (
    <Layout>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                <Users className="w-8 h-8 mr-3 text-blue-600" />
                Directors Management
              </h1>
              <p className="mt-2 text-gray-600">
                Manage directors, track investments, and monitor repayments
              </p>
            </div>

            <div className="mt-4 sm:mt-0 flex space-x-3">
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
                onClick={handleAddDirector}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 transition-all shadow-sm hover:shadow-md"
              >
                <UserPlus className="w-4 h-4 mr-2" />
                Add Director
              </button>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <DirectorSummaryCards summary={directorSummary} loading={loading} />

        {/* Search and Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search directors by name, email, or role..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={handleKeyPress}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={handleSearch}
                className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
              >
                Search
              </button>

              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`inline-flex items-center px-4 py-2 border rounded-lg text-sm font-medium transition-colors ${
                  activeFilterCount > 0
                    ? 'bg-blue-100 border-blue-300 text-blue-700'
                    : 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50'
                }`}
              >
                <Filter className="w-4 h-4 mr-2" />
                Filters
                {activeFilterCount > 0 && (
                  <span className="ml-2 bg-blue-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
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
                {/* Status Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Status
                  </label>
                  <select
                    value={filters.isActive === undefined ? 'all' : filters.isActive ? 'active' : 'inactive'}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (value === 'all') {
                        handleFilterChange('isActive', undefined);
                      } else if (value === 'active') {
                        handleFilterChange('isActive', true);
                      } else {
                        handleFilterChange('isActive', false);
                      }
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="all">All Directors</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>

              {/* Clear Filters Button */}
              {activeFilterCount > 0 && (
                <div className="mt-4 flex justify-end">
                  <button
                    onClick={handleClearFilters}
                    className="text-sm text-blue-600 hover:text-blue-700 flex items-center"
                  >
                    <X className="w-4 h-4 mr-1" />
                    Clear all filters
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Directors Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <DirectorTable
            directors={directors}
            loading={loading}
            onView={handleViewDirector}
            onEdit={handleEditDirector}
            onDelete={handleDeleteDirector}
          />
        </div>

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
                    Delete Director
                  </h3>
                  <div className="mt-2">
                    <p className="text-sm text-gray-500">
                      Are you sure you want to delete <span className="font-semibold">{deleteConfirm.name}</span>?
                    </p>
                    {deleteConfirm.totalInvested > 0 && (
                      <p className="text-sm text-red-500 mt-2">
                        ⚠️ Warning: This director has invested {formatCurrency(deleteConfirm.totalInvested)}. 
                        This action cannot be undone.
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

export default Directors;