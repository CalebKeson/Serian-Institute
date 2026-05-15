// src/components/Directors/RepaymentModal.jsx
import React, { useState, useEffect } from 'react';
import {
  X,
  CreditCard,
  DollarSign,
  Calendar,
  Smartphone,
  Landmark,
  Wallet,
  AlertCircle,
  Loader,
  CheckCircle,
  Receipt,
  ArrowUpRight
} from 'lucide-react';
import { useDirectorStore } from '../../stores/directorStore';
import { formatCurrency } from '../../utils/feeFormatter';
import toast from 'react-hot-toast';

const RepaymentModal = ({ isOpen, onClose, director, onSuccess }) => {
  const { recordRepayment, loading } = useDirectorStore();

  const [formData, setFormData] = useState({
    amount: '',
    type: 'repayment',
    paymentMethod: 'bank_transfer',
    reference: '',
    description: '',
    paymentDate: new Date().toISOString().split('T')[0]
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [maxAmount, setMaxAmount] = useState(0);

  useEffect(() => {
    if (director) {
      setMaxAmount(director.outstandingBalance || 0);
    }
  }, [director]);

  const resetForm = () => {
    setFormData({
      amount: '',
      type: 'repayment',
      paymentMethod: 'bank_transfer',
      reference: '',
      description: '',
      paymentDate: new Date().toISOString().split('T')[0]
    });
    setErrors({});
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      newErrors.amount = 'Please enter a valid amount';
    } else if (parseFloat(formData.amount) > maxAmount) {
      newErrors.amount = `Amount cannot exceed outstanding balance of ${formatCurrency(maxAmount)}`;
    }

    if (!formData.paymentMethod) {
      newErrors.paymentMethod = 'Payment method is required';
    }

    if (!formData.paymentDate) {
      newErrors.paymentDate = 'Payment date is required';
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
      const result = await recordRepayment(director._id, {
        amount: parseFloat(formData.amount),
        type: formData.type,
        paymentMethod: formData.paymentMethod,
        reference: formData.reference,
        description: formData.description,
        paymentDate: formData.paymentDate
      });

      if (result.success) {
        toast.success('Repayment recorded successfully!');
        resetForm();
        if (onSuccess) onSuccess();
        onClose();
      }
    } catch (error) {
      console.error('Error recording repayment:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getMethodIcon = (method) => {
    const icons = {
      mpesa: Smartphone,
      bank_transfer: Landmark,
      cash: Wallet,
      cheque: CreditCard,
      other: CreditCard
    };
    const Icon = icons[method] || CreditCard;
    return <Icon className="w-5 h-5" />;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-xl bg-white">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <CreditCard className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Record Repayment</h2>
              <p className="text-sm text-gray-600">
                For: {director?.name} | Outstanding: {formatCurrency(maxAmount)}
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

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Amount */}
          <div>
            <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-2">
              Repayment Amount *
            </label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="number"
                id="amount"
                name="amount"
                value={formData.amount}
                onChange={handleChange}
                step="0.01"
                min="0"
                max={maxAmount}
                className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 ${
                  errors.amount ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="0.00"
              />
            </div>
            {errors.amount && (
              <p className="mt-1 text-sm text-red-600 flex items-center">
                <AlertCircle className="w-4 h-4 mr-1" />
                {errors.amount}
              </p>
            )}
            <p className="mt-1 text-xs text-gray-500">
              Maximum: {formatCurrency(maxAmount)}
            </p>
          </div>

          {/* Repayment Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Repayment Type
            </label>
            <div className="grid grid-cols-2 gap-3">
              {[
                { value: 'repayment', label: 'Loan Repayment', icon: ArrowUpRight, description: 'Principal repayment' },
                { value: 'dividend', label: 'Dividend Payment', icon: CheckCircle, description: 'Profit distribution' }
              ].map((type) => {
                const Icon = type.icon;
                const isSelected = formData.type === type.value;
                return (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, type: type.value }))}
                    className={`p-3 border rounded-lg text-left transition-all ${
                      isSelected
                        ? 'border-purple-500 bg-purple-50 ring-2 ring-purple-200'
                        : 'border-gray-200 hover:border-purple-300 hover:bg-purple-50/50'
                    }`}
                  >
                    <Icon className={`w-5 h-5 mb-2 ${isSelected ? 'text-purple-600' : 'text-gray-400'}`} />
                    <p className={`text-sm font-medium ${isSelected ? 'text-purple-700' : 'text-gray-700'}`}>
                      {type.label}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">{type.description}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Payment Method */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Payment Method *
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { value: 'bank_transfer', label: 'Bank Transfer', icon: Landmark },
                { value: 'mpesa', label: 'M-Pesa', icon: Smartphone },
                { value: 'cash', label: 'Cash', icon: Wallet },
                { value: 'other', label: 'Other', icon: CreditCard }
              ].map((method) => {
                const Icon = method.icon;
                const isSelected = formData.paymentMethod === method.value;
                return (
                  <button
                    key={method.value}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, paymentMethod: method.value }))}
                    className={`p-3 border rounded-lg flex flex-col items-center space-y-2 transition-all ${
                      isSelected
                        ? 'border-purple-500 bg-purple-50 ring-2 ring-purple-200'
                        : 'border-gray-200 hover:border-purple-300 hover:bg-purple-50/50'
                    }`}
                  >
                    {getMethodIcon(method.value)}
                    <span className={`text-xs font-medium ${isSelected ? 'text-purple-700' : 'text-gray-600'}`}>
                      {method.label}
                    </span>
                  </button>
                );
              })}
            </div>
            {errors.paymentMethod && (
              <p className="mt-2 text-sm text-red-600 flex items-center">
                <AlertCircle className="w-4 h-4 mr-1" />
                {errors.paymentMethod}
              </p>
            )}
          </div>

          {/* Reference */}
          <div>
            <label htmlFor="reference" className="block text-sm font-medium text-gray-700 mb-2">
              Reference / Transaction ID
            </label>
            <div className="relative">
              <Receipt className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                id="reference"
                name="reference"
                value={formData.reference}
                onChange={handleChange}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                placeholder="Bank reference, M-Pesa transaction ID, etc."
              />
            </div>
          </div>

          {/* Payment Date */}
          <div>
            <label htmlFor="paymentDate" className="block text-sm font-medium text-gray-700 mb-2">
              Payment Date *
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="date"
                id="paymentDate"
                name="paymentDate"
                value={formData.paymentDate}
                onChange={handleChange}
                max={new Date().toISOString().split('T')[0]}
                className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 ${
                  errors.paymentDate ? 'border-red-300' : 'border-gray-300'
                }`}
              />
            </div>
            {errors.paymentDate && (
              <p className="mt-1 text-sm text-red-600 flex items-center">
                <AlertCircle className="w-4 h-4 mr-1" />
                {errors.paymentDate}
              </p>
            )}
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
              Description (Optional)
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={3}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              placeholder="Additional details about this repayment..."
            />
          </div>

          {/* Form Actions */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || loading}
              className="px-4 py-2 border border-transparent rounded-lg text-sm font-medium text-white bg-gradient-to-r from-purple-600 to-indigo-700 hover:from-purple-700 hover:to-indigo-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center"
            >
              {isSubmitting || loading ? (
                <>
                  <Loader className="w-4 h-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Record Repayment
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RepaymentModal;