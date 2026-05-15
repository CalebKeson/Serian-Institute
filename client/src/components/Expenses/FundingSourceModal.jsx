// src/components/Expenses/FundingSourceModal.jsx
import React, { useState, useEffect } from 'react';
import {
  X,
  DollarSign,
  Plus,
  Trash2,
  Loader,
  AlertCircle,
  CheckCircle,
  TrendingUp,
  Wallet
} from 'lucide-react';
import { useIncomeStore } from '../../stores/incomeStore';
import { formatCurrency } from '../../utils/feeFormatter';
import toast from 'react-hot-toast';

const FundingSourceModal = ({ isOpen, onClose, onPay, expense, loading }) => {
  const { incomeTransactions, fetchIncomeTransactions, loading: incomeLoading } = useIncomeStore();
  
  const [allocations, setAllocations] = useState([]);
  const [totalAllocated, setTotalAllocated] = useState(0);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch available income transactions
  useEffect(() => {
    if (isOpen) {
      fetchIncomeTransactions({ status: 'received', unallocated: true });
    }
  }, [isOpen]);

  // Calculate total allocated when allocations change
  useEffect(() => {
    const total = allocations.reduce((sum, a) => sum + (a.amount || 0), 0);
    setTotalAllocated(total);
  }, [allocations]);

  const handleAddAllocation = () => {
    setAllocations([...allocations, { id: Date.now(), incomeId: '', amount: 0 }]);
  };

  const handleRemoveAllocation = (id) => {
    setAllocations(allocations.filter(a => a.id !== id));
  };

  const handleAllocationChange = (id, field, value) => {
    const updatedAllocations = allocations.map(a => {
      if (a.id === id) {
        if (field === 'incomeId') {
          const selected = incomeTransactions.find(t => t._id === value);
          return { ...a, incomeId: value, maxAmount: selected?.unallocatedAmount || 0 };
        }
        if (field === 'amount') {
          const amount = parseFloat(value) || 0;
          return { ...a, amount };
        }
      }
      return a;
    });
    setAllocations(updatedAllocations);
  };

  const validateAllocations = () => {
    const newErrors = {};
    
    if (allocations.length === 0) {
      newErrors.general = 'At least one funding source is required';
    }
    
    let total = 0;
    allocations.forEach((a, index) => {
      if (!a.incomeId) {
        newErrors[`allocation_${index}`] = 'Select a funding source';
      }
      if (!a.amount || a.amount <= 0) {
        newErrors[`allocation_${index}`] = 'Enter a valid amount';
      }
      if (a.maxAmount && a.amount > a.maxAmount) {
        newErrors[`allocation_${index}`] = `Amount exceeds available balance (${formatCurrency(a.maxAmount)})`;
      }
      total += a.amount || 0;
    });
    
    if (Math.abs(total - expense?.totalAmount) > 0.01) {
      newErrors.general = `Total allocated (${formatCurrency(total)}) does not match expense total (${formatCurrency(expense?.totalAmount)})`;
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

 // In FundingSourceModal.jsx - Update the handleSubmit function

const handleSubmit = async () => {
  if (!validateAllocations()) {
    return;
  }
  
  setIsSubmitting(true);
  
  try {
    // Ensure paymentDate is always included
    const payData = {
      fundingSources: allocations.map(a => ({
        incomeTransactionId: a.incomeId,
        sourceType: incomeTransactions.find(t => t._id === a.incomeId)?.sourceType,
        amount: a.amount
      })),
      paymentDate: new Date().toISOString().split('T')[0], // Always include current date
      paymentMethod: 'bank_transfer' // Default or get from form
    };
    
    await onPay(payData);
    
    toast.success('Payment recorded successfully!');
    if (onSuccess) onSuccess();
    onClose();
  } catch (error) {
    console.error('Payment error:', error);
    toast.error('Failed to record payment');
  } finally {
    setIsSubmitting(false);
  }
};

  const getAvailableIncome = (incomeId) => {
    const income = incomeTransactions.find(t => t._id === incomeId);
    return income?.unallocatedAmount || 0;
  };

  if (!isOpen) return null;

  const remainingToAllocate = (expense?.totalAmount || 0) - totalAllocated;
  const isFullyAllocated = Math.abs(remainingToAllocate) < 0.01;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-full max-w-3xl shadow-lg rounded-xl bg-white">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <DollarSign className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Funding Sources</h2>
              <p className="text-sm text-gray-600">
                Allocate income sources to pay this expense
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

        {/* Expense Summary */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-gray-500">Expense Total</p>
              <p className="text-2xl font-bold text-red-600">{formatCurrency(expense?.totalAmount)}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">Allocated</p>
              <p className={`text-2xl font-bold ${isFullyAllocated ? 'text-green-600' : 'text-orange-600'}`}>
                {formatCurrency(totalAllocated)}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">Remaining</p>
              <p className={`text-2xl font-bold ${remainingToAllocate === 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(remainingToAllocate)}
              </p>
            </div>
          </div>
          
          {/* Progress Bar */}
          <div className="mt-3">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all duration-500 ${
                  isFullyAllocated ? 'bg-green-500' : 'bg-orange-500'
                }`}
                style={{ width: `${(totalAllocated / (expense?.totalAmount || 1)) * 100}%` }}
              />
            </div>
          </div>
        </div>

        {/* Income Sources List */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-gray-700">Available Income Sources</h3>
            <button
              type="button"
              onClick={handleAddAllocation}
              className="text-sm text-green-600 hover:text-green-700 flex items-center"
            >
              <Plus className="w-4 h-4 mr-1" />
              Add Source
            </button>
          </div>

          {incomeLoading ? (
            <div className="flex justify-center py-8">
              <Loader className="w-6 h-6 animate-spin text-green-600" />
            </div>
          ) : allocations.length === 0 ? (
            <div className="text-center py-8 bg-gray-50 rounded-lg border border-gray-200">
              <Wallet className="mx-auto h-12 w-12 text-gray-400" />
              <p className="mt-2 text-sm text-gray-500">No funding sources allocated</p>
              <button
                onClick={handleAddAllocation}
                className="mt-2 text-sm text-green-600 hover:text-green-700"
              >
                Add a funding source
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {allocations.map((allocation, index) => {
                const availableBalance = allocation.maxAmount || getAvailableIncome(allocation.incomeId);
                return (
                  <div key={allocation.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex-1">
                      <select
                        value={allocation.incomeId}
                        onChange={(e) => handleAllocationChange(allocation.id, 'incomeId', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500"
                      >
                        <option value="">Select Income Source</option>
                        {incomeTransactions.map(income => (
                          <option key={income._id} value={income._id}>
                            {income.transactionNumber} - {income.sourceType} - Available: {formatCurrency(income.unallocatedAmount)}
                          </option>
                        ))}
                      </select>
                      {availableBalance > 0 && allocation.incomeId && (
                        <p className="text-xs text-gray-500 mt-1">
                          Available: {formatCurrency(availableBalance)}
                        </p>
                      )}
                    </div>
                    <div className="w-40">
                      <input
                        type="number"
                        value={allocation.amount}
                        onChange={(e) => handleAllocationChange(allocation.id, 'amount', e.target.value)}
                        step="0.01"
                        min="0"
                        max={availableBalance}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-right focus:ring-2 focus:ring-green-500"
                        placeholder="Amount"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveAllocation(allocation.id)}
                      className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    {errors[`allocation_${index}`] && (
                      <p className="text-xs text-red-600 mt-1">{errors[`allocation_${index}`]}</p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Error Message */}
        {errors.general && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-3">
            <div className="flex items-start">
              <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 mr-2" />
              <p className="text-sm text-red-700">{errors.general}</p>
            </div>
          </div>
        )}

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
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting || loading || !isFullyAllocated}
            className="px-4 py-2 border border-transparent rounded-lg text-sm font-medium text-white bg-gradient-to-r from-green-600 to-emerald-700 hover:from-green-700 hover:to-emerald-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center"
          >
            {isSubmitting || loading ? (
              <>
                <Loader className="w-4 h-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4 mr-2" />
                Mark as Paid
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default FundingSourceModal;