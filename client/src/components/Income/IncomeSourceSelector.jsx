// src/components/Income/IncomeSourceSelector.jsx
import React from 'react';
import {
  Wallet,
  Landmark,
  Heart,
  Coffee,
  MoreHorizontal,
  GraduationCap,
  CheckCircle
} from 'lucide-react';

const IncomeSourceSelector = ({ selected, onSelect, disabled = [] }) => {
  const sources = [
    {
      id: 'fees',
      label: 'Student Fees',
      icon: GraduationCap,
      color: 'blue',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      textColor: 'text-blue-700',
      description: 'Tuition, registration, and other student fees',
      redirectTo: '/fees/record-payment'
    },
    {
      id: 'director_investment',
      label: 'Director Investment',
      icon: Landmark,
      color: 'purple',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-200',
      textColor: 'text-purple-700',
      description: 'Capital investment from directors (repaid via shares/dividends)'
    },
    {
      id: 'grant',
      label: 'Grant',
      icon: Heart,
      color: 'pink',
      bgColor: 'bg-pink-50',
      borderColor: 'border-pink-200',
      textColor: 'text-pink-700',
      description: 'Government or organizational grants'
    },
    {
      id: 'donation',
      label: 'Donation',
      icon: Heart,
      color: 'red',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200',
      textColor: 'text-red-700',
      description: 'Donations from individuals, alumni, or organizations'
    },
    {
      id: 'auxiliary',
      label: 'Auxiliary Income',
      icon: Coffee,
      color: 'orange',
      bgColor: 'bg-orange-50',
      borderColor: 'border-orange-200',
      textColor: 'text-orange-700',
      description: 'Canteen, bookshop, uniform sales, facility rental'
    },
    {
      id: 'other',
      label: 'Other Income',
      icon: MoreHorizontal,
      color: 'gray',
      bgColor: 'bg-gray-50',
      borderColor: 'border-gray-200',
      textColor: 'text-gray-700',
      description: 'Miscellaneous income not covered by other categories'
    }
  ];

  const handleSelect = (source) => {
    if (disabled.includes(source.id)) return;
    
    if (source.id === 'fees') {
      // Redirect to fee payment page
      window.location.href = source.redirectTo;
      return;
    }
    
    onSelect(source.id);
  };

  const getIconBgColor = (color) => {
    const colors = {
      blue: 'bg-blue-100',
      purple: 'bg-purple-100',
      pink: 'bg-pink-100',
      red: 'bg-red-100',
      orange: 'bg-orange-100',
      gray: 'bg-gray-100'
    };
    return colors[color] || 'bg-gray-100';
  };

  const getIconColor = (color) => {
    const colors = {
      blue: 'text-blue-600',
      purple: 'text-purple-600',
      pink: 'text-pink-600',
      red: 'text-red-600',
      orange: 'text-orange-600',
      gray: 'text-gray-600'
    };
    return colors[color] || 'text-gray-600';
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {sources.map((source) => {
        const Icon = source.icon;
        const isSelected = selected === source.id;
        const isDisabled = disabled.includes(source.id);
        
        return (
          <button
            key={source.id}
            onClick={() => handleSelect(source)}
            disabled={isDisabled}
            className={`p-4 border-2 rounded-xl text-left transition-all ${
              isSelected
                ? `${source.bgColor} ${source.borderColor} ring-2 ring-${source.color}-200`
                : 'border-gray-200 hover:border-gray-300 bg-white'
            } ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:shadow-md'}`}
          >
            <div className="flex items-start space-x-4">
              <div className={`p-3 rounded-lg ${getIconBgColor(source.color)}`}>
                <Icon className={`w-6 h-6 ${getIconColor(source.color)}`} />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h3 className={`font-semibold ${isSelected ? source.textColor : 'text-gray-900'}`}>
                    {source.label}
                  </h3>
                  {isSelected && (
                    <CheckCircle className={`w-5 h-5 ${source.textColor}`} />
                  )}
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  {source.description}
                </p>
                {source.id === 'fees' && (
                  <p className="text-xs text-blue-500 mt-2 flex items-center">
                    <span>→ Redirects to fee payment system</span>
                  </p>
                )}
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
};

export default IncomeSourceSelector;