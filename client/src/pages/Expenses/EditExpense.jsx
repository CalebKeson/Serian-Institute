// src/pages/Expenses/EditExpense.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router';
import {
  ArrowLeft,
  Save,
  X,
  Building,
  Calendar,
  CreditCard,
  FileText,
  AlertCircle,
  Loader,
  Plus,
  Trash2,
  DollarSign,
  Package,
  Tag,
  Edit
} from 'lucide-react';
import Layout from '../../components/Layout/Layout';
import { useExpenseStore } from '../../stores/expenseStore';
import { useAuthStore } from '../../stores/authStore';
import ExpenseItemsForm from '../../components/Expenses/ExpenseItemsForm';
import { formatCurrency } from '../../utils/feeFormatter';
import toast from 'react-hot-toast';

const EditExpense = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user } = useAuthStore();
  const {
    currentExpense,
    fetchExpense,
    updateExpense,
    loading,
    expenseCategories,
    fetchExpenseCategories
  } = useExpenseStore();

  const [formData, setFormData] = useState({
    vendor: '',
    description: '',
    expenseDate: '',
    paymentDate: '',
    paymentMethod: 'bank_transfer',
    items: [],
    notes: '',
    status: 'draft'
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [totalAmount, setTotalAmount] = useState(0);
  const [initialLoad, setInitialLoad] = useState(true);

  // Fetch expense data and categories on mount
  useEffect(() => {
    if (id) {
      Promise.all([
        fetchExpense(id),
        fetchExpenseCategories()
      ]);
    }
  }, [id]);

  // Populate form when expense data is loaded
  useEffect(() => {
    if (currentExpense && initialLoad) {
      setFormData({
        vendor: currentExpense.vendor || '',
        description: currentExpense.description || '',
        expenseDate: currentExpense.expenseDate ? new Date(currentExpense.expenseDate).toISOString().split('T')[0] : '',
        paymentDate: currentExpense.paymentDate ? new Date(currentExpense.paymentDate).toISOString().split('T')[0] : '',
        paymentMethod: currentExpense.paymentMethod || 'bank_transfer',
        items: currentExpense.items || [],
        notes: currentExpense.notes || '',
        status: currentExpense.status || 'draft'
      });
      setTotalAmount(currentExpense.totalAmount || 0);
      setInitialLoad(false);
    }
  }, [currentExpense]);

  // Calculate total amount when items change
  useEffect(() => {
    const total = formData.items.reduce((sum, item) => sum + (item.amount || 0), 0);
    setTotalAmount(total);
  }, [formData.items]);

  // Check if user is admin
  if (user?.role !== 'admin') {
    navigate('/dashboard');
    return null;
  }

  // Check if expense can be edited
  if (currentExpense && currentExpense.status !== 'draft') {
    navigate(`/expenses/${id}`);
    return null;
  }

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleItemsChange = (items) => {
    setFormData(prev => ({ ...prev, items }));
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.vendor.trim()) {
      newErrors.vendor = 'Vendor name is required';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }

    if (!formData.expenseDate) {
      newErrors.expenseDate = 'Expense date is required';
    }

    if (formData.items.length === 0) {
      newErrors.items = 'At least one expense item is required';
    } else {
      let hasItemError = false;
      formData.items.forEach((item, index) => {
        if (!item.category) {
          newErrors[`item_${index}_category`] = 'Category required';
          hasItemError = true;
        }
        if (!item.description?.trim()) {
          newErrors[`item_${index}_description`] = 'Description required';
          hasItemError = true;
        }
        if (!item.amount || item.amount <= 0) {
          newErrors[`item_${index}_amount`] = 'Valid amount required';
          hasItemError = true;
        }
      });
      if (hasItemError) {
        newErrors.items = 'Please fill all item fields correctly';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error('Please fix the errors in the form');
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await updateExpense(id, formData);

      if (result.success) {
        toast.success('Expense updated successfully!');
        navigate(`/expenses/${id}`);
      }
    } catch (error) {
      console.error('Error updating expense:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    navigate(`/expenses/${id}`);
  };

  const paymentMethods = [
    { value: 'bank_transfer', label: 'Bank Transfer', icon: CreditCard },
    { value: 'mpesa', label: 'M-Pesa', icon: CreditCard },
    { value: 'cash', label: 'Cash', icon: DollarSign },
    { value: 'cheque', label: 'Cheque', icon: FileText },
    { value: 'other', label: 'Other', icon: CreditCard }
  ];

  if (loading && initialLoad) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-96">
          <Loader className="w-8 h-8 animate-spin text-red-600" />
        </div>
      </Layout>
    );
  }

  if (!currentExpense && !loading) {
    return (
      <Layout>
        <div className="text-center py-12">
          <AlertCircle className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Expense not found</h3>
          <p className="mt-1 text-sm text-gray-500">The expense you're looking for doesn't exist.</p>
          <button
            onClick={handleCancel}
            className="mt-4 inline-flex items-center px-4 py-2 border border-transparent rounded-lg text-sm font-medium text-white bg-red-600 hover:bg-red-700"
          >
            Back to Expenses
          </button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={handleCancel}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                  <Edit className="w-8 h-8 mr-3 text-red-600" />
                  Edit Expense
                </h1>
                <p className="mt-2 text-gray-600">
                  Update expense information for {currentExpense?.expenseNumber}
                </p>
                {currentExpense?.status !== 'draft' && (
                  <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-sm text-yellow-700 flex items-center">
                      <AlertCircle className="w-4 h-4 mr-2" />
                      Note: Only draft expenses can be edited.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <form onSubmit={handleSubmit} className="p-6 space-y-8">
            {/* Basic Information Section */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Building className="w-5 h-5 mr-2 text-red-600" />
                Basic Information
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Vendor */}
                <div>
                  <label htmlFor="vendor" className="block text-sm font-medium text-gray-700 mb-2">
                    Vendor Name *
                  </label>
                  <input
                    type="text"
                    id="vendor"
                    name="vendor"
                    value={formData.vendor}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors ${
                      errors.vendor ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="Enter vendor or supplier name"
                  />
                  {errors.vendor && (
                    <p className="mt-1 text-sm text-red-600 flex items-center">
                      <AlertCircle className="w-4 h-4 mr-1" />
                      {errors.vendor}
                    </p>
                  )}
                </div>

                {/* Description */}
                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                    Description *
                  </label>
                  <input
                    type="text"
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors ${
                      errors.description ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="Brief description of the expense"
                  />
                  {errors.description && (
                    <p className="mt-1 text-sm text-red-600 flex items-center">
                      <AlertCircle className="w-4 h-4 mr-1" />
                      {errors.description}
                    </p>
                  )}
                </div>

                {/* Expense Date */}
                <div>
                  <label htmlFor="expenseDate" className="block text-sm font-medium text-gray-700 mb-2">
                    Expense Date *
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="date"
                      id="expenseDate"
                      name="expenseDate"
                      value={formData.expenseDate}
                      onChange={handleChange}
                      max={new Date().toISOString().split('T')[0]}
                      className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors ${
                        errors.expenseDate ? 'border-red-300' : 'border-gray-300'
                      }`}
                    />
                  </div>
                  {errors.expenseDate && (
                    <p className="mt-1 text-sm text-red-600 flex items-center">
                      <AlertCircle className="w-4 h-4 mr-1" />
                      {errors.expenseDate}
                    </p>
                  )}
                </div>

                {/* Payment Date (Optional) */}
                <div>
                  <label htmlFor="paymentDate" className="block text-sm font-medium text-gray-700 mb-2">
                    Payment Date (Optional)
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="date"
                      id="paymentDate"
                      name="paymentDate"
                      value={formData.paymentDate}
                      onChange={handleChange}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    />
                  </div>
                </div>

                {/* Payment Method */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Payment Method *
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {paymentMethods.map((method) => {
                      const Icon = method.icon;
                      const isSelected = formData.paymentMethod === method.value;
                      return (
                        <button
                          key={method.value}
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, paymentMethod: method.value }))}
                          className={`p-3 border rounded-lg flex flex-col items-center space-y-2 transition-all ${
                            isSelected
                              ? 'border-red-500 bg-red-50 ring-2 ring-red-200'
                              : 'border-gray-200 hover:border-red-300 hover:bg-red-50/50'
                          }`}
                        >
                          <Icon className={`w-5 h-5 ${isSelected ? 'text-red-600' : 'text-gray-400'}`} />
                          <span className={`text-xs font-medium ${isSelected ? 'text-red-700' : 'text-gray-600'}`}>
                            {method.label}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* Expense Items Section */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Package className="w-5 h-5 mr-2 text-red-600" />
                Expense Items
              </h2>

              <ExpenseItemsForm
                items={formData.items}
                onChange={handleItemsChange}
                categories={expenseCategories}
                errors={errors}
              />

              {errors.items && (
                <p className="mt-2 text-sm text-red-600 flex items-center">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  {errors.items}
                </p>
              )}

              {/* Total Amount Display */}
              <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">Total Amount</span>
                  <span className="text-2xl font-bold text-red-600">
                    {formatCurrency(totalAmount)}
                  </span>
                </div>
              </div>
            </div>

            {/* Notes Section */}
            <div>
              <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
                Notes (Optional)
              </label>
              <textarea
                id="notes"
                name="notes"
                rows={3}
                value={formData.notes}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors"
                placeholder="Any additional notes about this expense..."
              />
            </div>

            {/* Form Actions */}
            <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={handleCancel}
                className="px-6 py-3 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors shadow-sm flex items-center"
              >
                <X className="w-4 h-4 mr-2" />
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || loading}
                className="px-6 py-3 border border-transparent rounded-lg text-sm font-medium text-white bg-gradient-to-r from-red-600 to-orange-700 hover:from-red-700 hover:to-orange-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm hover:shadow-md flex items-center"
              >
                {isSubmitting || loading ? (
                  <>
                    <Loader className="w-4 h-4 mr-2 animate-spin" />
                    Updating...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Update Expense
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Layout>
  );
};

export default EditExpense;