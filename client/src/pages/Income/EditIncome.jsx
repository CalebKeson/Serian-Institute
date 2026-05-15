// src/pages/Income/EditIncome.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router';
import {
  ArrowLeft,
  Save,
  X,
  Calendar,
  DollarSign,
  CreditCard,
  FileText,
  AlertCircle,
  Loader,
  User,
  Receipt
} from 'lucide-react';
import Layout from '../../components/Layout/Layout';
import { useIncomeStore } from '../../stores/incomeStore';
import { useDirectorStore } from '../../stores/directorStore';
import { useAuthStore } from '../../stores/authStore';
import { formatCurrency } from '../../utils/feeFormatter';
import toast from 'react-hot-toast';

const EditIncome = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user } = useAuthStore();
  const {
    currentIncomeTransaction,
    fetchIncomeTransaction,
    updateIncomeTransaction,
    loading
  } = useIncomeStore();
  const { directors, fetchDirectors } = useDirectorStore();

  const [formData, setFormData] = useState({
    description: '',
    reference: '',
    notes: '',
    status: 'received',
    incomeDate: ''
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true);

  // Fetch income data on mount
  useEffect(() => {
    if (id) {
      fetchIncomeTransaction(id);
      fetchDirectors();
    }
  }, [id]);

  // Populate form when income data is loaded
  useEffect(() => {
    if (currentIncomeTransaction && initialLoad) {
      setFormData({
        description: currentIncomeTransaction.description || '',
        reference: currentIncomeTransaction.reference || '',
        notes: currentIncomeTransaction.notes || '',
        status: currentIncomeTransaction.status || 'received',
        incomeDate: currentIncomeTransaction.incomeDate ? new Date(currentIncomeTransaction.incomeDate).toISOString().split('T')[0] : ''
      });
      setInitialLoad(false);
    }
  }, [currentIncomeTransaction]);

  // Check if user is admin
  if (user?.role !== 'admin') {
    navigate('/dashboard');
    return null;
  }

  // Check if income can be edited
  const canEdit = currentIncomeTransaction?.allocatedAmount === 0 && currentIncomeTransaction?.status !== 'cancelled';
  const canChangeStatus = currentIncomeTransaction?.allocatedAmount === 0;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.incomeDate) {
      newErrors.incomeDate = 'Income date is required';
    }

    if (!formData.status) {
      newErrors.status = 'Status is required';
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

    if (!canEdit) {
      toast.error('This income cannot be edited as it has been allocated to expenses');
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await updateIncomeTransaction(id, {
        description: formData.description,
        reference: formData.reference,
        notes: formData.notes,
        status: formData.status,
        incomeDate: formData.incomeDate
      });

      if (result.success) {
        toast.success('Income updated successfully!');
        navigate(`/income/${id}`);
      }
    } catch (error) {
      console.error('Error updating income:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    navigate(`/income/${id}`);
  };

  if (loading && initialLoad) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-96">
          <Loader className="w-8 h-8 animate-spin text-green-600" />
        </div>
      </Layout>
    );
  }

  if (!currentIncomeTransaction && !loading) {
    return (
      <Layout>
        <div className="text-center py-12">
          <AlertCircle className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Income not found</h3>
          <p className="mt-1 text-sm text-gray-500">The income transaction you're looking for doesn't exist.</p>
          <button
            onClick={handleCancel}
            className="mt-4 inline-flex items-center px-4 py-2 border border-transparent rounded-lg text-sm font-medium text-white bg-green-600 hover:bg-green-700"
          >
            Back to Income
          </button>
        </div>
      </Layout>
    );
  }

  const getSourceLabel = (sourceType) => {
    const labels = {
      fees: 'Student Fees',
      director_investment: 'Director Investment',
      grant: 'Grant',
      donation: 'Donation',
      auxiliary: 'Auxiliary Income',
      other: 'Other Income'
    };
    return labels[sourceType] || sourceType;
  };

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
                  <Edit className="w-8 h-8 mr-3 text-green-600" />
                  Edit Income
                </h1>
                <p className="mt-2 text-gray-600">
                  Update income details for {currentIncomeTransaction?.transactionNumber}
                </p>
                {!canEdit && (
                  <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-sm text-yellow-700 flex items-center">
                      <AlertCircle className="w-4 h-4 mr-2" />
                      Note: This income has been allocated to expenses and cannot be edited.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Source Info (Read-only) */}
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500">Transaction Number</p>
                  <p className="font-mono text-sm text-gray-900">{currentIncomeTransaction?.transactionNumber}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Source Type</p>
                  <p className="text-sm font-medium text-gray-900">{getSourceLabel(currentIncomeTransaction?.sourceType)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Amount</p>
                  <p className="text-sm font-bold text-green-600">{formatCurrency(currentIncomeTransaction?.amount)}</p>
                </div>
                {currentIncomeTransaction?.sourceType === 'director_investment' && currentIncomeTransaction.directorId && (
                  <div>
                    <p className="text-xs text-gray-500">Director</p>
                    <p className="text-sm text-gray-900">{currentIncomeTransaction.directorId.name}</p>
                  </div>
                )}
                {currentIncomeTransaction?.sourceType === 'grant' && currentIncomeTransaction.donorName && (
                  <div>
                    <p className="text-xs text-gray-500">Donor</p>
                    <p className="text-sm text-gray-900">{currentIncomeTransaction.donorName}</p>
                  </div>
                )}
                {currentIncomeTransaction?.sourceType === 'donation' && currentIncomeTransaction.donorName && (
                  <div>
                    <p className="text-xs text-gray-500">Donor</p>
                    <p className="text-sm text-gray-900">{currentIncomeTransaction.donorName}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Editable Fields */}
            <div className="space-y-4">
              <div>
                <label htmlFor="incomeDate" className="block text-sm font-medium text-gray-700 mb-2">
                  Income Date *
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="date"
                    id="incomeDate"
                    name="incomeDate"
                    value={formData.incomeDate}
                    onChange={handleChange}
                    max={new Date().toISOString().split('T')[0]}
                    className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 ${
                      errors.incomeDate ? 'border-red-300' : 'border-gray-300'
                    }`}
                  />
                </div>
                {errors.incomeDate && (
                  <p className="mt-1 text-sm text-red-600">{errors.incomeDate}</p>
                )}
              </div>

              <div>
                <label htmlFor="reference" className="block text-sm font-medium text-gray-700 mb-2">
                  Reference / Transaction ID
                </label>
                <div className="relative">
                  <Receipt className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    id="reference"
                    name="reference"
                    value={formData.reference}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                    placeholder="Bank reference, M-Pesa transaction ID, etc."
                  />
                </div>
              </div>

              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  placeholder="Brief description of this income..."
                />
              </div>

              <div>
                <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
                  Notes (Optional)
                </label>
                <textarea
                  id="notes"
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  placeholder="Any additional notes..."
                />
              </div>

              {canChangeStatus && (
                <div>
                  <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-2">
                    Status *
                  </label>
                  <select
                    id="status"
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 ${
                      errors.status ? 'border-red-300' : 'border-gray-300'
                    }`}
                  >
                    <option value="received">Received</option>
                    <option value="pending">Pending</option>
                    <option value="committed">Committed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                  {errors.status && (
                    <p className="mt-1 text-sm text-red-600">{errors.status}</p>
                  )}
                </div>
              )}
            </div>

            {/* Warning for allocated income */}
            {currentIncomeTransaction?.allocatedAmount > 0 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-start">
                  <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5 mr-3" />
                  <div>
                    <h4 className="text-sm font-medium text-yellow-800">Allocation Warning</h4>
                    <p className="text-sm text-yellow-700 mt-1">
                      This income has been allocated to expenses ({formatCurrency(currentIncomeTransaction.allocatedAmount)}).
                      You cannot change the amount, source, or status that would affect allocations.
                    </p>
                  </div>
                </div>
              </div>
            )}

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
                disabled={isSubmitting || loading || !canEdit}
                className="px-6 py-3 border border-transparent rounded-lg text-sm font-medium text-white bg-gradient-to-r from-green-600 to-emerald-700 hover:from-green-700 hover:to-emerald-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm hover:shadow-md flex items-center"
              >
                {isSubmitting || loading ? (
                  <>
                    <Loader className="w-4 h-4 mr-2 animate-spin" />
                    Updating...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Update Income
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

export default EditIncome;