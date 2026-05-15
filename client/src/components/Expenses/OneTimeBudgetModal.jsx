// src/components/Expenses/OneTimeBudgetModal.jsx
import React, { useState, useEffect } from 'react';
import {
  X,
  Target,
  Save,
  Loader,
  AlertCircle
} from 'lucide-react';
import { useExpenseStore } from '../../stores/expenseStore';
import OneTimeBudgetForm from './OneTimeBudgetForm';
import toast from 'react-hot-toast';

const OneTimeBudgetModal = ({ isOpen, onClose, onSuccess, categoryId, budget = null }) => {
  const { addOneTimeBudget, updateOneTimeBudget, loading } = useExpenseStore();

  const [formData, setFormData] = useState({
    description: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    status: 'planned',
    notes: ''
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (budget) {
      setFormData({
        description: budget.description || '',
        amount: budget.amount || '',
        date: budget.date ? new Date(budget.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        status: budget.status || 'planned',
        notes: budget.notes || ''
      });
    } else {
      resetForm();
    }
  }, [budget, isOpen]);

  const resetForm = () => {
    setFormData({
      description: '',
      amount: '',
      date: new Date().toISOString().split('T')[0],
      status: 'planned',
      notes: ''
    });
    setErrors({});
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }

    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      newErrors.amount = 'Valid amount is required';
    }

    if (!formData.date) {
      newErrors.date = 'Date is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      toast.error('Please fix the errors in the form');
      return;
    }

    setIsSubmitting(true);

    try {
      const data = {
        description: formData.description,
        amount: parseFloat(formData.amount),
        date: formData.date,
        status: formData.status,
        notes: formData.notes
      };

      let result;
      if (budget) {
        result = await updateOneTimeBudget(categoryId, budget._id, data);
      } else {
        result = await addOneTimeBudget(categoryId, data);
      }

      if (result.success) {
        toast.success(budget ? 'One-time budget updated' : 'One-time budget added');
        if (onSuccess) onSuccess();
        onClose();
      }
    } catch (error) {
      console.error('Error saving one-time budget:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-xl bg-white">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Target className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                {budget ? 'Edit One-Time Budget' : 'Add One-Time Budget'}
              </h2>
              <p className="text-sm text-gray-600">
                {budget ? 'Update the budget item details' : 'Add a new one-time budget item'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors rounded-lg hover:bg-gray-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <OneTimeBudgetForm
          formData={formData}
          onChange={handleChange}
          errors={errors}
        />

        {/* Form Actions */}
        <div className="flex justify-end space-x-3 pt-6 mt-4 border-t border-gray-200">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting || loading}
            className="px-4 py-2 border border-transparent rounded-lg text-sm font-medium text-white bg-gradient-to-r from-purple-600 to-indigo-700 hover:from-purple-700 hover:to-indigo-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center"
          >
            {isSubmitting || loading ? (
              <>
                <Loader className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                {budget ? 'Update Budget' : 'Add Budget'}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default OneTimeBudgetModal;