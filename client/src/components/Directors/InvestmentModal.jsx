// src/components/Directors/InvestmentModal.jsx
import React, { useState } from 'react';
import {
  X,
  TrendingUp,
  DollarSign,
  Calendar,
  Smartphone,
  Landmark,
  Wallet,
  CreditCard,
  AlertCircle,
  Loader,
  CheckCircle,
  Receipt,
  Percent
} from 'lucide-react';
import { useDirectorStore } from '../../stores/directorStore';
import { formatCurrency } from '../../utils/feeFormatter';
import toast from 'react-hot-toast';

const InvestmentModal = ({ isOpen, onClose, directorId, onSuccess }) => {
  const { recordInvestment, loading } = useDirectorStore();

  const [formData, setFormData] = useState({
    amount: '',
    investmentType: 'equity',
    repaymentTerms: 'shares',
    interestRate: '',
    paymentMethod: 'bank_transfer',
    reference: '',
    description: '',
    investmentDate: new Date().toISOString().split('T')[0]
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const resetForm = () => {
    setFormData({
      amount: '',
      investmentType: 'equity',
      repaymentTerms: 'shares',
      interestRate: '',
      paymentMethod: 'bank_transfer',
      reference: '',
      description: '',
      investmentDate: new Date().toISOString().split('T')[0]
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
    }

    if (!formData.investmentType) {
      newErrors.investmentType = 'Investment type is required';
    }

    if (formData.investmentType === 'loan' && !formData.interestRate) {
      newErrors.interestRate = 'Interest rate is required for loans';
    }

    if (formData.investmentType === 'loan' && formData.interestRate && (formData.interestRate < 0 || formData.interestRate > 100)) {
      newErrors.interestRate = 'Interest rate must be between 0 and 100';
    }

    if (!formData.paymentMethod) {
      newErrors.paymentMethod = 'Payment method is required';
    }

    if (!formData.investmentDate) {
      newErrors.investmentDate = 'Investment date is required';
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
      const result = await recordInvestment(directorId, {
        amount: parseFloat(formData.amount),
        investmentType: formData.investmentType,
        repaymentTerms: formData.repaymentTerms,
        interestRate: formData.interestRate ? parseFloat(formData.interestRate) : undefined,
        paymentMethod: formData.paymentMethod,
        reference: formData.reference,
        description: formData.description,
        investmentDate: formData.investmentDate
      });

      if (result.success) {
        toast.success('Investment recorded successfully!');
        resetForm();
        if (onSuccess) onSuccess();
        onClose();
      }
    } catch (error) {
      console.error('Error recording investment:', error);
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
            <div className="p-2 bg-green-100 rounded-lg">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Record Investment</h2>
              <p className="text-sm text-gray-600">Record a new director investment</p>
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
              Investment Amount *
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
                className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 ${
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
          </div>

          {/* Investment Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Investment Type *
            </label>
            <div className="grid grid-cols-3 gap-3">
              {[
                { value: 'equity', label: 'Equity', icon: TrendingUp, description: 'Capital investment' },
                { value: 'loan', label: 'Loan', icon: CreditCard, description: 'Interest-bearing loan' },
                { value: 'donation', label: 'Donation', icon: CheckCircle, description: 'No repayment expected' }
              ].map((type) => {
                const Icon = type.icon;
                const isSelected = formData.investmentType === type.value;
                return (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, investmentType: type.value }))}
                    className={`p-3 border rounded-lg text-left transition-all ${
                      isSelected
                        ? 'border-green-500 bg-green-50 ring-2 ring-green-200'
                        : 'border-gray-200 hover:border-green-300 hover:bg-green-50/50'
                    }`}
                  >
                    <Icon className={`w-5 h-5 mb-2 ${isSelected ? 'text-green-600' : 'text-gray-400'}`} />
                    <p className={`text-sm font-medium ${isSelected ? 'text-green-700' : 'text-gray-700'}`}>
                      {type.label}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">{type.description}</p>
                  </button>
                );
              })}
            </div>
            {errors.investmentType && (
              <p className="mt-2 text-sm text-red-600 flex items-center">
                <AlertCircle className="w-4 h-4 mr-1" />
                {errors.investmentType}
              </p>
            )}
          </div>

          {/* Repayment Terms (for equity/loan) */}
          {formData.investmentType !== 'donation' && (
            <div>
              <label htmlFor="repaymentTerms" className="block text-sm font-medium text-gray-700 mb-2">
                Repayment Terms
              </label>
              <select
                id="repaymentTerms"
                name="repaymentTerms"
                value={formData.repaymentTerms}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              >
                <option value="shares">Shares (Dividend-based)</option>
                <option value="dividends">Dividends Only</option>
                <option value="interest">Interest Only</option>
                <option value="lump_sum">Lump Sum Repayment</option>
              </select>
            </div>
          )}

          {/* Interest Rate (for loans) */}
          {formData.investmentType === 'loan' && (
            <div>
              <label htmlFor="interestRate" className="block text-sm font-medium text-gray-700 mb-2">
                Interest Rate (%) *
              </label>
              <div className="relative">
                <Percent className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="number"
                  id="interestRate"
                  name="interestRate"
                  value={formData.interestRate}
                  onChange={handleChange}
                  step="0.1"
                  min="0"
                  max="100"
                  className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 ${
                    errors.interestRate ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="5.0"
                />
              </div>
              {errors.interestRate && (
                <p className="mt-1 text-sm text-red-600 flex items-center">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  {errors.interestRate}
                </p>
              )}
            </div>
          )}

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
                        ? 'border-green-500 bg-green-50 ring-2 ring-green-200'
                        : 'border-gray-200 hover:border-green-300 hover:bg-green-50/50'
                    }`}
                  >
                    {getMethodIcon(method.value)}
                    <span className={`text-xs font-medium ${isSelected ? 'text-green-700' : 'text-gray-600'}`}>
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
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                placeholder="Bank reference, M-Pesa transaction ID, etc."
              />
            </div>
          </div>

          {/* Investment Date */}
          <div>
            <label htmlFor="investmentDate" className="block text-sm font-medium text-gray-700 mb-2">
              Investment Date *
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="date"
                id="investmentDate"
                name="investmentDate"
                value={formData.investmentDate}
                onChange={handleChange}
                max={new Date().toISOString().split('T')[0]}
                className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 ${
                  errors.investmentDate ? 'border-red-300' : 'border-gray-300'
                }`}
              />
            </div>
            {errors.investmentDate && (
              <p className="mt-1 text-sm text-red-600 flex items-center">
                <AlertCircle className="w-4 h-4 mr-1" />
                {errors.investmentDate}
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
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              placeholder="Additional details about this investment..."
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
              className="px-4 py-2 border border-transparent rounded-lg text-sm font-medium text-white bg-gradient-to-r from-green-600 to-emerald-700 hover:from-green-700 hover:to-emerald-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center"
            >
              {isSubmitting || loading ? (
                <>
                  <Loader className="w-4 h-4 mr-2 animate-spin" />
                  Recording...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Record Investment
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default InvestmentModal;