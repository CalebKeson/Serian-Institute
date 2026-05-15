// src/components/Income/AllocationModal.jsx
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
  Wallet,
  Link as LinkIcon
} from 'lucide-react';
import { useExpenseStore } from '../../stores/expenseStore';
import { useIncomeStore } from '../../stores/incomeStore';
import { formatCurrency, formatDate } from '../../utils/feeFormatter';
import toast from 'react-hot-toast';

const AllocationModal = ({ isOpen, onClose, income, onSuccess }) => {
  const { expenses, fetchExpenses, loading: expensesLoading } = useExpenseStore();
  const { allocateIncome, loading: allocationLoading } = useIncomeStore();

  const [allocations, setAllocations] = useState([]);
  const [totalAllocated, setTotalAllocated] = useState(0);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch available expenses
  useEffect(() => {
    if (isOpen && income) {
      fetchExpenses({ status: 'approved,paid', limit: 100 });
    }
  }, [isOpen, income]);

  // Filter expenses that can be allocated
  const availableExpenses = expenses.filter(expense => {
    // Expenses that are approved or paid and have remaining balance
    const allocatedAmount = expense.allocatedAmount || 0;
    return (expense.status === 'approved' || expense.status === 'paid') && allocatedAmount < expense.totalAmount;
  });

  const handleAddAllocation = () => {
    setAllocations([...allocations, { id: Date.now(), expenseId: '', amount: 0 }]);
  };

  const handleRemoveAllocation = (id) => {
    setAllocations(allocations.filter(a => a.id !== id));
  };

  const handleAllocationChange = (id, field, value) => {
    const updatedAllocations = allocations.map(a => {
      if (a.id === id) {
        if (field === 'expenseId') {
          const selected = availableExpenses.find(e => e._id === value);
          return { ...a, expenseId: value, maxAmount: (selected?.totalAmount || 0) - (selected?.allocatedAmount || 0) };
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

  // Calculate total allocated
  useEffect(() => {
    const total = allocations.reduce((sum, a) => sum + (a.amount || 0), 0);
    setTotalAllocated(total);
  }, [allocations]);

  const validateAllocations = () => {
    const newErrors = {};
    
    if (allocations.length === 0) {
      newErrors.general = 'At least one expense is required';
    }
    
    let total = 0;
    allocations.forEach((a, index) => {
      if (!a.expenseId) {
        newErrors[`allocation_${index}`] = 'Select an expense';
      }
      if (!a.amount || a.amount <= 0) {
        newErrors[`allocation_${index}`] = 'Enter a valid amount';
      }
      if (a.maxAmount && a.amount > a.maxAmount) {
        newErrors[`allocation_${index}`] = `Amount exceeds remaining balance (${formatCurrency(a.maxAmount)})`;
      }
      total += a.amount || 0;
    });
    
    if (total > (income?.unallocatedAmount || 0)) {
      newErrors.general = `Total allocated (${formatCurrency(total)}) exceeds available unallocated amount (${formatCurrency(income?.unallocatedAmount || 0)})`;
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateAllocations()) {
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // For each allocation, call allocateIncome
      for (const allocation of allocations) {
        await allocateIncome(income._id, allocation.amount);
      }
      
      toast.success('Income allocated to expenses successfully!');
      if (onSuccess) onSuccess();
      onClose();
    } catch (error) {
      console.error('Allocation error:', error);
      toast.error('Failed to allocate income');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getExpenseDisplay = (expenseId) => {
    const expense = availableExpenses.find(e => e._id === expenseId);
    if (!expense) return null;
    const remaining = expense.totalAmount - (expense.allocatedAmount || 0);
    return {
      number: expense.expenseNumber,
      vendor: expense.vendor,
      description: expense.description,
      total: expense.totalAmount,
      remaining,
      date: expense.expenseDate
    };
  };

  if (!isOpen) return null;

  const remainingToAllocate = (income?.unallocatedAmount || 0) - totalAllocated;
  const isFullyAllocated = remainingToAllocate >= 0 && totalAllocated > 0 && remainingToAllocate === 0;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-full max-w-3xl shadow-lg rounded-xl bg-white">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <LinkIcon className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Allocate Income to Expenses</h2>
              <p className="text-sm text-gray-600">
                {income?.transactionNumber} - {formatCurrency(income?.amount)} available
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

        {/* Income Summary */}
        <div className="bg-green-50 rounded-lg p-4 mb-6">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-green-800">Available to Allocate</p>
              <p className="text-2xl font-bold text-green-700">{formatCurrency(income?.unallocatedAmount || 0)}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-green-800">Allocated So Far</p>
              <p className="text-2xl font-bold text-purple-600">{formatCurrency(totalAllocated)}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-green-800">Remaining</p>
              <p className={`text-2xl font-bold ${remainingToAllocate >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(Math.abs(remainingToAllocate))}
                {remainingToAllocate < 0 && ' over'}
              </p>
            </div>
          </div>
          <div className="mt-3">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="h-2 rounded-full bg-purple-500"
                style={{ width: `${(totalAllocated / (income?.unallocatedAmount || 1)) * 100}%` }}
              />
            </div>
          </div>
        </div>

        {/* Expenses List */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-gray-700">Select Expenses to Fund</h3>
            <button
              type="button"
              onClick={handleAddAllocation}
              className="text-sm text-purple-600 hover:text-purple-700 flex items-center"
            >
              <Plus className="w-4 h-4 mr-1" />
              Add Expense
            </button>
          </div>

          {expensesLoading ? (
            <div className="flex justify-center py-8">
              <Loader className="w-6 h-6 animate-spin text-purple-600" />
            </div>
          ) : availableExpenses.length === 0 ? (
            <div className="text-center py-8 bg-gray-50 rounded-lg border border-gray-200">
              <Wallet className="mx-auto h-12 w-12 text-gray-400" />
              <p className="mt-2 text-sm text-gray-500">No eligible expenses found</p>
              <p className="text-xs text-gray-400 mt-1">Expenses must be approved or paid and have remaining balance</p>
            </div>
          ) : allocations.length === 0 ? (
            <div className="text-center py-8 bg-gray-50 rounded-lg border border-gray-200">
              <LinkIcon className="mx-auto h-12 w-12 text-gray-400" />
              <p className="mt-2 text-sm text-gray-500">No expenses selected</p>
              <button
                onClick={handleAddAllocation}
                className="mt-2 text-sm text-purple-600 hover:text-purple-700"
              >
                Add an expense to allocate
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {allocations.map((allocation, index) => {
                const expenseInfo = getExpenseDisplay(allocation.expenseId);
                return (
                  <div key={allocation.id} className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex items-center space-x-3">
                      <div className="flex-1">
                        <select
                          value={allocation.expenseId}
                          onChange={(e) => handleAllocationChange(allocation.id, 'expenseId', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500"
                        >
                          <option value="">Select Expense</option>
                          {availableExpenses.map(expense => {
                            const remaining = expense.totalAmount - (expense.allocatedAmount || 0);
                            return (
                              <option key={expense._id} value={expense._id}>
                                {expense.expenseNumber} - {expense.vendor} - Available: {formatCurrency(remaining)}
                              </option>
                            );
                          })}
                        </select>
                        {expenseInfo && (
                          <div className="mt-2 text-xs text-gray-500">
                            <p>Vendor: {expenseInfo.vendor}</p>
                            <p>Total: {formatCurrency(expenseInfo.total)} | Remaining: {formatCurrency(expenseInfo.remaining)}</p>
                            <p className="text-xs">{expenseInfo.description}</p>
                          </div>
                        )}
                      </div>
                      <div className="w-40">
                        <input
                          type="number"
                          value={allocation.amount}
                          onChange={(e) => handleAllocationChange(allocation.id, 'amount', e.target.value)}
                          step="0.01"
                          min="0"
                          max={allocation.maxAmount}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-right focus:ring-2 focus:ring-purple-500"
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
                    </div>
                    {errors[`allocation_${index}`] && (
                      <p className="mt-1 text-xs text-red-600">{errors[`allocation_${index}`]}</p>
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
            disabled={isSubmitting || allocationLoading || allocations.length === 0 || !isFullyAllocated}
            className="px-4 py-2 border border-transparent rounded-lg text-sm font-medium text-white bg-gradient-to-r from-purple-600 to-indigo-700 hover:from-purple-700 hover:to-indigo-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center"
          >
            {isSubmitting || allocationLoading ? (
              <>
                <Loader className="w-4 h-4 mr-2 animate-spin" />
                Allocating...
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4 mr-2" />
                Allocate {formatCurrency(totalAllocated)} to Expenses
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AllocationModal;