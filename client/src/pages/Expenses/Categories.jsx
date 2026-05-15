// src/pages/Expenses/Categories.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import {
  Layers,
  Plus,
  Search,
  Filter,
  RefreshCw,
  Edit,
  Trash2,
  ChevronDown,
  ChevronUp,
  FolderTree,
  Folder,
  FolderOpen,
  DollarSign,
  AlertCircle,
  X,
  Save,
  XCircle,
  Calendar,
  Target,
  TrendingUp
} from 'lucide-react';
import Layout from '../../components/Layout/Layout';
import { useExpenseStore } from '../../stores/expenseStore';
import { useAuthStore } from '../../stores/authStore';
import CategoryTable from '../../components/Expenses/CategoryTable';
import BudgetProgress from '../../components/Expenses/BudgetProgress';
import BudgetTypeSelector from '../../components/Expenses/BudgetTypeSelector';
import RecurringBudgetForm from '../../components/Expenses/RecurringBudgetForm';
import OneTimeBudgetList from '../../components/Expenses/OneTimeBudgetList';
import { formatCurrency } from '../../utils/feeFormatter';
import toast from 'react-hot-toast';

const Categories = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const {
    expenseCategories,
    budgetSummary,
    currentExpenseCategory,
    loading,
    fetchExpenseCategories,
    fetchBudgetSummary,
    createExpenseCategory,
    updateExpenseCategory,
    deleteExpenseCategory,
    addOneTimeBudget,
    updateOneTimeBudget,
    deleteOneTimeBudget,
    fetchExpenseCategory
  } = useExpenseStore();

  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [activeTab, setActiveTab] = useState('details');
  const [formData, setFormData] = useState({
    name: '',
    parentCategory: '',
    description: '',
    budgetType: 'recurring',
    budgetPeriod: 'monthly',
    budgetAmount: '',
    budgetStartMonth: 1,
    budgetEndMonth: 12,
    oneTimeBudgets: []
  });
  const [formErrors, setFormErrors] = useState({});

  // Load data on mount
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    await Promise.all([
      fetchExpenseCategories(),
      fetchBudgetSummary()
    ]);
  };

  const handleRefresh = () => {
    loadData();
    toast.success('Data refreshed');
  };

  const handleAddCategory = () => {
    setFormData({
      name: '',
      parentCategory: '',
      description: '',
      budgetType: 'recurring',
      budgetPeriod: 'monthly',
      budgetAmount: '',
      budgetStartMonth: 1,
      budgetEndMonth: 12,
      oneTimeBudgets: []
    });
    setFormErrors({});
    setActiveTab('details');
    setShowAddModal(true);
  };

  const handleEditCategory = async (category) => {
    setSelectedCategory(category);
    // Fetch full category details including one-time budgets
    await fetchExpenseCategory(category._id);
    
    setFormData({
      name: category.name,
      parentCategory: category.parentCategory?._id || '',
      description: category.description || '',
      budgetType: category.budgetType || 'recurring',
      budgetPeriod: category.budgetPeriod || 'monthly',
      budgetAmount: category.budgetAmount || '',
      budgetStartMonth: category.budgetStartMonth || 1,
      budgetEndMonth: category.budgetEndMonth || 12,
      oneTimeBudgets: category.oneTimeBudgets || []
    });
    setFormErrors({});
    setActiveTab('details');
    setShowEditModal(true);
  };

  const handleDeleteCategory = (category) => {
    setDeleteConfirm(category);
  };

  const confirmDelete = async () => {
    if (deleteConfirm) {
      const result = await deleteExpenseCategory(deleteConfirm._id);
      if (result.success) {
        setDeleteConfirm(null);
        loadData();
      }
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Category name is required';
    }

    if (formData.budgetType === 'recurring') {
      if (!formData.budgetAmount || parseFloat(formData.budgetAmount) < 0) {
        newErrors.budgetAmount = 'Budget amount must be a positive number';
      }
      if (formData.budgetStartMonth > formData.budgetEndMonth) {
        newErrors.budgetPeriod = 'Start month cannot be after end month';
      }
    }

    setFormErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleCreate = async () => {
    if (!validateForm()) return;

    const submitData = {
      name: formData.name,
      parentCategory: formData.parentCategory || null,
      description: formData.description,
      budgetType: formData.budgetType,
      budgetPeriod: formData.budgetPeriod,
      budgetAmount: parseFloat(formData.budgetAmount) || 0,
      budgetStartMonth: formData.budgetStartMonth,
      budgetEndMonth: formData.budgetEndMonth
    };

    const result = await createExpenseCategory(submitData);

    if (result.success) {
      setShowAddModal(false);
      loadData();
    }
  };

  const handleUpdate = async () => {
    if (!validateForm()) return;

    const submitData = {
      name: formData.name,
      parentCategory: formData.parentCategory || null,
      description: formData.description,
      budgetType: formData.budgetType,
      budgetPeriod: formData.budgetPeriod,
      budgetAmount: parseFloat(formData.budgetAmount) || 0,
      budgetStartMonth: formData.budgetStartMonth,
      budgetEndMonth: formData.budgetEndMonth
    };

    const result = await updateExpenseCategory(selectedCategory._id, submitData);

    if (result.success) {
      setShowEditModal(false);
      setSelectedCategory(null);
      loadData();
    }
  };

  const handleOneTimeBudgetUpdate = async (budgetId, data, action) => {
    if (action === 'delete') {
      const result = await deleteOneTimeBudget(selectedCategory._id, budgetId);
      if (result.success) {
        toast.success('One-time budget deleted');
        await fetchExpenseCategory(selectedCategory._id);
        loadData();
      }
    }
  };

  // Check if user is admin
  if (user?.role !== 'admin') {
    navigate('/dashboard');
    return null;
  }

  const getParentCategoryOptions = (categories, level = 0) => {
    let options = [];
    categories.forEach(cat => {
      if (!selectedCategory || cat._id !== selectedCategory._id) {
        options.push({
          _id: cat._id,
          name: '  '.repeat(level) + cat.name,
          level
        });
        if (cat.children && cat.children.length > 0) {
          options = [...options, ...getParentCategoryOptions(cat.children, level + 1)];
        }
      }
    });
    return options;
  };

  return (
    <Layout>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                <FolderTree className="w-8 h-8 mr-3 text-purple-600" />
                Expense Categories
              </h1>
              <p className="mt-2 text-gray-600">
                Manage expense categories, budgets, and track spending
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
                onClick={handleAddCategory}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg text-sm font-medium text-white bg-gradient-to-r from-purple-600 to-indigo-700 hover:from-purple-700 hover:to-indigo-800 transition-all shadow-sm hover:shadow-md"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Category
              </button>
            </div>
          </div>
        </div>

        {/* Budget Summary Cards */}
        {budgetSummary && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <DollarSign className="w-6 h-6 text-purple-600" />
                </div>
              </div>
              <p className="text-sm text-gray-600 mb-1">Total Budget</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(budgetSummary.totals?.totalBudget || 0)}</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 bg-red-100 rounded-lg">
                  <AlertCircle className="w-6 h-6 text-red-600" />
                </div>
              </div>
              <p className="text-sm text-gray-600 mb-1">Total Spent</p>
              <p className="text-2xl font-bold text-red-600">{formatCurrency(budgetSummary.totals?.totalSpent || 0)}</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 bg-green-100 rounded-lg">
                  <DollarSign className="w-6 h-6 text-green-600" />
                </div>
              </div>
              <p className="text-sm text-gray-600 mb-1">Remaining</p>
              <p className="text-2xl font-bold text-green-600">
                {formatCurrency((budgetSummary.totals?.totalBudget || 0) - (budgetSummary.totals?.totalSpent || 0))}
              </p>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <TrendingUp className="w-6 h-6 text-blue-600" />
                </div>
              </div>
              <p className="text-sm text-gray-600 mb-1">Utilization</p>
              <p className="text-2xl font-bold text-blue-600">
                {budgetSummary.totals?.overallUtilization || 0}%
              </p>
              <div className="mt-2 w-full bg-gray-200 rounded-full h-1.5">
                <div
                  className={`h-1.5 rounded-full ${
                    (budgetSummary.totals?.overallUtilization || 0) >= 100 ? 'bg-red-500' :
                    (budgetSummary.totals?.overallUtilization || 0) >= 90 ? 'bg-yellow-500' :
                    'bg-green-500'
                  }`}
                  style={{ width: `${Math.min(100, budgetSummary.totals?.overallUtilization || 0)}%` }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Category Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <CategoryTable
            categories={expenseCategories}
            loading={loading}
            onEdit={handleEditCategory}
            onDelete={handleDeleteCategory}
          />
        </div>

        {/* Add Category Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-xl bg-white">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <Folder className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">Add Category</h2>
                    <p className="text-sm text-gray-600">Create a new expense category</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 transition-colors rounded-lg hover:bg-gray-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Tab Navigation */}
              <div className="border-b border-gray-200 mb-6">
                <nav className="flex -mb-px space-x-8">
                  <button
                    onClick={() => setActiveTab('details')}
                    className={`py-2 px-1 text-sm font-medium border-b-2 transition-colors ${
                      activeTab === 'details'
                        ? 'border-purple-600 text-purple-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    Category Details
                  </button>
                  <button
                    onClick={() => setActiveTab('budget')}
                    className={`py-2 px-1 text-sm font-medium border-b-2 transition-colors ${
                      activeTab === 'budget'
                        ? 'border-purple-600 text-purple-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    Budget Settings
                  </button>
                </nav>
              </div>

              {activeTab === 'details' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Category Name *
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 ${
                        formErrors.name ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="e.g., Office Supplies"
                    />
                    {formErrors.name && (
                      <p className="mt-1 text-sm text-red-600">{formErrors.name}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Parent Category (Optional)
                    </label>
                    <select
                      value={formData.parentCategory}
                      onChange={(e) => setFormData({ ...formData, parentCategory: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    >
                      <option value="">None (Top Level)</option>
                      {getParentCategoryOptions(expenseCategories).map(option => (
                        <option key={option._id} value={option._id}>
                          {option.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description (Optional)
                    </label>
                    <textarea
                      rows={2}
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                      placeholder="Describe what expenses belong in this category"
                    />
                  </div>
                </div>
              )}

              {activeTab === 'budget' && (
                <div className="space-y-6">
                  <BudgetTypeSelector
                    value={formData.budgetType}
                    onChange={(value) => setFormData({ ...formData, budgetType: value })}
                  />

                  {formData.budgetType === 'recurring' && (
                    <RecurringBudgetForm
                      formData={formData}
                      onChange={(field, value) => setFormData({ ...formData, [field]: value })}
                      errors={formErrors}
                    />
                  )}

                  {formData.budgetType === 'none' && (
                    <div className="bg-gray-50 rounded-lg p-4 text-center text-gray-500">
                      <p>No budget tracking for this category</p>
                      <p className="text-xs mt-1">Expenses will be recorded without budget limits</p>
                    </div>
                  )}
                </div>
              )}

              <div className="flex justify-end space-x-3 pt-6 mt-4 border-t border-gray-200">
                <button
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreate}
                  className="px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 transition-colors flex items-center"
                >
                  <Save className="w-4 h-4 mr-2" />
                  Create Category
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Edit Category Modal */}
        {showEditModal && selectedCategory && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-xl bg-white">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <Edit className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">Edit Category</h2>
                    <p className="text-sm text-gray-600">Update category details and budgets</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 transition-colors rounded-lg hover:bg-gray-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Tab Navigation */}
              <div className="border-b border-gray-200 mb-6">
                <nav className="flex -mb-px space-x-8">
                  <button
                    onClick={() => setActiveTab('details')}
                    className={`py-2 px-1 text-sm font-medium border-b-2 transition-colors ${
                      activeTab === 'details'
                        ? 'border-purple-600 text-purple-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    Category Details
                  </button>
                  <button
                    onClick={() => setActiveTab('budget')}
                    className={`py-2 px-1 text-sm font-medium border-b-2 transition-colors ${
                      activeTab === 'budget'
                        ? 'border-purple-600 text-purple-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    Budget Settings
                  </button>
                  {selectedCategory.budgetType === 'one-time' && (
                    <button
                      onClick={() => setActiveTab('one-time')}
                      className={`py-2 px-1 text-sm font-medium border-b-2 transition-colors ${
                        activeTab === 'one-time'
                          ? 'border-purple-600 text-purple-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      One-Time Items
                    </button>
                  )}
                </nav>
              </div>

              {activeTab === 'details' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Category Name *
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 ${
                        formErrors.name ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="e.g., Office Supplies"
                    />
                    {formErrors.name && (
                      <p className="mt-1 text-sm text-red-600">{formErrors.name}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Parent Category (Optional)
                    </label>
                    <select
                      value={formData.parentCategory}
                      onChange={(e) => setFormData({ ...formData, parentCategory: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    >
                      <option value="">None (Top Level)</option>
                      {getParentCategoryOptions(expenseCategories).map(option => (
                        <option key={option._id} value={option._id}>
                          {option.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description (Optional)
                    </label>
                    <textarea
                      rows={2}
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                      placeholder="Describe what expenses belong in this category"
                    />
                  </div>
                </div>
              )}

              {activeTab === 'budget' && (
                <div className="space-y-6">
                  <BudgetTypeSelector
                    value={formData.budgetType}
                    onChange={(value) => setFormData({ ...formData, budgetType: value })}
                  />

                  {formData.budgetType === 'recurring' && (
                    <RecurringBudgetForm
                      formData={formData}
                      onChange={(field, value) => setFormData({ ...formData, [field]: value })}
                      errors={formErrors}
                    />
                  )}

                  {formData.budgetType === 'none' && (
                    <div className="bg-gray-50 rounded-lg p-4 text-center text-gray-500">
                      <p>No budget tracking for this category</p>
                      <p className="text-xs mt-1">Expenses will be recorded without budget limits</p>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'one-time' && selectedCategory && (
                <OneTimeBudgetList
                  category={currentExpenseCategory || selectedCategory}
                  onUpdate={handleOneTimeBudgetUpdate}
                  readOnly={false}
                />
              )}

              <div className="flex justify-end space-x-3 pt-6 mt-4 border-t border-gray-200">
                <button
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdate}
                  className="px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 transition-colors flex items-center"
                >
                  <Save className="w-4 h-4 mr-2" />
                  Save Changes
                </button>
              </div>
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
                    Delete Category
                  </h3>
                  <div className="mt-2">
                    <p className="text-sm text-gray-500">
                      Are you sure you want to delete <span className="font-semibold">{deleteConfirm.name}</span>?
                    </p>
                    {deleteConfirm.children?.length > 0 && (
                      <p className="text-sm text-red-500 mt-2">
                        ⚠️ Warning: This category has {deleteConfirm.children.length} subcategories.
                        They will also be deleted.
                      </p>
                    )}
                    {deleteConfirm.totalSpent > 0 && (
                      <p className="text-sm text-red-500 mt-2">
                        ⚠️ Warning: This category has spent {formatCurrency(deleteConfirm.totalSpent)}.
                        Deleting it will affect historical data.
                      </p>
                    )}
                  </div>
                </div>
                <div className="mt-4 flex space-x-3">
                  <button
                    onClick={() => setDeleteConfirm(null)}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmDelete}
                    className="flex-1 px-4 py-2 border border-transparent rounded-lg text-sm font-medium text-white bg-red-600 hover:bg-red-700"
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

export default Categories;