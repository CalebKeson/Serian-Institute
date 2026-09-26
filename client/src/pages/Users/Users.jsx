// src/pages/Users/Users.jsx - COMPLETE FIXED VERSION

import React, { useState, useEffect } from 'react';
import Layout from '../../components/Layout/Layout';
import { useUserStore } from '../../stores/userStore';
import { useAuthStore } from '../../stores/authStore';
import UserStats from '../../components/Users/UserStats';
import UserTable from '../../components/Users/UserTable';
import AddUserModal from '../../components/Users/AddUserModal';
import EditUserModal from '../../components/Users/EditUserModal';
import DeleteUserModal from '../../components/Users/DeleteUserModal';
import { Search, Filter, Plus, RefreshCw, X, Users as UsersIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';

const Users = () => {
  const { user: currentUser } = useAuthStore();
  const {
    users,
    userStats,
    loading,
    pagination,
    filters,
    fetchUsers,
    fetchUserStats,
    createUser,
    updateUser,
    deleteUser,
    setFilters,
    resetFilters,
    setPage
  } = useUserStore();

  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [deleteUserData, setDeleteUserData] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load data on mount
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      await Promise.all([
        fetchUsers(1, filters),
        fetchUserStats()
      ]);
    } catch (error) {
      console.error('Error loading users:', error);
      toast.error('Failed to load users');
    }
  };

  const handleSearch = () => {
    const newFilters = { ...filters, search: searchTerm };
    setFilters(newFilters);
    fetchUsers(1, newFilters);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleFilterChange = (key, value) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    fetchUsers(1, newFilters);
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    resetFilters();
  };

  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > pagination.total) return;
    setPage(newPage);
  };

  const handleCreateUser = async (userData) => {
    setIsSubmitting(true);
    try {
      const result = await createUser(userData);
      if (result.success) {
        await loadData();
        toast.success('User created successfully');
        return result;
      }
      return result;
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateUser = async (id, userData) => {
    setIsSubmitting(true);
    try {
      const result = await updateUser(id, userData);
      if (result.success) {
        await loadData();
        toast.success('User updated successfully');
        return result;
      }
      return result;
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteUser = async (id) => {
    setIsSubmitting(true);
    try {
      const result = await deleteUser(id);
      if (result.success) {
        setDeleteUserData(null);
        await loadData();
        toast.success('User deleted successfully');
        return result;
      }
      return result;
    } finally {
      setIsSubmitting(false);
    }
  };

  const activeFilterCount = Object.values(filters).filter(v => v && v !== '').length;

  const roleOptions = [
    { value: '', label: 'All Roles' },
    { value: 'admin', label: 'Admin' },
    { value: 'instructor', label: 'Instructor' },
    { value: 'student', label: 'Student' },
    { value: 'parent', label: 'Parent' },
    { value: 'receptionist', label: 'Receptionist' }
  ];

  const statusOptions = [
    { value: '', label: 'All Status' },
    { value: 'true', label: 'Active' },
    { value: 'false', label: 'Inactive' }
  ];

  // Generate page numbers for pagination
  const getPageNumbers = () => {
    const total = pagination.total || 1;
    const current = pagination.current || 1;
    const pages = [];
    
    if (total <= 7) {
      for (let i = 1; i <= total; i++) {
        pages.push(i);
      }
    } else {
      pages.push(1);
      if (current > 3) pages.push('...');
      for (let i = Math.max(2, current - 1); i <= Math.min(total - 1, current + 1); i++) {
        pages.push(i);
      }
      if (current < total - 2) pages.push('...');
      pages.push(total);
    }
    return pages;
  };

  // Debug logging
  console.log('📊 Users Page State:', {
    usersCount: users.length,
    pagination,
    filters,
    loading
  });

  // Show loading state
  if (loading && !users.length) {
    return (
      <>
        <div className="flex items-center justify-center min-h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                <UsersIcon className="w-8 h-8 mr-3 text-purple-600" />
                User Management
              </h1>
              <p className="mt-2 text-gray-600">
                Manage all system users and their roles
              </p>
            </div>

            <div className="mt-4 sm:mt-0 flex space-x-3">
              <button
                onClick={loadData}
                disabled={loading}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 transition-colors"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </button>

              <button
                onClick={() => setShowAddModal(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg text-sm font-medium text-white bg-gradient-to-r from-purple-600 to-indigo-700 hover:from-purple-700 hover:to-indigo-800 transition-all shadow-sm hover:shadow-md"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add User
              </button>
            </div>
          </div>
        </div>

        {/* Stats */}
        <UserStats stats={userStats} loading={loading} />

        {/* Search and Filters */}
        <div className="mt-6 bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search users by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={handleKeyPress}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              />
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={handleSearch}
                className="px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 transition-colors"
              >
                Search
              </button>

              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`inline-flex items-center px-4 py-2 border rounded-lg text-sm font-medium transition-colors ${
                  activeFilterCount > 0
                    ? 'bg-purple-100 border-purple-300 text-purple-700'
                    : 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50'
                }`}
              >
                <Filter className="w-4 h-4 mr-2" />
                Filters
                {activeFilterCount > 0 && (
                  <span className="ml-2 bg-purple-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {activeFilterCount}
                  </span>
                )}
              </button>
            </div>
          </div>

          {showFilters && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Role
                  </label>
                  <select
                    value={filters.role || ''}
                    onChange={(e) => handleFilterChange('role', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  >
                    {roleOptions.map(option => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Status
                  </label>
                  <select
                    value={filters.isActive || ''}
                    onChange={(e) => handleFilterChange('isActive', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  >
                    {statusOptions.map(option => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </div>

                <div className="flex items-end">
                  <button
                    onClick={handleClearFilters}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                  >
                    Clear Filters
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Users Table with container for scrolling */}
        <div className="users-table-container mt-6 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <UserTable
            users={users}
            loading={loading}
            onView={(user) => {
              toast.info(`Viewing ${user.name}`);
            }}
            onEdit={setEditUser}
            onDelete={setDeleteUserData}
            currentUser={currentUser}
          />
        </div>

        {/* Pagination - Fixed */}
        {pagination.total > 1 && (
          <div className="mt-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="text-sm text-gray-700">
              Showing <span className="font-medium">{(pagination.current - 1) * pagination.limit + 1}</span> to{' '}
              <span className="font-medium">
                {Math.min(pagination.current * pagination.limit, pagination.results)}
              </span>{' '}
              of <span className="font-medium">{pagination.results}</span> users
            </div>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={() => handlePageChange(pagination.current - 1)}
                disabled={pagination.current === 1}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-1"
              >
                <ChevronLeft className="w-4 h-4" />
                Previous
              </button>
              
              <div className="flex space-x-1">
                {getPageNumbers().map((page, index) => (
                  <button
                    key={index}
                    onClick={() => typeof page === 'number' && handlePageChange(page)}
                    disabled={typeof page !== 'number'}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      page === pagination.current
                        ? 'bg-purple-600 text-white'
                        : typeof page === 'number'
                          ? 'border border-gray-300 text-gray-700 hover:bg-gray-50'
                          : 'text-gray-400 cursor-default'
                    }`}
                  >
                    {page}
                  </button>
                ))}
              </div>
              
              <button
                onClick={() => handlePageChange(pagination.current + 1)}
                disabled={pagination.current === pagination.total}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-1"
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      {showAddModal && (
        <AddUserModal
          onClose={() => setShowAddModal(false)}
          onSuccess={handleCreateUser}
          loading={isSubmitting}
        />
      )}

      {editUser && (
        <EditUserModal
          user={editUser}
          onClose={() => setEditUser(null)}
          onSuccess={handleUpdateUser}
          loading={isSubmitting}
        />
      )}

      {deleteUserData && (
        <DeleteUserModal
          user={deleteUserData}
          onClose={() => setDeleteUserData(null)}
          onConfirm={handleDeleteUser}
          loading={isSubmitting}
        />
      )}
    </>
  );
};

export default Users;