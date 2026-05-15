// src/components/Expenses/RecurringBudgetForm.jsx
import React from 'react';
import { Calendar, DollarSign, AlertCircle } from 'lucide-react';
import { formatCurrency } from '../../utils/feeFormatter';

const RecurringBudgetForm = ({ formData, onChange, errors = {} }) => {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Budget Amount */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Budget Amount *
          </label>
          <div className="relative">
            <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="number"
              name="budgetAmount"
              value={formData.budgetAmount || ''}
              onChange={(e) => onChange('budgetAmount', parseFloat(e.target.value) || 0)}
              step="1000"
              min="0"
              className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                errors.budgetAmount ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="0.00"
            />
          </div>
          {errors.budgetAmount && (
            <p className="mt-1 text-sm text-red-600 flex items-center">
              <AlertCircle className="w-4 h-4 mr-1" />
              {errors.budgetAmount}
            </p>
          )}
        </div>

        {/* Budget Period */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Budget Period *
          </label>
          <select
            value={formData.budgetPeriod || 'monthly'}
            onChange={(e) => onChange('budgetPeriod', e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="monthly">Monthly</option>
            <option value="quarterly">Quarterly</option>
            <option value="yearly">Yearly</option>
          </select>
        </div>
      </div>

      {/* Start and End Month (for yearly budgets that don't start in January) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Start Month
          </label>
          <select
            value={formData.budgetStartMonth || 1}
            onChange={(e) => onChange('budgetStartMonth', parseInt(e.target.value))}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(month => (
              <option key={month} value={month}>
                {new Date(2000, month - 1, 1).toLocaleString('default', { month: 'long' })}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            End Month
          </label>
          <select
            value={formData.budgetEndMonth || 12}
            onChange={(e) => onChange('budgetEndMonth', parseInt(e.target.value))}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(month => (
              <option key={month} value={month}>
                {new Date(2000, month - 1, 1).toLocaleString('default', { month: 'long' })}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="bg-blue-50 rounded-lg p-3">
        <div className="flex items-start">
          <Calendar className="w-4 h-4 text-blue-600 mt-0.5 mr-2" />
          <div>
            <h4 className="text-sm font-medium text-blue-800">Budget Calculation</h4>
            <p className="text-xs text-blue-700 mt-1">
              {formData.budgetPeriod === 'monthly' && `Monthly budget of ${formatCurrency(formData.budgetAmount || 0)} will be applied to each month.`}
              {formData.budgetPeriod === 'quarterly' && `Quarterly budget of ${formatCurrency(formData.budgetAmount || 0)} will be applied in the first month of each quarter.`}
              {formData.budgetPeriod === 'yearly' && `Yearly budget of ${formatCurrency(formData.budgetAmount || 0)} will be applied in ${new Date(2000, (formData.budgetStartMonth || 1) - 1, 1).toLocaleString('default', { month: 'long' })}.`}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RecurringBudgetForm;