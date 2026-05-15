// src/components/Financial/QuickActions.jsx
import React from 'react';
import { useNavigate } from 'react-router';
import {
  Plus,
  TrendingUp,
  TrendingDown,
  UserPlus,
  FileText,
  BarChart3,
  DollarSign
} from 'lucide-react';

const QuickActions = () => {
  const navigate = useNavigate();

  const actions = [
    {
      label: 'Record Income',
      icon: Plus,
      color: 'green',
      bgColor: 'bg-green-100',
      hoverColor: 'hover:bg-green-200',
      textColor: 'text-green-700',
      onClick: () => navigate('/income/record')
    },
    {
      label: 'Record Expense',
      icon: TrendingDown,
      color: 'red',
      bgColor: 'bg-red-100',
      hoverColor: 'hover:bg-red-200',
      textColor: 'text-red-700',
      onClick: () => navigate('/expenses/add')
    },
    {
      label: 'Add Director',
      icon: UserPlus,
      color: 'purple',
      bgColor: 'bg-purple-100',
      hoverColor: 'hover:bg-purple-200',
      textColor: 'text-purple-700',
      onClick: () => navigate('/directors/add')
    },
    {
      label: 'Profit & Loss',
      icon: BarChart3,
      color: 'blue',
      bgColor: 'bg-blue-100',
      hoverColor: 'hover:bg-blue-200',
      textColor: 'text-blue-700',
      onClick: () => navigate('/financial/profit-loss')
    },
    {
      label: 'Cash Flow',
      icon: TrendingUp,
      color: 'teal',
      bgColor: 'bg-teal-100',
      hoverColor: 'hover:bg-teal-200',
      textColor: 'text-teal-700',
      onClick: () => navigate('/financial/cash-flow')
    },
    {
      label: 'Budget Report',
      icon: FileText,
      color: 'orange',
      bgColor: 'bg-orange-100',
      hoverColor: 'hover:bg-orange-200',
      textColor: 'text-orange-700',
      onClick: () => navigate('/financial/budget-vs-actual')
    }
  ];

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
        <DollarSign className="w-5 h-5 mr-2 text-purple-600" />
        Quick Actions
      </h3>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {actions.map((action, index) => {
          const Icon = action.icon;
          return (
            <button
              key={index}
              onClick={action.onClick}
              className={`flex flex-col items-center p-4 rounded-xl transition-all ${action.bgColor} ${action.hoverColor} group`}
            >
              <div className={`p-3 rounded-full bg-white shadow-sm mb-2 group-hover:scale-110 transition-transform`}>
                <Icon className={`w-5 h-5 ${action.textColor}`} />
              </div>
              <span className={`text-sm font-medium ${action.textColor}`}>{action.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default QuickActions;