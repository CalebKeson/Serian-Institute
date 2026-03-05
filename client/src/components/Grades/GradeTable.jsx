// src/components/Grades/GradeTable.jsx
import React, { useState, useEffect } from 'react';
import {
  Table,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  Download,
  Filter,
  Search,
  ChevronDown,
  ChevronUp,
  CheckCircle,
  XCircle,
  Clock,
  Award,
  TrendingUp,
  TrendingDown,
  Minus,
  MoreVertical,
  Check,
  X
} from 'lucide-react';
import { gradeAPI } from '../../services/gradeAPI';
import { useGradeStore } from '../../stores/gradeStore';
import toast from 'react-hot-toast';

const GradeTable = ({
  grades = [],
  loading = false,
  onEdit,
  onDelete,
  onView,
  onPublish,
  onExport,
  currentUser,
  courseId,
  showStudentInfo = true,
  showActions = true,
  showFilters = true,
  compact = false
}) => {
  const {
    selectedGrades,
    selectGrade,
    deselectGrade,
    selectAllGrades,
    clearSelectedGrades,
    filters,
    setFilters
  } = useGradeStore();

  const [sortConfig, setSortConfig] = useState({
    key: 'assessmentDate',
    direction: 'desc'
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedRows, setExpandedRows] = useState([]);
  const [showColumnSelector, setShowColumnSelector] = useState(false);
  const [visibleColumns, setVisibleColumns] = useState({
    student: true,
    assessment: true,
    score: true,
    percentage: true,
    letterGrade: true,
    date: true,
    status: true,
    actions: true
  });

  // Assessment types for filtering
  const assessmentTypes = gradeAPI.getAssessmentTypes();
  
  // Terms for filtering
  const terms = gradeAPI.getTerms();
  
  // Academic years for filtering
  const academicYears = gradeAPI.getAcademicYears();

  // Handle sorting
  const handleSort = (key) => {
    setSortConfig({
      key,
      direction: sortConfig.key === key && sortConfig.direction === 'asc' ? 'desc' : 'asc'
    });
  };

  // Sort grades
  const sortedGrades = [...grades].sort((a, b) => {
    let aVal = a[sortConfig.key];
    let bVal = b[sortConfig.key];

    // Handle nested values
    if (sortConfig.key === 'studentName') {
      aVal = a.student?.user?.name || '';
      bVal = b.student?.user?.name || '';
    } else if (sortConfig.key === 'studentId') {
      aVal = a.student?.studentId || '';
      bVal = b.student?.studentId || '';
    } else if (sortConfig.key === 'courseName') {
      aVal = a.course?.name || '';
      bVal = b.course?.name || '';
    }

    if (typeof aVal === 'string') {
      aVal = aVal.toLowerCase();
      bVal = bVal.toLowerCase();
    }

    if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
    if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
    return 0;
  });

  // Filter grades by search term
  const filteredGrades = sortedGrades.filter(grade => {
    if (!searchTerm) return true;
    
    const searchLower = searchTerm.toLowerCase();
    const studentName = grade.student?.user?.name?.toLowerCase() || '';
    const studentId = grade.student?.studentId?.toLowerCase() || '';
    const assessmentName = grade.assessmentName?.toLowerCase() || '';
    const courseName = grade.course?.name?.toLowerCase() || '';
    
    return studentName.includes(searchLower) ||
           studentId.includes(searchLower) ||
           assessmentName.includes(searchLower) ||
           courseName.includes(searchLower);
  });

  // Toggle row expansion
  const toggleRowExpand = (gradeId) => {
    setExpandedRows(prev =>
      prev.includes(gradeId)
        ? prev.filter(id => id !== gradeId)
        : [...prev, gradeId]
    );
  };

  // Handle select all
  const handleSelectAll = () => {
    if (selectedGrades.length === filteredGrades.length) {
      clearSelectedGrades();
    } else {
      selectAllGrades();
    }
  };

  // Handle individual select
  const handleSelect = (gradeId) => {
    if (selectedGrades.includes(gradeId)) {
      deselectGrade(gradeId);
    } else {
      selectGrade(gradeId);
    }
  };

  // Get status badge
  const getStatusBadge = (grade) => {
    if (!grade.isPublished) {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
          <EyeOff className="w-3 h-3 mr-1" />
          Draft
        </span>
      );
    }
    
    if (grade.percentage >= 60) {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
          <CheckCircle className="w-3 h-3 mr-1" />
          Published
        </span>
      );
    }
    
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
        <Clock className="w-3 h-3 mr-1" />
        Pending
      </span>
    );
  };

  // Get percentage color
  const getPercentageColor = (percentage) => {
    if (percentage >= 90) return 'text-green-600';
    if (percentage >= 80) return 'text-blue-600';
    if (percentage >= 70) return 'text-yellow-600';
    if (percentage >= 60) return 'text-orange-600';
    return 'text-red-600';
  };

  // Get percentage background
  const getPercentageBg = (percentage) => {
    if (percentage >= 90) return 'bg-green-100';
    if (percentage >= 80) return 'bg-blue-100';
    if (percentage >= 70) return 'bg-yellow-100';
    if (percentage >= 60) return 'bg-orange-100';
    return 'bg-red-100';
  };

  // Format date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="mb-4 h-10 bg-gray-200 rounded"></div>
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-center space-x-4 p-4 border-b border-gray-200">
            <div className="h-4 w-4 bg-gray-200 rounded"></div>
            <div className="h-10 w-10 bg-gray-200 rounded-full"></div>
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-gray-200 rounded w-1/4"></div>
              <div className="h-3 bg-gray-200 rounded w-1/3"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (filteredGrades.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
        <Award className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">No grades found</h3>
        <p className="mt-1 text-sm text-gray-500">
          {searchTerm || filters.term || filters.assessmentType
            ? 'Try adjusting your filters'
            : 'Get started by adding a new grade'}
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      {/* Filters and Search */}
      {showFilters && (
        <div className="p-4 border-b border-gray-200 bg-gray-50">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search students, assessments..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              />
            </div>

            {/* Filter Dropdowns */}
            <div className="flex items-center space-x-2">
              <select
                value={filters.assessmentType}
                onChange={(e) => setFilters({ assessmentType: e.target.value })}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              >
                <option value="">All Types</option>
                {assessmentTypes.map(type => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>

              <select
                value={filters.term}
                onChange={(e) => setFilters({ term: e.target.value })}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              >
                <option value="">All Terms</option>
                {terms.map(term => (
                  <option key={term.value} value={term.value}>
                    {term.label}
                  </option>
                ))}
              </select>

              <select
                value={filters.academicYear}
                onChange={(e) => setFilters({ academicYear: e.target.value })}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              >
                <option value="">All Years</option>
                {academicYears.map(year => (
                  <option key={year.value} value={year.value}>
                    {year.label}
                  </option>
                ))}
              </select>

              {/* Column Selector */}
              <div className="relative">
                <button
                  onClick={() => setShowColumnSelector(!showColumnSelector)}
                  className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                  title="Select columns"
                >
                  <Table className="w-4 h-4" />
                </button>

                {showColumnSelector && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-50 p-3">
                    <h4 className="text-xs font-medium text-gray-500 mb-2">Show/Hide Columns</h4>
                    <div className="space-y-2">
                      {Object.entries(visibleColumns).map(([key, visible]) => (
                        <label key={key} className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={visible}
                            onChange={(e) => setVisibleColumns(prev => ({
                              ...prev,
                              [key]: e.target.checked
                            }))}
                            className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                          />
                          <span className="text-sm text-gray-700 capitalize">
                            {key.replace(/([A-Z])/g, ' $1').trim()}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Export Button */}
              {onExport && (
                <button
                  onClick={onExport}
                  className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </button>
              )}
            </div>
          </div>

          {/* Active Filters */}
          {(filters.assessmentType || filters.term || filters.academicYear || searchTerm) && (
            <div className="flex flex-wrap items-center gap-2 mt-3">
              <span className="text-xs text-gray-500">Active filters:</span>
              {filters.assessmentType && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-purple-100 text-purple-700">
                  Type: {assessmentTypes.find(t => t.value === filters.assessmentType)?.label}
                  <button
                    onClick={() => setFilters({ assessmentType: '' })}
                    className="ml-1 hover:text-purple-900"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              {filters.term && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-700">
                  Term: {filters.term}
                  <button
                    onClick={() => setFilters({ term: '' })}
                    className="ml-1 hover:text-blue-900"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              {filters.academicYear && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-700">
                  Year: {filters.academicYear}
                  <button
                    onClick={() => setFilters({ academicYear: '' })}
                    className="ml-1 hover:text-green-900"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              {searchTerm && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-yellow-100 text-yellow-700">
                  Search: {searchTerm}
                  <button
                    onClick={() => setSearchTerm('')}
                    className="ml-1 hover:text-yellow-900"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              <button
                onClick={() => {
                  setSearchTerm('');
                  setFilters({ assessmentType: '', term: '', academicYear: '' });
                }}
                className="text-xs text-purple-600 hover:text-purple-700"
              >
                Clear all
              </button>
            </div>
          )}
        </div>
      )}

      {/* Bulk Actions Bar */}
      {selectedGrades.length > 0 && (
        <div className="bg-purple-50 border-b border-purple-200 px-4 py-2 flex items-center justify-between">
          <span className="text-sm text-purple-700">
            {selectedGrades.length} grade{selectedGrades.length > 1 ? 's' : ''} selected
          </span>
          <div className="flex items-center space-x-2">
            {onPublish && (
              <button
                onClick={() => onPublish(selectedGrades)}
                className="px-3 py-1 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 transition-colors"
              >
                Publish Selected
              </button>
            )}
            <button
              onClick={clearSelectedGrades}
              className="px-3 py-1 border border-purple-300 text-purple-700 text-sm font-medium rounded-lg hover:bg-purple-100 transition-colors"
            >
              Clear
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {/* Select All Checkbox */}
              {showActions && (
                <th scope="col" className="px-4 py-3 w-10">
                  <input
                    type="checkbox"
                    checked={selectedGrades.length === filteredGrades.length && filteredGrades.length > 0}
                    onChange={handleSelectAll}
                    className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                  />
                </th>
              )}

              {/* Student Column */}
              {visibleColumns.student && showStudentInfo && (
                <th
                  scope="col"
                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:text-gray-700"
                  onClick={() => handleSort('studentName')}
                >
                  <div className="flex items-center space-x-1">
                    <span>Student</span>
                    {sortConfig.key === 'studentName' && (
                      sortConfig.direction === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
                    )}
                  </div>
                </th>
              )}

              {/* Assessment Column */}
              {visibleColumns.assessment && (
                <th
                  scope="col"
                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:text-gray-700"
                  onClick={() => handleSort('assessmentName')}
                >
                  <div className="flex items-center space-x-1">
                    <span>Assessment</span>
                    {sortConfig.key === 'assessmentName' && (
                      sortConfig.direction === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
                    )}
                  </div>
                </th>
              )}

              {/* Score Column */}
              {visibleColumns.score && (
                <th
                  scope="col"
                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:text-gray-700"
                  onClick={() => handleSort('score')}
                >
                  <div className="flex items-center space-x-1">
                    <span>Score</span>
                    {sortConfig.key === 'score' && (
                      sortConfig.direction === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
                    )}
                  </div>
                </th>
              )}

              {/* Percentage Column */}
              {visibleColumns.percentage && (
                <th
                  scope="col"
                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:text-gray-700"
                  onClick={() => handleSort('percentage')}
                >
                  <div className="flex items-center space-x-1">
                    <span>Percentage</span>
                    {sortConfig.key === 'percentage' && (
                      sortConfig.direction === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
                    )}
                  </div>
                </th>
              )}

              {/* Letter Grade Column */}
              {visibleColumns.letterGrade && (
                <th
                  scope="col"
                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:text-gray-700"
                  onClick={() => handleSort('letterGrade')}
                >
                  <div className="flex items-center space-x-1">
                    <span>Grade</span>
                    {sortConfig.key === 'letterGrade' && (
                      sortConfig.direction === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
                    )}
                  </div>
                </th>
              )}

              {/* Date Column */}
              {visibleColumns.date && (
                <th
                  scope="col"
                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:text-gray-700"
                  onClick={() => handleSort('assessmentDate')}
                >
                  <div className="flex items-center space-x-1">
                    <span>Date</span>
                    {sortConfig.key === 'assessmentDate' && (
                      sortConfig.direction === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
                    )}
                  </div>
                </th>
              )}

              {/* Status Column */}
              {visibleColumns.status && (
                <th
                  scope="col"
                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Status
                </th>
              )}

              {/* Actions Column */}
              {visibleColumns.actions && showActions && (
                <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              )}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredGrades.map((grade) => (
              <React.Fragment key={grade._id}>
                <tr className={`hover:bg-gray-50 transition-colors ${expandedRows.includes(grade._id) ? 'bg-purple-50' : ''}`}>
                  {/* Select Checkbox */}
                  {showActions && (
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selectedGrades.includes(grade._id)}
                        onChange={() => handleSelect(grade._id)}
                        className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                      />
                    </td>
                  )}

                  {/* Student Info */}
                  {visibleColumns.student && showStudentInfo && (
                    <td className="px-4 py-3">
                      <div className="flex items-center">
                        <div className="h-8 w-8 bg-gradient-to-r from-blue-600 to-indigo-700 rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="text-white font-medium text-xs">
                            {grade.student?.user?.name?.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div className="ml-3">
                          <div className="text-sm font-medium text-gray-900">
                            {grade.student?.user?.name || 'Unknown'}
                          </div>
                          <div className="text-xs text-gray-500">
                            {grade.student?.studentId || ''}
                          </div>
                        </div>
                      </div>
                    </td>
                  )}

                  {/* Assessment Info */}
                  {visibleColumns.assessment && (
                    <td className="px-4 py-3">
                      <div className="text-sm font-medium text-gray-900">
                        {grade.assessmentName}
                      </div>
                      <div className="text-xs text-gray-500 flex items-center">
                        <span className={`px-1.5 py-0.5 rounded-full bg-${assessmentTypes.find(t => t.value === grade.assessmentType)?.color}-100 text-${assessmentTypes.find(t => t.value === grade.assessmentType)?.color}-800`}>
                          {grade.assessmentType}
                        </span>
                        {grade.weight !== 1 && (
                          <span className="ml-2">Weight: {grade.weight}x</span>
                        )}
                      </div>
                    </td>
                  )}

                  {/* Score */}
                  {visibleColumns.score && (
                    <td className="px-4 py-3">
                      <div className="text-sm font-medium text-gray-900">
                        {grade.score} / {grade.maxScore}
                      </div>
                    </td>
                  )}

                  {/* Percentage */}
                  {visibleColumns.percentage && grade.percentage !== undefined && (
                    <td className="px-4 py-3">
                      <div className="flex items-center space-x-2">
                        <span className={`text-sm font-bold ${getPercentageColor(grade.percentage)}`}>
                          {grade.percentage.toFixed(1)}%
                        </span>
                        {!compact && (
                          <div className="w-16 bg-gray-200 rounded-full h-1.5">
                            <div
                              className={`h-1.5 rounded-full ${
                                grade.percentage >= 90 ? 'bg-green-500' :
                                grade.percentage >= 80 ? 'bg-blue-500' :
                                grade.percentage >= 70 ? 'bg-yellow-500' :
                                grade.percentage >= 60 ? 'bg-orange-500' :
                                'bg-red-500'
                              }`}
                              style={{ width: `${Math.min(100, grade.percentage)}%` }}
                            />
                          </div>
                        )}
                      </div>
                    </td>
                  )}

                  {/* Letter Grade */}
                  {visibleColumns.letterGrade && (
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium ${getPercentageBg(grade.percentage)} ${getPercentageColor(grade.percentage)}`}>
                        {grade.letterGrade || '-'}
                      </span>
                    </td>
                  )}

                  {/* Date */}
                  {visibleColumns.date && (
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {formatDate(grade.assessmentDate)}
                      {!compact && (
                        <div className="text-xs text-gray-400">
                          {grade.term} {grade.academicYear}
                        </div>
                      )}
                    </td>
                  )}

                  {/* Status */}
                  {visibleColumns.status && (
                    <td className="px-4 py-3">
                      {getStatusBadge(grade)}
                    </td>
                  )}

                  {/* Actions */}
                  {visibleColumns.actions && showActions && (
                    <td className="px-4 py-3 text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => toggleRowExpand(grade._id)}
                          className="text-gray-400 hover:text-gray-600 p-1 rounded hover:bg-gray-100 transition-colors"
                          title="View details"
                        >
                          {expandedRows.includes(grade._id) ? (
                            <ChevronUp className="w-4 h-4" />
                          ) : (
                            <ChevronDown className="w-4 h-4" />
                          )}
                        </button>
                        
                        {onView && (
                          <button
                            onClick={() => onView(grade)}
                            className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50 transition-colors"
                            title="View"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        )}
                        
                        {onEdit && currentUser?.role !== 'student' && (
                          <button
                            onClick={() => onEdit(grade)}
                            className="text-purple-600 hover:text-purple-900 p-1 rounded hover:bg-purple-50 transition-colors"
                            title="Edit"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                        )}
                        
                        {onDelete && currentUser?.role === 'admin' && (
                          <button
                            onClick={() => onDelete(grade)}
                            className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50 transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>

                {/* Expanded Row - Details */}
                {expandedRows.includes(grade._id) && (
                  <tr className="bg-gray-50 border-t border-gray-100">
                    <td colSpan={Object.values(visibleColumns).filter(Boolean).length + (showActions ? 1 : 0)} className="px-4 py-3">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Assessment Type</p>
                          <p className="font-medium text-gray-900 capitalize">{grade.assessmentType}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Weight</p>
                          <p className="font-medium text-gray-900">{grade.weight}x</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Graded By</p>
                          <p className="font-medium text-gray-900">{grade.gradedBy?.name || 'Unknown'}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Date Recorded</p>
                          <p className="font-medium text-gray-900">{formatDate(grade.dateRecorded)}</p>
                        </div>
                        {grade.comments && (
                          <div className="col-span-2 md:col-span-4">
                            <p className="text-xs text-gray-500 mb-1">Comments</p>
                            <p className="text-sm text-gray-700 bg-white p-2 rounded border border-gray-200">
                              {grade.comments}
                            </p>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>

      {/* Table Footer */}
      <div className="px-4 py-3 bg-gray-50 border-t border-gray-200">
        <div className="flex items-center justify-between text-sm text-gray-500">
          <span>
            Showing {filteredGrades.length} of {grades.length} grades
          </span>
          {selectedGrades.length > 0 && (
            <span className="text-purple-600">
              {selectedGrades.length} selected
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default GradeTable;