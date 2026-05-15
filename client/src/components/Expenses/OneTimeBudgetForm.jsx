// src/components/Expenses/OneTimeBudgetForm.jsx
import React from 'react';
import { Calendar, DollarSign, AlertCircle, FileText } from 'lucide-react';
// import { formatCurrency } from '../../utils/feeFormatter';

const OneTimeBudgetForm = ({ formData, onChange, errors = {} }) => {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Description */}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Description *
          </label>
          <div className="relative">
            <FileText className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              name="description"
              value={formData.description || ''}
              onChange={(e) => onChange('description', e.target.value)}
              className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 ${
                errors.description ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="e.g., New Computer Equipment, Graduation Ceremony"
            />
          </div>
          {errors.description && (
            <p className="mt-1 text-sm text-red-600 flex items-center">
              <AlertCircle className="w-4 h-4 mr-1" />
              {errors.description}
            </p>
          )}
        </div>

        {/* Amount */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Amount *
          </label>
          <div className="relative">
            <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="number"
              name="amount"
              value={formData.amount || ''}
              onChange={(e) => onChange('amount', parseFloat(e.target.value) || 0)}
              step="1000"
              min="0"
              className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 ${
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

        {/* Date */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Date *
          </label>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="date"
              name="date"
              value={formData.date || ''}
              onChange={(e) => onChange('date', e.target.value)}
              className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 ${
                errors.date ? 'border-red-300' : 'border-gray-300'
              }`}
            />
          </div>
          {errors.date && (
            <p className="mt-1 text-sm text-red-600 flex items-center">
              <AlertCircle className="w-4 h-4 mr-1" />
              {errors.date}
            </p>
          )}
        </div>
      </div>

      {/* Status */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Status
        </label>
        <div className="flex space-x-4">
          <label className="flex items-center space-x-2">
            <input
              type="radio"
              name="status"
              value="planned"
              checked={formData.status === 'planned'}
              onChange={(e) => onChange('status', e.target.value)}
              className="rounded-full border-gray-300 text-purple-600 focus:ring-purple-500"
            />
            <span className="text-sm text-gray-700">Planned</span>
          </label>
          <label className="flex items-center space-x-2">
            <input
              type="radio"
              name="status"
              value="actual"
              checked={formData.status === 'actual'}
              onChange={(e) => onChange('status', e.target.value)}
              className="rounded-full border-gray-300 text-purple-600 focus:ring-purple-500"
            />
            <span className="text-sm text-gray-700">Actual/Completed</span>
          </label>
          <label className="flex items-center space-x-2">
            <input
              type="radio"
              name="status"
              value="cancelled"
              checked={formData.status === 'cancelled'}
              onChange={(e) => onChange('status', e.target.value)}
              className="rounded-full border-gray-300 text-purple-600 focus:ring-purple-500"
            />
            <span className="text-sm text-gray-700">Cancelled</span>
          </label>
        </div>
      </div>

      {/* Notes */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Notes (Optional)
        </label>
        <textarea
          name="notes"
          value={formData.notes || ''}
          onChange={(e) => onChange('notes', e.target.value)}
          rows={2}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
          placeholder="Additional details about this budget item..."
        />
      </div>
    </div>
  );
};

export default OneTimeBudgetForm;