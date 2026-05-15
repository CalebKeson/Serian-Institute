// src/components/Expenses/ApprovalModal.jsx
import React, { useState } from 'react';
import {
  X,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader,
  User,
  Calendar,
  DollarSign
} from 'lucide-react';
import { formatCurrency, formatDate } from '../../utils/feeFormatter';

const ApprovalModal = ({ isOpen, onClose, onApprove, expense, loading }) => {
  const [comments, setComments] = useState('');
  const [action, setAction] = useState('approve');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    await onApprove(comments, action);
    setIsSubmitting(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-full max-w-lg shadow-lg rounded-xl bg-white">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <CheckCircle className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Approve Expense</h2>
              <p className="text-sm text-gray-600">
                {expense?.expenseNumber} - {formatCurrency(expense?.totalAmount)}
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
          <h3 className="text-sm font-medium text-gray-700 mb-3">Expense Summary</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">Vendor</span>
              <span className="text-sm font-medium text-gray-900">{expense?.vendor}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">Description</span>
              <span className="text-sm text-gray-900 truncate max-w-[200px]">{expense?.description}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">Date</span>
              <span className="text-sm text-gray-900">{formatDate(expense?.expenseDate)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">Total Amount</span>
              <span className="text-lg font-bold text-red-600">{formatCurrency(expense?.totalAmount)}</span>
            </div>
          </div>
        </div>

        {/* Action Selection */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Decision *
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setAction('approve')}
              className={`p-3 border rounded-lg flex flex-col items-center space-y-2 transition-all ${
                action === 'approve'
                  ? 'border-green-500 bg-green-50 ring-2 ring-green-200'
                  : 'border-gray-200 hover:border-green-300 hover:bg-green-50/50'
              }`}
            >
              <CheckCircle className={`w-6 h-6 ${action === 'approve' ? 'text-green-600' : 'text-gray-400'}`} />
              <span className={`text-sm font-medium ${action === 'approve' ? 'text-green-700' : 'text-gray-600'}`}>
                Approve
              </span>
              <span className="text-xs text-gray-500">Expense is valid</span>
            </button>
            <button
              type="button"
              onClick={() => setAction('reject')}
              className={`p-3 border rounded-lg flex flex-col items-center space-y-2 transition-all ${
                action === 'reject'
                  ? 'border-red-500 bg-red-50 ring-2 ring-red-200'
                  : 'border-gray-200 hover:border-red-300 hover:bg-red-50/50'
              }`}
            >
              <XCircle className={`w-6 h-6 ${action === 'reject' ? 'text-red-600' : 'text-gray-400'}`} />
              <span className={`text-sm font-medium ${action === 'reject' ? 'text-red-700' : 'text-gray-600'}`}>
                Reject
              </span>
              <span className="text-xs text-gray-500">Request changes</span>
            </button>
          </div>
        </div>

        {/* Comments */}
        <div className="mb-6">
          <label htmlFor="comments" className="block text-sm font-medium text-gray-700 mb-2">
            Comments (Optional)
          </label>
          <textarea
            id="comments"
            rows={3}
            value={comments}
            onChange={(e) => setComments(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder={action === 'approve' 
              ? "Add any approval notes..." 
              : "Please provide reason for rejection..."}
          />
        </div>

        {/* Warning for Large Expenses */}
        {expense?.totalAmount > 100000 && (
          <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <div className="flex items-start">
              <AlertCircle className="w-4 h-4 text-yellow-600 mt-0.5 mr-2" />
              <p className="text-sm text-yellow-700">
                This is a large expense ({formatCurrency(expense.totalAmount)}). 
                Please verify all details before approving.
              </p>
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
            disabled={isSubmitting || loading}
            className={`px-4 py-2 border border-transparent rounded-lg text-sm font-medium text-white transition-all flex items-center ${
              action === 'approve'
                ? 'bg-green-600 hover:bg-green-700'
                : 'bg-red-600 hover:bg-red-700'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {isSubmitting || loading ? (
              <>
                <Loader className="w-4 h-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                {action === 'approve' ? (
                  <CheckCircle className="w-4 h-4 mr-2" />
                ) : (
                  <XCircle className="w-4 h-4 mr-2" />
                )}
                {action === 'approve' ? 'Approve Expense' : 'Reject Expense'}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ApprovalModal;