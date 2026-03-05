// src/components/Attendance/DateRangePicker.jsx
import React, { useState, useEffect, useRef } from 'react';
import {
  Calendar,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Check,
  X,
  Download,
  Filter,
  RefreshCw,
  TrendingUp
} from 'lucide-react';
import { useAttendanceStore } from '../../stores/attendanceStore';
import toast from 'react-hot-toast';

const DateRangePicker = ({ courseId, onRangeChange, showExport = true }) => {
  const {
    selectedDateRange,
    dateRangeOptions,
    setDateRange,
    reportFilters,
    setReportFilters,
    exportReport,
    fetchAttendanceReport,
    reportLoading
  } = useAttendanceStore();

  const [isOpen, setIsOpen] = useState(false);
  const [showCustomPicker, setShowCustomPicker] = useState(false);
  const [customStartDate, setCustomStartDate] = useState(selectedDateRange.startDate);
  const [customEndDate, setCustomEndDate] = useState(selectedDateRange.endDate);
  const [showFilters, setShowFilters] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  
  const dropdownRef = useRef(null);
  const exportMenuRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
        setShowCustomPicker(false);
      }
      if (exportMenuRef.current && !exportMenuRef.current.contains(event.target)) {
        setShowExportMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleRangeSelect = (range) => {
    setDateRange(range);
    setIsOpen(false);
    setShowCustomPicker(false);
    if (onRangeChange) onRangeChange(range);
    toast.success(`Showing ${range.label}`);
  };

  const handleCustomRangeApply = () => {
    if (new Date(customStartDate) > new Date(customEndDate)) {
      toast.error('Start date cannot be after end date');
      return;
    }

    const customRange = {
      label: 'Custom Range',
      startDate: customStartDate,
      endDate: customEndDate
    };

    setDateRange(customRange);
    setIsOpen(false);
    setShowCustomPicker(false);
    if (onRangeChange) onRangeChange(customRange);
    toast.success('Custom range applied');
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setReportFilters({ [name]: value });
  };

  const handleExport = async (format) => {
    setShowExportMenu(false);
    const result = await exportReport(format);
    if (result.success) {
      toast.success(`Report exported as ${format.toUpperCase()}`);
    }
  };

  const handleRefresh = () => {
    fetchAttendanceReport();
    toast.success('Report refreshed');
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getQuickStats = () => {
    const start = new Date(selectedDateRange.startDate);
    const end = new Date(selectedDateRange.endDate);
    const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
    
    if (days === 1) return '1 day';
    if (days < 7) return `${days} days`;
    if (days === 7) return '1 week';
    if (days < 30) return `${Math.floor(days / 7)} weeks`;
    if (days === 30) return '1 month';
    if (days < 365) return `${Math.floor(days / 30)} months`;
    return `${Math.floor(days / 365)} years`;
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
        {/* Left side - Date Range Selector */}
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Calendar className="w-5 h-5 text-purple-600" />
            <span className="text-sm font-medium text-gray-700">Date Range:</span>
          </div>

          {/* Range Selector Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
            >
              <span>{selectedDateRange.label}</span>
              <ChevronDown className="w-4 h-4 ml-2" />
            </button>

            {isOpen && (
              <div className="absolute left-0 mt-2 w-72 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                <div className="p-2">
                  {/* Predefined ranges */}
                  <div className="space-y-1">
                    {dateRangeOptions.map((range, index) => (
                      <button
                        key={index}
                        onClick={() => handleRangeSelect(range)}
                        className={`w-full text-left px-4 py-2 text-sm rounded-lg transition-colors ${
                          selectedDateRange.label === range.label
                            ? 'bg-purple-100 text-purple-700'
                            : 'hover:bg-gray-100 text-gray-700'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span>{range.label}</span>
                          {selectedDateRange.label === range.label && (
                            <Check className="w-4 h-4 text-purple-600" />
                          )}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {formatDate(range.startDate)} - {formatDate(range.endDate)}
                        </div>
                      </button>
                    ))}
                  </div>

                  {/* Custom range option */}
                  <div className="border-t border-gray-200 mt-2 pt-2">
                    {!showCustomPicker ? (
                      <button
                        onClick={() => setShowCustomPicker(true)}
                        className="w-full text-left px-4 py-2 text-sm text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                      >
                        + Custom Range
                      </button>
                    ) : (
                      <div className="p-2 space-y-3">
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">Start Date</label>
                          <input
                            type="date"
                            value={customStartDate}
                            onChange={(e) => setCustomStartDate(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">End Date</label>
                          <input
                            type="date"
                            value={customEndDate}
                            onChange={(e) => setCustomEndDate(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                          />
                        </div>
                        <div className="flex space-x-2">
                          <button
                            onClick={handleCustomRangeApply}
                            className="flex-1 px-3 py-2 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 transition-colors"
                          >
                            Apply
                          </button>
                          <button
                            onClick={() => setShowCustomPicker(false)}
                            className="px-3 py-2 border border-gray-300 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Range info */}
          <div className="text-sm text-gray-500">
            {formatDate(selectedDateRange.startDate)} - {formatDate(selectedDateRange.endDate)}
            <span className="ml-2 text-xs bg-gray-100 px-2 py-1 rounded-full">
              {getQuickStats()}
            </span>
          </div>
        </div>

        {/* Right side - Actions */}
        <div className="flex items-center space-x-2">
          {/* Filter Button */}
          <div className="relative">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`p-2 rounded-lg transition-colors ${
                reportFilters.status 
                  ? 'bg-purple-100 text-purple-600' 
                  : 'text-gray-500 hover:bg-gray-100'
              }`}
              title="Filter by status"
            >
              <Filter className="w-4 h-4" />
            </button>

            {showFilters && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-50 p-3">
                <label className="block text-xs text-gray-500 mb-2">Filter by Status</label>
                <select
                  name="status"
                  value={reportFilters.status}
                  onChange={handleFilterChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                >
                  <option value="">All Statuses</option>
                  <option value="present">Present</option>
                  <option value="absent">Absent</option>
                  <option value="late">Late</option>
                  <option value="excused">Excused</option>
                </select>

                <label className="block text-xs text-gray-500 mt-3 mb-2">Group By</label>
                <select
                  name="groupBy"
                  value={reportFilters.groupBy}
                  onChange={handleFilterChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                >
                  <option value="day">Day</option>
                  <option value="week">Week</option>
                  <option value="month">Month</option>
                </select>

                <button
                  onClick={() => {
                    setReportFilters({ status: '', groupBy: 'day' });
                    setShowFilters(false);
                  }}
                  className="mt-3 w-full text-center text-xs text-purple-600 hover:text-purple-700"
                >
                  Clear Filters
                </button>
              </div>
            )}
          </div>

          {/* Refresh Button */}
          <button
            onClick={handleRefresh}
            disabled={reportLoading}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${reportLoading ? 'animate-spin' : ''}`} />
          </button>

          {/* Export Button */}
          {showExport && (
            <div className="relative" ref={exportMenuRef}>
              <button
                onClick={() => setShowExportMenu(!showExportMenu)}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
              >
                <Download className="w-4 h-4 mr-2" />
                Export
                <ChevronDown className="w-4 h-4 ml-2" />
              </button>

              {showExportMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                  <div className="py-1">
                    <button
                      onClick={() => handleExport('csv')}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                    >
                      Export as CSV
                    </button>
                    <button
                      onClick={() => handleExport('excel')}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                    >
                      Export as Excel
                    </button>
                    <button
                      onClick={() => handleExport('pdf')}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                    >
                      Export as PDF
                    </button>
                    <div className="border-t border-gray-100 my-1"></div>
                    <button
                      onClick={() => {
                        setShowExportMenu(false);
                        // Print functionality
                        window.print();
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                    >
                      Print Report
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Quick Stats Row */}
      <div className="mt-4 flex items-center space-x-4 text-sm">
        <div className="flex items-center space-x-1 text-gray-500">
          <TrendingUp className="w-4 h-4" />
          <span>Period: {getQuickStats()}</span>
        </div>
        {reportFilters.status && (
          <div className="flex items-center space-x-1">
            <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full">
              Filter: {reportFilters.status}
            </span>
            <button
              onClick={() => setReportFilters({ status: '' })}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        )}
        {reportFilters.groupBy !== 'day' && (
          <div className="flex items-center space-x-1">
            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
              Grouped by: {reportFilters.groupBy}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default DateRangePicker;