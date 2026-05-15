import React from 'react';
import { Filter, X } from 'lucide-react';

const EventFilters = ({ filters, onFilterChange, onClearFilters }) => {
  const eventTypes = [
    { value: '', label: 'All Events' },
    { value: 'academic', label: 'Academic' },
    { value: 'social', label: 'Social' },
    { value: 'holiday', label: 'Holiday' },
    { value: 'administrative', label: 'Administrative' },
    { value: 'closure', label: 'Closure' }
  ];

  const handleTypeChange = (e) => {
    onFilterChange({ eventType: e.target.value });
  };

  const handleUpcomingChange = (e) => {
    onFilterChange({ upcoming: e.target.checked });
  };

  const hasActiveFilters = filters.eventType !== '';

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center space-x-2">
          <Filter className="w-4 h-4 text-gray-500" />
          <span className="text-sm font-medium text-gray-700">Filters</span>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Event Type Filter */}
          <select
            value={filters.eventType}
            onChange={handleTypeChange}
            className="px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
          >
            {eventTypes.map(type => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
          
          {/* Upcoming Only Toggle */}
          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="checkbox"
              checked={filters.upcoming}
              onChange={handleUpcomingChange}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">Show upcoming only</span>
          </label>
          
          {/* Clear Filters Button */}
          {hasActiveFilters && (
            <button
              onClick={onClearFilters}
              className="flex items-center gap-1 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-md transition-colors"
            >
              <X className="w-3.5 h-3.5" />
              Clear filters
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default EventFilters;