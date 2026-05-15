// src/components/Expenses/BudgetTypeSelector.jsx
import React from 'react';
import { Calendar, CalendarDays, CalendarRange, Target } from 'lucide-react';

const BudgetTypeSelector = ({ value, onChange, className = '' }) => {
  const budgetTypes = [
    {
      value: 'recurring',
      label: 'Recurring Budget',
      description: 'Monthly, quarterly, or yearly recurring expenses',
      icon: Calendar,
      color: 'blue'
    },
    {
      value: 'one-time',
      label: 'One-Time Budget',
      description: 'Single occurrence expenses (equipment, events, projects)',
      icon: Target,
      color: 'purple'
    },
    {
      value: 'none',
      label: 'No Budget',
      description: 'Track expenses without budget limits',
      icon: CalendarDays,
      color: 'gray'
    }
  ];

  return (
    <div className={`space-y-3 ${className}`}>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Budget Type *
      </label>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {budgetTypes.map((type) => {
          const Icon = type.icon;
          const isSelected = value === type.value;
          
          return (
            <button
              key={type.value}
              type="button"
              onClick={() => onChange(type.value)}
              className={`p-4 border-2 rounded-xl text-left transition-all ${
                isSelected
                  ? `border-${type.color}-500 bg-${type.color}-50 ring-2 ring-${type.color}-200`
                  : 'border-gray-200 hover:border-gray-300 bg-white'
              }`}
            >
              <div className="flex items-start space-x-3">
                <div className={`p-2 rounded-lg ${
                  isSelected ? `bg-${type.color}-100` : 'bg-gray-100'
                }`}>
                  <Icon className={`w-5 h-5 ${
                    isSelected ? `text-${type.color}-600` : 'text-gray-500'
                  }`} />
                </div>
                <div className="flex-1">
                  <p className={`font-medium ${isSelected ? `text-${type.color}-700` : 'text-gray-900'}`}>
                    {type.label}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {type.description}
                  </p>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default BudgetTypeSelector;