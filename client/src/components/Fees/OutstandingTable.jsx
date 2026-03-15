// src/components/Fees/OutstandingTable.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import {
  Users,
  AlertCircle,
  DollarSign,
  TrendingUp,
  Eye,
  CreditCard,
  ChevronDown,
  ChevronUp,
  Search,
  Filter,
  Download,
  Mail,
  Phone,
  User,
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { formatCurrency, getFeeStatusBadge, getProgressColor } from '../../utils/feeFormatter';
import toast from 'react-hot-toast';

const OutstandingTable = ({
  students = [],
  loading = false,
  onViewStudent,
  onViewCourse,
  onRecordPayment,
  onExport,
  showActions = true,
  compact = false,
  title = 'Outstanding Balances',
  showFilters = true
}) => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortConfig, setSortConfig] = useState({
    key: 'totalBalance',
    direction: 'desc'
  });
  const [expandedRows, setExpandedRows] = useState([]);
  const [minBalance, setMinBalance] = useState(0);
  const [showFiltersPanel, setShowFiltersPanel] = useState(false);

  // Filter and sort students
  const filteredStudents = students
    .filter(student => {
      // Search filter
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        const matchesSearch = 
          student.studentName?.toLowerCase().includes(searchLower) ||
          student.studentNumber?.toLowerCase().includes(searchLower) ||
          student.email?.toLowerCase().includes(searchLower) ||
          student.phone?.toLowerCase().includes(searchLower);
        if (!matchesSearch) return false;
      }

      // Status filter
      if (statusFilter !== 'all') {
        if (statusFilter === 'unpaid' && student.totalPaid > 0) return false;
        if (statusFilter === 'partial' && (student.totalPaid === 0 || student.totalBalance === 0)) return false;
        if (statusFilter === 'paid' && student.totalBalance > 0) return false;
      }

      // Minimum balance filter
      if (student.totalBalance < minBalance) return false;

      return true;
    })
    .sort((a, b) => {
      let aVal = a[sortConfig.key];
      let bVal = b[sortConfig.key];

      if (sortConfig.key === 'studentName') {
        aVal = a.studentName || '';
        bVal = b.studentName || '';
      } else if (sortConfig.key === 'paymentPercentage') {
        aVal = a.paymentPercentage || 0;
        bVal = b.paymentPercentage || 0;
      }

      if (typeof aVal === 'string') {
        aVal = aVal.toLowerCase();
        bVal = bVal.toLowerCase();
      }

      if (sortConfig.direction === 'asc') {
        return aVal > bVal ? 1 : -1;
      } else {
        return aVal < bVal ? 1 : -1;
      }
    });

  // Calculate summary statistics
  const summary = {
    totalStudents: filteredStudents.length,
    totalOutstanding: filteredStudents.reduce((sum, s) => sum + s.totalBalance, 0),
    totalFees: filteredStudents.reduce((sum, s) => sum + s.totalFees, 0),
    totalPaid: filteredStudents.reduce((sum, s) => sum + s.totalPaid, 0),
    unpaidCount: filteredStudents.filter(s => s.totalPaid === 0).length,
    partialCount: filteredStudents.filter(s => s.totalPaid > 0 && s.totalBalance > 0).length,
    paidCount: filteredStudents.filter(s => s.totalBalance === 0).length
  };

  const handleSort = (key) => {
    setSortConfig({
      key,
      direction: sortConfig.key === key && sortConfig.direction === 'asc' ? 'desc' : 'asc'
    });
  };

  const toggleRowExpand = (studentId) => {
    setExpandedRows(prev =>
      prev.includes(studentId)
        ? prev.filter(id => id !== studentId)
        : [...prev, studentId]
    );
  };

  const handleExport = () => {
    if (onExport) {
      onExport(filteredStudents);
    } else {
      // Default export as CSV
      const headers = ['Student ID', 'Student Name', 'Email', 'Phone', 'Total Fees', 'Paid', 'Balance', 'Percentage', 'Status'];
      const csvData = filteredStudents.map(s => [
        s.studentNumber,
        s.studentName,
        s.email,
        s.phone,
        s.totalFees,
        s.totalPaid,
        s.totalBalance,
        `${s.paymentPercentage}%`,
        s.totalBalance === 0 ? 'Fully Paid' : s.totalPaid > 0 ? 'Partial' : 'Unpaid'
      ]);

      const csvContent = [headers, ...csvData]
        .map(row => row.join(','))
        .join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `outstanding_${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);

      toast.success('Outstanding list exported successfully');
    }
  };

  // FIXED: Handle record payment with navigation
  const handleRecordPaymentClick = (student) => {
    if (onRecordPayment) {
      onRecordPayment(student);
    } else {
      // Default navigation to record payment page
      const params = new URLSearchParams();
      params.append('studentId', student.studentId || student.studentNumber);
      navigate(`/fees/record-payment?${params.toString()}`);
    }
  };

  const getStatusBadge = (student) => {
    if (student.totalBalance === 0) {
      return { color: 'bg-green-100 text-green-800', icon: CheckCircle, label: 'Fully Paid' };
    }
    if (student.totalPaid > 0) {
      return { color: 'bg-yellow-100 text-yellow-800', icon: AlertTriangle, label: 'Partial' };
    }
    return { color: 'bg-red-100 text-red-800', icon: XCircle, label: 'Unpaid' };
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-6 animate-pulse">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex items-center space-x-4 mb-4">
              <div className="h-10 w-10 bg-gray-200 rounded-full"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/3"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (compact) {
    return (
      <div className="space-y-3">
        {filteredStudents.slice(0, 5).map((student) => {
          const status = getStatusBadge(student);
          const StatusIcon = status.icon;
          
          return (
            <div key={student.studentId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
              <div className="flex items-center space-x-3">
                <div className={`h-8 w-8 rounded-full flex items-center justify-center ${
                  student.totalBalance === 0 ? 'bg-green-100' :
                  student.totalPaid > 0 ? 'bg-yellow-100' : 'bg-red-100'
                }`}>
                  <StatusIcon className={`w-4 h-4 ${
                    student.totalBalance === 0 ? 'text-green-600' :
                    student.totalPaid > 0 ? 'text-yellow-600' : 'text-red-600'
                  }`} />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">{student.studentName}</p>
                  <p className="text-xs text-gray-500">{student.studentNumber}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-orange-600">{formatCurrency(student.totalBalance)}</p>
                <p className="text-xs text-gray-500">{student.paymentPercentage}% paid</p>
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-orange-50 to-red-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-5 h-5 text-orange-600" />
            <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
            <span className="px-2 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-medium">
              {filteredStudents.length} students
            </span>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={() => setShowFiltersPanel(!showFiltersPanel)}
              className="inline-flex items-center px-3 py-1.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
            >
              <Filter className="w-4 h-4 mr-2" />
              Filters
            </button>
            <button
              onClick={handleExport}
              className="inline-flex items-center px-3 py-1.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
            >
              <Download className="w-4 h-4 mr-2" />
              Export
            </button>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-4">
          <div className="bg-white rounded-lg p-2 text-center">
            <p className="text-xs text-gray-500">Total Outstanding</p>
            <p className="text-lg font-bold text-orange-600">{formatCurrency(summary.totalOutstanding)}</p>
          </div>
          <div className="bg-white rounded-lg p-2 text-center">
            <p className="text-xs text-gray-500">Total Fees</p>
            <p className="text-lg font-bold text-gray-900">{formatCurrency(summary.totalFees)}</p>
          </div>
          <div className="bg-white rounded-lg p-2 text-center">
            <p className="text-xs text-gray-500">Collection Rate</p>
            <p className="text-lg font-bold text-green-600">
              {summary.totalFees > 0 ? Math.round((summary.totalPaid / summary.totalFees) * 100) : 0}%
            </p>
          </div>
          <div className="bg-white rounded-lg p-2 text-center">
            <p className="text-xs text-gray-500">Unpaid</p>
            <p className="text-lg font-bold text-red-600">{summary.unpaidCount}</p>
          </div>
          <div className="bg-white rounded-lg p-2 text-center">
            <p className="text-xs text-gray-500">Partial</p>
            <p className="text-lg font-bold text-yellow-600">{summary.partialCount}</p>
          </div>
        </div>
      </div>

      {/* Filters Panel */}
      {showFiltersPanel && (
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search students..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              />
            </div>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            >
              <option value="all">All Statuses</option>
              <option value="unpaid">Unpaid Only</option>
              <option value="partial">Partial Payment</option>
              <option value="paid">Fully Paid</option>
            </select>

            {/* Min Balance Filter */}
            <select
              value={minBalance}
              onChange={(e) => setMinBalance(Number(e.target.value))}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            >
              <option value="0">All Balances</option>
              <option value="1000">≥ KSh 1,000</option>
              <option value="5000">≥ KSh 5,000</option>
              <option value="10000">≥ KSh 10,000</option>
              <option value="50000">≥ KSh 50,000</option>
            </select>

            {/* Clear Filters */}
            <button
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('all');
                setMinBalance(0);
              }}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
            >
              Clear Filters
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <button
                  onClick={() => handleSort('studentName')}
                  className="flex items-center space-x-1 hover:text-gray-700"
                >
                  <User className="w-3 h-3" />
                  <span>Student</span>
                  {sortConfig.key === 'studentName' && (
                    sortConfig.direction === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
                  )}
                </button>
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Contact
              </th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                <button
                  onClick={() => handleSort('totalFees')}
                  className="flex items-center justify-end space-x-1 hover:text-gray-700"
                >
                  <span>Total Fees</span>
                  {sortConfig.key === 'totalFees' && (
                    sortConfig.direction === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
                  )}
                </button>
              </th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                <button
                  onClick={() => handleSort('totalPaid')}
                  className="flex items-center justify-end space-x-1 hover:text-gray-700"
                >
                  <span>Paid</span>
                  {sortConfig.key === 'totalPaid' && (
                    sortConfig.direction === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
                  )}
                </button>
              </th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                <button
                  onClick={() => handleSort('totalBalance')}
                  className="flex items-center justify-end space-x-1 hover:text-gray-700"
                >
                  <span>Balance</span>
                  {sortConfig.key === 'totalBalance' && (
                    sortConfig.direction === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
                  )}
                </button>
              </th>
              <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                <button
                  onClick={() => handleSort('paymentPercentage')}
                  className="flex items-center justify-center space-x-1 hover:text-gray-700"
                >
                  <span>Progress</span>
                  {sortConfig.key === 'paymentPercentage' && (
                    sortConfig.direction === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
                  )}
                </button>
              </th>
              <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              {showActions && (
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              )}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredStudents.length > 0 ? (
              filteredStudents.map((student) => {
                const status = getStatusBadge(student);
                const StatusIcon = status.icon;
                const isExpanded = expandedRows.includes(student.studentId);
                const progressColor = getProgressColor(student.paymentPercentage);

                return (
                  <React.Fragment key={student.studentId}>
                    <tr className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                            student.totalBalance === 0 ? 'bg-green-100' :
                            student.totalPaid > 0 ? 'bg-yellow-100' : 'bg-red-100'
                          }`}>
                            <StatusIcon className={`w-5 h-5 ${
                              student.totalBalance === 0 ? 'text-green-600' :
                              student.totalPaid > 0 ? 'text-yellow-600' : 'text-red-600'
                            }`} />
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {student.studentName}
                            </div>
                            <div className="text-xs text-gray-500">
                              {student.studentNumber}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 flex items-center">
                          <Mail className="w-3 h-3 mr-1 text-gray-400" />
                          {student.email}
                        </div>
                        <div className="text-sm text-gray-500 flex items-center mt-1">
                          <Phone className="w-3 h-3 mr-1 text-gray-400" />
                          {student.phone}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium text-gray-900">
                        {formatCurrency(student.totalFees)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium text-green-600">
                        {formatCurrency(student.totalPaid)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-bold text-orange-600">
                        {formatCurrency(student.totalBalance)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center justify-center space-x-2">
                          <span className={`text-sm font-medium ${
                            student.paymentPercentage >= 75 ? 'text-green-600' :
                            student.paymentPercentage >= 50 ? 'text-yellow-600' :
                            student.paymentPercentage >= 25 ? 'text-orange-600' :
                            'text-red-600'
                          }`}>
                            {student.paymentPercentage}%
                          </span>
                          <div className="w-16 bg-gray-200 rounded-full h-1.5">
                            <div
                              className={`h-1.5 rounded-full ${progressColor}`}
                              style={{ width: `${Math.min(100, student.paymentPercentage)}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${status.color}`}>
                          <StatusIcon className="w-3 h-3 mr-1" />
                          {status.label}
                        </span>
                      </td>
                      {showActions && (
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center justify-end space-x-2">
                            <button
                              onClick={() => toggleRowExpand(student.studentId)}
                              className="text-gray-400 hover:text-gray-600 p-1 rounded hover:bg-gray-100 transition-colors"
                              title="View details"
                            >
                              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                            </button>

                            {onViewStudent && (
                              <button
                                onClick={() => onViewStudent(student.studentId)}
                                className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50 transition-colors"
                                title="View student fees"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                            )}

                            <button
                              onClick={() => handleRecordPaymentClick(student)}
                              className="text-green-600 hover:text-green-900 p-1 rounded hover:bg-green-50 transition-colors"
                              title="Record payment"
                            >
                              <CreditCard className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>

                    {/* Expanded Row - Course Breakdown */}
                    {isExpanded && student.courses && student.courses.length > 0 && (
                      <tr className="bg-gray-50">
                        <td colSpan={showActions ? 8 : 7} className="px-6 py-4">
                          <div className="space-y-3">
                            <h4 className="text-sm font-medium text-gray-700">Course-wise Breakdown</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              {student.courses.map((course, idx) => {
                                const courseStatus = course.balance === 0 ? 'paid' : course.paid > 0 ? 'partial' : 'unpaid';
                                const courseStatusBadge = getFeeStatusBadge(courseStatus);
                                
                                return (
                                  <div key={idx} className="bg-white p-3 rounded-lg border border-gray-200">
                                    <div className="flex items-center justify-between mb-2">
                                      <div>
                                        <p className="text-sm font-medium text-gray-900">{course.courseName}</p>
                                        <p className="text-xs text-gray-500">{course.courseCode}</p>
                                      </div>
                                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${courseStatusBadge.color}`}>
                                        {courseStatusBadge.label}
                                      </span>
                                    </div>
                                    <div className="grid grid-cols-3 gap-2 text-xs">
                                      <div>
                                        <p className="text-gray-500">Fee</p>
                                        <p className="font-medium text-gray-900">{formatCurrency(course.price)}</p>
                                      </div>
                                      <div>
                                        <p className="text-gray-500">Paid</p>
                                        <p className="font-medium text-green-600">{formatCurrency(course.paid)}</p>
                                      </div>
                                      <div>
                                        <p className="text-gray-500">Balance</p>
                                        <p className="font-medium text-orange-600">{formatCurrency(course.balance)}</p>
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>

                            {onViewCourse && (
                              <div className="flex justify-end mt-2">
                                <button
                                  onClick={() => onViewCourse(student.studentId)}
                                  className="text-sm text-blue-600 hover:text-blue-700 flex items-center"
                                >
                                  View all courses
                                  <ArrowUpRight className="w-4 h-4 ml-1" />
                                </button>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })
            ) : (
              <tr>
                <td colSpan={showActions ? 8 : 7} className="px-6 py-12 text-center text-gray-500">
                  <Users className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <p className="text-lg font-medium text-gray-900 mb-2">No outstanding balances found</p>
                  <p className="text-sm">
                    {searchTerm || statusFilter !== 'all' || minBalance > 0
                      ? 'Try adjusting your filters'
                      : 'All students have fully paid their fees'}
                  </p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      {filteredStudents.length > 0 && (
        <div className="px-6 py-3 bg-gray-50 border-t border-gray-200">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center space-x-4">
              <span className="text-gray-500">
                Showing {filteredStudents.length} of {students.length} students
              </span>
              <span className="flex items-center">
                <span className="w-2 h-2 rounded-full bg-red-500 mr-1"></span>
                Unpaid: {summary.unpaidCount}
              </span>
              <span className="flex items-center">
                <span className="w-2 h-2 rounded-full bg-yellow-500 mr-1"></span>
                Partial: {summary.partialCount}
              </span>
              <span className="flex items-center">
                <span className="w-2 h-2 rounded-full bg-green-500 mr-1"></span>
                Paid: {summary.paidCount}
              </span>
            </div>
            <div className="text-orange-600 font-medium">
              Total Outstanding: {formatCurrency(summary.totalOutstanding)}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OutstandingTable;